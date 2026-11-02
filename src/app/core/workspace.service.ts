import { Inject, Injectable, computed, signal } from '@angular/core';
import Papa from 'papaparse';
import { analyzeQuality, buildColumns, filteredRows as applyWorkspaceFilters, inferDataType } from './analytics';
import { evaluateFormula } from './formula';
import { ANALYTICS_REPOSITORY, AnalyticsRepository } from './analytics.repository';
import { Dataset, ImportOptions, QualityIssue, Visualization, Workspace } from './models';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const DEFAULT_OPTIONS: ImportOptions = {
  delimiter: 'auto',
  firstRowHeaders: true,
  trimWhitespace: true,
};

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  readonly datasets = signal<Dataset[]>([]);
  readonly workspaces = signal<Workspace[]>([]);
  readonly activeDataset = signal<Dataset | null>(null);
  readonly workspace = signal<Workspace | null>(null);
  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly progress = signal(0);
  readonly error = signal('');
  readonly notice = signal('');
  readonly isReady = signal(false);
  readonly activeRows = computed(() => this.activeDataset()?.rows ?? []);

  private initializePromise?: Promise<void>;
  private calculatedCache?: { key: string; dataset: Dataset };
  private qualityCache?: { dataset: Dataset; issues: QualityIssue[] };
  private filteredRowsCache?: { dataset: Dataset; filtersKey: string; rows: Record<string, string>[] };
  private cancelCurrentImport?: () => void;

  constructor(@Inject(ANALYTICS_REPOSITORY) private readonly repository: AnalyticsRepository) {}

  initialize(): Promise<void> {
    this.initializePromise ??= this.loadLibrary();
    return this.initializePromise;
  }

  private async loadLibrary(): Promise<void> {
    this.loading.set(true);
    try {
      const datasets = await this.repository.listDatasets();
      this.datasets.set(datasets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      this.workspaces.set(await this.repository.listWorkspaces());
      this.isReady.set(true);
    } catch (error) {
      this.error.set(`Saved datasets could not be loaded: ${this.errorMessage(error)}`);
      this.isReady.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async importFile(file: File, options: ImportOptions = DEFAULT_OPTIONS): Promise<Dataset> {
    this.clearMessages();
    const invalidMessage = !/\.csv$/i.test(file.name)
      ? 'Choose a file with the .csv extension.'
      : !file.size
        ? 'This file is empty. Choose a CSV file with a header and at least one record.'
        : file.size > MAX_FILE_SIZE
          ? 'This file is larger than the 100 MB import limit.'
          : '';
    if (invalidMessage) {
      this.error.set(invalidMessage);
      throw new Error(invalidMessage);
    }

    this.loading.set(true);
    this.importing.set(true);
    this.progress.set(0);
    try {
      const { parsedRows, delimiter } = await this.parseCsv(file, options);
      if (!parsedRows.length) throw new Error('The CSV does not contain any records.');
      const sourceHeaders = options.firstRowHeaders
        ? parsedRows.shift()!.map((header, index) => this.headerName(header, index, options.trimWhitespace))
        : parsedRows[0].map((_, index) => `Column ${index + 1}`);
      if (!sourceHeaders.length || sourceHeaders.every((header) => !header)) {
        throw new Error('A header row could not be detected. Try importing without headers.');
      }
      const headers = this.uniqueHeaders(sourceHeaders);
      const malformedIndex = parsedRows.findIndex((row) => row.length !== headers.length);
      if (malformedIndex >= 0) {
        throw new Error(`Record ${malformedIndex + 1} has ${parsedRows[malformedIndex].length} fields; expected ${headers.length}. Nothing was imported.`);
      }
      const rows = parsedRows.map((values) => Object.fromEntries(
        headers.map((header, index) => [header, options.trimWhitespace ? (values[index] ?? '').trim() : (values[index] ?? '')]),
      ));
      const timestamp = new Date().toISOString();
      const dataset: Dataset = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.csv$/i, ''),
        fileName: file.name,
        fileSize: file.size,
        rowCount: rows.length,
        columnCount: headers.length,
        columns: buildColumns(headers, rows),
        rows,
        delimiter,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const workspace = this.createWorkspace(dataset, timestamp);
      await this.repository.saveImport(dataset, workspace);
      this.datasets.update((items) => [dataset, ...items]);
      this.workspaces.update((items) => [workspace, ...items]);
      this.activeDataset.set(dataset);
      this.workspace.set(workspace);
      this.notice.set(`${dataset.fileName} imported successfully.`);
      return dataset;
    } catch (error) {
      this.error.set(this.errorMessage(error));
      throw error;
    } finally {
      this.loading.set(false);
      this.importing.set(false);
      this.progress.set(0);
    }
  }

  cancelImport(): void {
    this.cancelCurrentImport?.();
  }

  private parseCsv(file: File, options: ImportOptions): Promise<{ parsedRows: string[][]; delimiter: string }> {
    return new Promise((resolve, reject) => {
      const parsedRows: string[][] = [];
      let parseErrors: Papa.ParseError[] = [];
      let activeParser: Papa.Parser | undefined;
      let canceled = false;
      let detectedDelimiter: string = options.delimiter === 'auto' ? ',' : options.delimiter;
      this.cancelCurrentImport = () => {
        canceled = true;
        activeParser?.abort();
      };
      Papa.parse<string[]>(file, {
        delimiter: options.delimiter === 'auto' ? '' : options.delimiter,
        header: false,
        dynamicTyping: false,
        skipEmptyLines: 'greedy',
        worker: true,
        chunkSize: 1024 * 1024,
        chunk: (results, parser) => {
          activeParser = parser;
          if (canceled) {
            parser.abort();
            return;
          }
          parseErrors = parseErrors.concat(results.errors);
          detectedDelimiter = results.meta.delimiter || detectedDelimiter;
          parsedRows.push(...results.data);
          const currentBytes = Math.min(file.size, results.meta.cursor ?? file.size);
          this.progress.set(Math.min(99, Math.round((currentBytes / file.size) * 100)));
        },
        complete: () => {
          this.cancelCurrentImport = undefined;
          if (canceled) {
            reject(new Error('Import cancelled.'));
          } else if (parseErrors.length) {
            reject(new Error(`CSV parsing stopped: ${parseErrors[0].message}. Check the quoting and row structure.`));
          } else {
            this.progress.set(100);
            resolve({ parsedRows, delimiter: detectedDelimiter });
          }
        },
        error: (error) => {
          this.cancelCurrentImport = undefined;
          reject(new Error(`The CSV could not be read: ${error.message}`));
        },
      });
    });
  }

  private headerName(header: string, index: number, trim: boolean): string {
    const name = trim ? header.trim() : header;
    return name || `Column ${index + 1}`;
  }

  private uniqueHeaders(headers: string[]): string[] {
    const used = new Set<string>();
    return headers.map((header, index) => {
      const base = header || `Column ${index + 1}`;
      let name = base;
      let suffix = 2;
      while (used.has(name)) name = `${base} (${suffix++})`;
      used.add(name);
      return name;
    });
  }

  private createWorkspace(dataset: Dataset, timestamp: string): Workspace {
    const id = crypto.randomUUID();
    return {
      id,
      name: `${dataset.name} workspace`,
      datasetId: dataset.id,
      filters: [],
      calculatedFields: [],
      visualizations: [],
      dashboard: {
        id: crypto.randomUUID(),
        name: `${dataset.name} dashboard`,
        visualizationIds: [],
        presentationMode: false,
        updatedAt: timestamp,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  async openDataset(id: string): Promise<void> {
    this.clearMessages();
    try {
      await this.initialize();
      const dataset = await this.repository.getDataset(id);
      if (!dataset) throw new Error('This dataset is not available in local storage.');
      const workspaces = await this.repository.listWorkspaces();
      const workspace = workspaces.find((item) => item.datasetId === id);
      if (!workspace) throw new Error('The workspace for this dataset could not be restored.');
      this.activeDataset.set(dataset);
      this.workspace.set(workspace);
    } catch (error) {
      this.activeDataset.set(null);
      this.workspace.set(null);
      this.error.set(this.errorMessage(error));
      throw error;
    }
  }

  async openWorkspace(id: string): Promise<void> {
    this.clearMessages();
    try {
      await this.initialize();
      const workspace = await this.repository.getWorkspace(id);
      if (!workspace) throw new Error('This workspace is not available in local storage.');
      const dataset = await this.repository.getDataset(workspace.datasetId);
      if (!dataset) throw new Error('The dataset for this workspace could not be restored.');
      this.activeDataset.set(dataset);
      this.workspace.set(workspace);
    } catch (error) {
      this.activeDataset.set(null);
      this.workspace.set(null);
      this.error.set(this.errorMessage(error));
      throw error;
    }
  }

  async saveWorkspace(updated: Workspace): Promise<void> {
    const workspace = { ...updated, updatedAt: new Date().toISOString() };
    try {
      await this.repository.saveWorkspace(workspace);
      this.workspace.set(workspace);
      this.workspaces.update((items) => items.map((item) => item.id === workspace.id ? workspace : item));
      this.notice.set('Workspace saved locally.');
    } catch (error) {
      this.error.set(`Workspace could not be saved: ${this.errorMessage(error)}`);
      throw error;
    }
  }

  datasetWithCalculatedFields(): Dataset | null {
    const dataset = this.activeDataset();
    const fields = this.workspace()?.calculatedFields ?? [];
    if (!dataset || !fields.length) return dataset;
    const key = `${dataset.id}:${fields.map((field) => `${field.name}:${field.formula}`).join('|')}`;
    if (this.calculatedCache?.key === key) return this.calculatedCache.dataset;

    const rows = dataset.rows.map((row) => {
      const derived = { ...row };
      for (const field of fields) derived[field.name] = evaluateFormula(field.formula, derived);
      return derived;
    });
    const calculatedColumns = fields.map((field) => ({
      id: field.id,
      name: field.name,
      dataType: inferDataType(rows.map((row) => row[field.name] ?? '')),
      nullable: rows.some((row) => !row[field.name]),
      uniqueCount: new Set(rows.map((row) => row[field.name]).filter(Boolean)).size,
      missingCount: rows.filter((row) => !row[field.name]).length,
    }));
    const prepared = { ...dataset, columns: [...dataset.columns, ...calculatedColumns], columnCount: dataset.columnCount + calculatedColumns.length, rows };
    this.calculatedCache = { key, dataset: prepared };
    return prepared;
  }

  qualityIssues(): QualityIssue[] {
    const dataset = this.datasetWithCalculatedFields();
    if (!dataset) return [];
    if (this.qualityCache?.dataset === dataset) return this.qualityCache.issues;
    const issues = analyzeQuality(dataset);
    this.qualityCache = { dataset, issues };
    return issues;
  }

  visibleRows(): Record<string, string>[] {
    const dataset = this.datasetWithCalculatedFields();
    if (!dataset) return [];
    const filters = this.workspace()?.filters ?? [];
    const filtersKey = JSON.stringify(filters);
    if (this.filteredRowsCache?.dataset === dataset && this.filteredRowsCache.filtersKey === filtersKey) {
      return this.filteredRowsCache.rows;
    }
    const rows = applyWorkspaceFilters(dataset, this.workspace() ?? undefined);
    this.filteredRowsCache = { dataset, filtersKey, rows };
    return rows;
  }

  async renameDataset(dataset: Dataset, name: string): Promise<void> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Dataset name cannot be empty.');
    const updated = { ...dataset, name: cleanName, updatedAt: new Date().toISOString() };
    await this.repository.saveDataset(updated);
    this.datasets.update((items) => items.map((item) => item.id === updated.id ? updated : item));
    if (this.activeDataset()?.id === updated.id) this.activeDataset.set(updated);
    this.notice.set('Dataset renamed.');
  }

  async deleteDataset(id: string): Promise<void> {
    try {
      await this.repository.deleteDataset(id);
      this.datasets.update((items) => items.filter((item) => item.id !== id));
      this.workspaces.update((items) => items.filter((item) => item.datasetId !== id));
      if (this.activeDataset()?.id === id) {
        this.activeDataset.set(null);
        this.workspace.set(null);
      }
      this.notice.set('Dataset deleted from this browser.');
    } catch (error) {
      this.error.set(`Dataset could not be deleted: ${this.errorMessage(error)}`);
      throw error;
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    try {
      await this.repository.deleteWorkspace(id);
      this.workspaces.update((items) => items.filter((item) => item.id !== id));
      if (this.workspace()?.id === id) this.workspace.set(null);
      this.notice.set('Workspace deleted.');
    } catch (error) {
      this.error.set(`Workspace could not be deleted: ${this.errorMessage(error)}`);
      throw error;
    }
  }

  async createSampleDataset(): Promise<Dataset> {
    const csv = [
      'Date,Customer,Country,Category,Revenue,Units,Status',
      '2026-01-05,John Tan,Malaysia,Electronics,2480,2,Completed',
      '2026-01-12,Sarah Lim,Singapore,Home & Kitchen,1320,1,Completed',
      '2026-02-08,Ahmad Rahman,Malaysia,Fashion,980,3,Pending',
      '2026-02-21,Nguyen Pham,Vietnam,Sports,1760,2,Completed',
      '2026-03-03,Siti Aisyah,Indonesia,Beauty & Health,640,1,Cancelled',
      '2026-03-15,John Tan,Malaysia,Electronics,3200,2,Completed',
      '2026-04-04,Mei Chen,Singapore,Fashion,2140,4,Completed',
      '2026-04-17,Nguyen Pham,Vietnam,Home & Kitchen,890,1,Pending',
      '2026-05-02,Siti Aisyah,Indonesia,Sports,1520,2,Completed',
      '2026-05-12,John Tan,Malaysia,Electronics,2480,2,Completed',
      '2026-05-15,,Thailand,Fashion,740,1,Pending',
      '2026-06-08,Mei Chen,Singapore,Electronics,2980,3,Completed',
    ].join('\n');
    return this.importFile(new File([csv], 'sample-sales.csv', { type: 'text/csv' }));
  }

  async saveVisualization(visualization: Visualization): Promise<void> {
    const workspace = this.workspace();
    if (!workspace) throw new Error('Open a dataset before saving a visualization.');
    const visualizations = workspace.visualizations.some((item) => item.id === visualization.id)
      ? workspace.visualizations.map((item) => item.id === visualization.id ? visualization : item)
      : [...workspace.visualizations, visualization];
    await this.saveWorkspace({ ...workspace, visualizations });
  }

  async deleteVisualization(id: string): Promise<void> {
    const workspace = this.workspace();
    if (!workspace) throw new Error('Open a dataset before editing its visualizations.');
    await this.saveWorkspace({
      ...workspace,
      visualizations: workspace.visualizations.filter((item) => item.id !== id),
      dashboard: {
        ...workspace.dashboard,
        visualizationIds: workspace.dashboard.visualizationIds.filter((item) => item !== id),
      },
    });
  }

  async addVisualizationToDashboard(id: string): Promise<void> {
    const workspace = this.workspace();
    if (!workspace) throw new Error('Open a dataset before editing its dashboard.');
    if (!workspace.visualizations.some((item) => item.id === id)) throw new Error('That chart is no longer available.');
    if (workspace.dashboard.visualizationIds.includes(id)) return;
    await this.saveWorkspace({
      ...workspace,
      dashboard: {
        ...workspace.dashboard,
        visualizationIds: [...workspace.dashboard.visualizationIds, id],
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async updateDashboard(visualizationIds: string[], name?: string, presentationMode?: boolean): Promise<void> {
    const workspace = this.workspace();
    if (!workspace) throw new Error('Open a dataset before editing its dashboard.');
    await this.saveWorkspace({
      ...workspace,
      dashboard: {
        ...workspace.dashboard,
        visualizationIds,
        name: name?.trim() || workspace.dashboard.name,
        presentationMode: presentationMode ?? workspace.dashboard.presentationMode,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async clearLocalData(): Promise<void> {
    try {
      await this.repository.clear();
      this.datasets.set([]);
      this.workspaces.set([]);
      this.activeDataset.set(null);
      this.workspace.set(null);
      this.notice.set('All locally stored datasets and workspaces were deleted.');
    } catch (error) {
      this.error.set(`Local data could not be cleared: ${this.errorMessage(error)}`);
      throw error;
    }
  }

  clearMessages(): void {
    this.error.set('');
    this.notice.set('');
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'An unexpected error occurred.';
  }
}
