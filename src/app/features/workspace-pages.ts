import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { analyzeQuality, aggregate, buildInsights, datasetMetrics, getNumericProfile, summarizeColumn } from '../core/analytics';
import { evaluateFormula } from '../core/formula';
import { Aggregate, ChartType, Dataset, DatasetColumn, QualityIssue, Visualization, Workspace } from '../core/models';
import { WorkspaceService } from '../core/workspace.service';
import { ChartViewComponent } from '../shared/chart-view';

const TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' }, { value: 'line', label: 'Line' }, { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' }, { value: 'doughnut', label: 'Donut' }, { value: 'scatter', label: 'Scatter' },
  { value: 'histogram', label: 'Histogram' }, { value: 'kpi', label: 'KPI' },
];
const AGGREGATES: Aggregate[] = ['sum', 'average', 'count', 'minimum', 'maximum', 'median'];

function visualization(type: ChartType, title: string, dimension: string, measure: string, operation: Aggregate = 'sum'): Visualization {
  const timestamp = new Date().toISOString();
  return { id: crypto.randomUUID(), type, title, dimension, measure, aggregate: operation, createdAt: timestamp, updatedAt: timestamp };
}
@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartViewComponent],
  template: `
    @if (state.datasetWithCalculatedFields(); as dataset) {
      <section class="page">
        <div class="page-intro"><div><span class="eyebrow">DATASET OVERVIEW</span><h2>Understand your data at a glance</h2><p>Here’s what we found in <strong>{{ dataset.name }}</strong>.</p></div><a class="button secondary" [routerLink]="['/workspace', state.workspace()?.id, 'data']">Explore data <span>→</span></a></div>
        <div class="overview-grid">
          <div class="overview-main">
            <div class="metric-grid">
              <article class="metric-card"><span class="metric-icon green">▤</span><div><small>Total rows</small><strong>{{ dataset.rowCount | number }}</strong><span class="metric-caption">Records in this dataset</span></div></article>
              <article class="metric-card"><span class="metric-icon blue">▦</span><div><small>Total columns</small><strong>{{ dataset.columnCount }}</strong><span class="metric-caption">{{ metrics.numeric }} numeric · {{ metrics.text }} text</span></div></article>
              <article class="metric-card alert-metric"><span class="metric-icon red">!</span><div><small>Missing values</small><strong>{{ metrics.missing | number }}</strong><span class="metric-caption">{{ missingColumns }} columns affected</span></div></article>
              <article class="metric-card"><span class="metric-icon purple">◉</span><div><small>Duplicate rows</small><strong>{{ metrics.duplicates | number }}</strong><span class="metric-caption">Exact row matches</span></div></article>
            </div>
            <div class="chart-grid">
              @for (chart of recommendedCharts; track chart.id) {
                <article class="panel overview-chart"><div class="panel-heading"><div><h3>{{ chart.title }}</h3><span class="muted">{{ chart.dimension }} · {{ chart.aggregate }} {{ chart.measure }}</span></div><a [routerLink]="['/workspace', state.workspace()?.id, 'visualize']">Edit</a></div><div class="chart-area"><app-chart-view [dataset]="dataset" [visualization]="chart" [rows]="rows" /></div></article>
              }
              @if (!recommendedCharts.length) { <div class="panel empty-inline">Add a numeric and category column to get recommended charts.</div> }
            </div>
            <article class="panel recent-table">
              <div class="panel-heading"><div><h3>Recent data</h3><span class="muted">A preview of your records</span></div><a [routerLink]="['/workspace', state.workspace()?.id, 'data']">View all →</a></div>
              <div class="table-wrap"><table><thead><tr>@for (column of dataset.columns.slice(0, 6); track column.id) { <th>{{ column.name }}</th> }</tr></thead><tbody>
                @for (row of dataset.rows.slice(0, 5); track $index) { <tr>@for (column of dataset.columns.slice(0, 6); track column.id) { <td>{{ row[column.name] || '—' }}</td> }</tr> }
              </tbody></table></div>
            </article>
          </div>
          <aside class="overview-aside">
            <article class="panel"><div class="panel-heading"><h3>Quick insights</h3><span class="spark">✦</span></div><ul class="insight-list">@for (insight of insights; track insight) { <li><span class="insight-dot">↗</span><span>{{ insight }}</span></li> } @empty { <li class="muted">Import more records to discover patterns.</li> }</ul></article>
            <article class="panel quality-summary"><div class="panel-heading"><h3>Data quality</h3><span class="score-pill">{{ qualityScore }}<small>/100</small></span></div><p>{{ qualityIssues.length }} detected issues across {{ affectedColumns }} columns.</p><div class="score-track"><span [style.width.%]="qualityScore"></span></div><a [routerLink]="['/workspace', state.workspace()?.id, 'quality']">View details <span>→</span></a></article>
            <article class="panel quick-actions"><div class="panel-heading"><h3>Quick actions</h3></div><a class="action-primary" [routerLink]="['/workspace', state.workspace()?.id, 'visualize']">＋ Create chart</a><a [routerLink]="['/workspace', state.workspace()?.id, 'dashboard']">▦ Create dashboard</a><a [routerLink]="['/workspace', state.workspace()?.id, 'calculated-fields']">ƒx Add calculated field</a><button type="button" (click)="exportCsv(dataset)">⇩ Export data</button></article>
          </aside>
        </div>
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-intro{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.eyebrow{font-size:9px;letter-spacing:1px;color:#727f9a;font-weight:700}.page-intro h2{font-size:21px;letter-spacing:-.4px;margin:6px 0;color:#142044}.page-intro p{font-size:12px;color:#8490a6;margin:0}.page-intro p strong{color:#53617c}
    .overview-grid{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:15px}.overview-main,.overview-aside{min-width:0;display:grid;align-content:start;gap:14px}.overview-aside{grid-auto-rows:max-content}
    .metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric-card{min-height:104px;padding:15px 13px;background:#fff;border:1px solid #e6ebf4;border-radius:10px;display:flex;gap:10px;align-items:flex-start}.metric-card>div{display:grid;gap:4px}.metric-card small{font-size:10px;color:#62718d}.metric-card strong{font-size:21px;line-height:1.1;color:#111d44}.metric-caption{font-size:9px;color:#98a3b5}.metric-icon{width:30px;height:30px;flex:0 0 30px;border-radius:50%;display:grid;place-items:center;font-size:15px}.green{background:#e2f7ef;color:#179775}.blue{background:#e9efff;color:#5266e7}.red{background:#fff0ee;color:#e2574e}.purple{background:#f1eafe;color:#8552dc}.alert-metric{background:#fffdfd}
    .chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.panel{background:#fff;border:1px solid #e5eaf3;border-radius:10px;padding:15px}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.panel-heading h3{margin:0;color:#162145;font-size:12px;font-weight:650}.panel-heading a,.quality-summary>a{color:#5362d7;text-decoration:none;font-size:10px;font-weight:600}.muted{display:block;color:#8a96aa;font-size:9px;margin-top:5px}.chart-area{height:210px;margin-top:10px}.overview-chart{min-width:0}
    .recent-table{padding-bottom:4px}.table-wrap{width:100%;overflow:auto;margin-top:11px}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{font-size:9px;color:#78859e;font-weight:600;background:#f8faff}th,td{padding:9px 10px;border-bottom:1px solid #edf0f5}td{font-size:10px;color:#4f5c76;max-width:180px;overflow:hidden;text-overflow:ellipsis}
    .insight-list{list-style:none;padding:0;margin:13px 0 0;display:grid;gap:10px}.insight-list li{display:flex;align-items:flex-start;gap:8px;font-size:10px;line-height:1.5;color:#51607b}.insight-dot{width:19px;height:19px;flex:0 0 19px;border-radius:50%;display:grid;place-items:center;color:#159875;background:#e6f8f1}.spark{font-size:16px;color:#eea52a}.quality-summary{padding-bottom:13px}.score-pill{font-size:17px;color:#118a6d;font-weight:700}.score-pill small{font-size:9px;color:#8995a8}.quality-summary p{margin:11px 0;color:#75819a;font-size:10px}.score-track{height:5px;background:#eaf1f2;border-radius:5px;margin:10px 0 12px}.score-track span{height:100%;display:block;background:#15a17e;border-radius:5px}.quality-summary>a{display:block}.quick-actions{display:grid;gap:8px}.quick-actions .panel-heading{margin-bottom:2px}.quick-actions>a,.quick-actions>button{height:34px;display:flex;align-items:center;gap:7px;padding:0 10px;border:1px solid #e3e8f2;background:#fff;color:#475776;border-radius:7px;text-decoration:none;font-size:10px;text-align:left;cursor:pointer}.quick-actions .action-primary{justify-content:center;color:#fff;background:#5864e4;border-color:#5864e4}.empty-inline{font-size:11px;color:#8390a7;grid-column:span 2;padding:35px;text-align:center}
    @media(max-width:1100px){.overview-grid{grid-template-columns:minmax(0,1fr) 240px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:760px){.overview-grid{grid-template-columns:1fr}.overview-aside{grid-template-columns:repeat(2,minmax(0,1fr))}.quick-actions{grid-column:span 2}}
    @media(max-width:560px){.page-intro{align-items:flex-start}.page-intro h2{font-size:18px}.page-intro>.button{font-size:0;padding:9px}.metric-card{padding:11px 9px}.metric-card strong{font-size:18px}.metric-icon{width:25px;height:25px;flex-basis:25px}.chart-grid{grid-template-columns:1fr}.overview-aside{grid-template-columns:1fr}.quick-actions{grid-column:auto}.chart-area{height:185px}}
  `],
})
export class OverviewPageComponent {
  readonly state = inject(WorkspaceService);

  get metrics() {
    const dataset = this.state.datasetWithCalculatedFields();
    return dataset ? datasetMetrics(dataset, this.qualityIssues) : { missing: 0, duplicates: 0, numeric: 0, text: 0, dates: 0, booleans: 0 };
  }
  get missingColumns(): number { return this.state.datasetWithCalculatedFields()?.columns.filter((column) => column.missingCount > 0).length ?? 0; }
  get qualityIssues(): QualityIssue[] {
    return this.state.qualityIssues();
  }
  get affectedColumns(): number {
    return new Set(this.qualityIssues.map((issue) => issue.column).filter(Boolean)).size;
  }
  get qualityScore(): number {
    const dataset = this.state.datasetWithCalculatedFields();
    if (!dataset) return 100;
    const weighted = this.qualityIssues.reduce((sum, issue) => sum + issue.count * (issue.severity === 'high' ? 1.5 : 1), 0);
    return Math.max(0, Math.round(100 - (weighted / Math.max(1, dataset.rowCount * dataset.columnCount)) * 100));
  }
  private insightsDataset?: Dataset;
  private insightsRows?: Record<string, string>[];
  private insightsCache: string[] = [];
  get insights(): string[] {
    const dataset = this.state.datasetWithCalculatedFields();
    if (!dataset) return [];
    const rows = this.state.visibleRows();
    if (this.insightsDataset !== dataset || this.insightsRows !== rows) {
      this.insightsDataset = dataset;
      this.insightsRows = rows;
      this.insightsCache = buildInsights(dataset, rows);
    }
    return this.insightsCache;
  }
  get rows(): Record<string, string>[] { return this.state.visibleRows(); }
  private recommendedCache: Visualization[] = [];
  private recommendedFor = '';
  get recommendedCharts(): Visualization[] {
    const dataset = this.state.datasetWithCalculatedFields();
    if (!dataset) return [];
    if (this.recommendedFor === dataset.id) return this.recommendedCache;
    const category = dataset.columns.find((column) => column.dataType === 'string' || column.dataType === 'boolean');
    const measure = dataset.columns.find((column) => column.dataType === 'number');
    if (!category || !measure) {
      this.recommendedFor = dataset.id;
      this.recommendedCache = [];
      return this.recommendedCache;
    }
    const charts = [visualization('bar', `${measure.name} by ${category.name}`, category.name, measure.name)];
    const date = dataset.columns.find((column) => column.dataType === 'date' || column.dataType === 'datetime');
    if (date) charts.push(visualization('line', `${measure.name} trend`, date.name, measure.name, 'sum'));
    this.recommendedFor = dataset.id;
    this.recommendedCache = charts;
    return this.recommendedCache;
  }

  exportCsv(dataset: Dataset): void {
    const headers = dataset.columns.map((column) => column.name);
    const quote = (value: string): string => {
      const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csv = [headers, ...dataset.rows.map((row) => headers.map((header) => row[header] ?? ''))]
      .map((line) => line.map(quote).join(',')).join('\r\n');
    this.download(csv, dataset.fileName);
  }

  private download(content: string, filename: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

@Component({
  selector: 'app-data-explorer-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (dataset; as source) {
      <section class="page">
        <div class="page-heading-row"><div><h2>Data explorer</h2><p>Search, filter, sort, and inspect your records.</p></div><div class="export-actions"><button class="button secondary" type="button" (click)="exportFiltered('csv')">⇩ Filtered CSV</button><button class="button secondary" type="button" (click)="exportFiltered('json')">JSON</button></div></div>
        <div class="explorer-toolbar panel">
          <label class="search-control"><span>⌕</span><input aria-label="Search rows" [(ngModel)]="search" placeholder="Search all visible columns…" /></label>
          <div class="filter-builder"><select aria-label="Filter column" [ngModel]="filterColumn || columns[0]?.name" (ngModelChange)="setFilterColumn($event)">@for (column of columns; track column.name) { <option [value]="column.name">{{ column.name }}</option> }</select><select aria-label="Filter operation" [(ngModel)]="filterOperator">@for (operator of filterOperators; track operator.value) { <option [value]="operator.value">{{ operator.label }}</option> }</select><input aria-label="Filter value" [(ngModel)]="filterValue" [placeholder]="filterOperator==='between' ? 'start, end' : 'Value'" (keydown.enter)="addFilter()" /><button class="button primary small-button" type="button" (click)="addFilter()">＋ Filter</button></div>
          <label class="page-size-label">Rows <select [(ngModel)]="pageSize" (ngModelChange)="page=0"><option [ngValue]="10">10</option><option [ngValue]="25">25</option><option [ngValue]="50">50</option><option [ngValue]="100">100</option></select></label>
        </div>
        @if (filters.length) { <div class="filter-chips">@for (filter of filters; track filter.id) { <button type="button" (click)="removeFilter(filter.id)">{{ filter.column }} {{ filter.operator }} {{ filter.value }} <span>×</span></button> } <button type="button" class="clear-filters" (click)="clearFilters()">Clear all</button></div> }
        @if (selectedColumn) {
          <aside class="column-profile panel"><div class="panel-heading"><div><h3>{{ selectedColumn.name }}</h3><span class="muted">{{ selectedColumn.dataType | titlecase }} column profile</span></div><button type="button" class="close-button" aria-label="Close column profile" (click)="selectedColumn=undefined">×</button></div>
            @if (profile; as stats) { <div class="profile-stats"><span><small>Count</small><strong>{{ source.rowCount - stats.missing | number }}</strong></span><span><small>Missing</small><strong>{{ stats.missing | number }}</strong></span><span><small>Unique</small><strong>{{ stats.unique | number }}</strong></span>
              @if (stats.profile; as numeric) { <span><small>Min</small><strong>{{ numeric.min | number:'1.0-2' }}</strong></span><span><small>Max</small><strong>{{ numeric.max | number:'1.0-2' }}</strong></span><span><small>Average</small><strong>{{ numeric.average | number:'1.0-2' }}</strong></span><span><small>Median</small><strong>{{ numeric.median | number:'1.0-2' }}</strong></span><span><small>Std. dev.</small><strong>{{ numeric.standardDeviation | number:'1.0-2' }}</strong></span> }
            </div>
            @if (stats.values.length) { <div class="top-values"><small>Most frequent values</small>@for (item of stats.values.slice(0, 5); track item.label) { <div><span>{{ item.label || '(empty)' }}</span><strong>{{ item.count | number }}</strong></div> }</div> } }
          </aside>
        }
        <div class="table-container panel">
          <div class="table-topline"><span><strong>{{ filtered.length | number }}</strong> records <span class="muted-inline">matching your view</span></span><details class="column-picker"><summary>Columns <span>⌄</span></summary><div class="column-picker-menu">@for (column of columns; track column.name) { <label><input type="checkbox" [checked]="!hiddenColumns.has(column.name)" (change)="toggleColumn(column.name)" />{{ column.name }}</label> }</div></details></div>
          <div class="table-wrap explorer-table"><table><thead><tr><th class="row-index">#</th>@for (column of shownColumns; track column.name) { <th><button type="button" class="sort-button" (click)="sortBy(column.name)">{{ column.name }} <span>{{ sortColumn === column.name ? (sortDirection === 'asc' ? '↑' : '↓') : '↕' }}</span></button><button type="button" class="profile-button" (click)="selectColumn(column)" [attr.aria-label]="'Profile ' + column.name">⋯</button></th> }</tr></thead>
            <tbody>@for (item of visiblePage; track item.index) { <tr [class.highlight-row]="item.index === targetRow"><td class="row-index">{{ item.index + 1 }}</td>@for (column of shownColumns; track column.name) { <td [title]="item.row[column.name]">{{ item.row[column.name] || '—' }}</td> }</tr> }
              @if (!visiblePage.length) { <tr><td class="empty-row" [attr.colspan]="shownColumns.length + 1">No records match your search and filters.</td></tr> }
            </tbody></table></div>
          <div class="table-footer"><span>Showing {{ filtered.length ? page * pageSize + 1 : 0 }}–{{ Math.min((page + 1) * pageSize, filtered.length) }} of {{ filtered.length | number }}</span><div><button type="button" class="pagination-button" [disabled]="page===0" (click)="page=page-1">‹</button><span class="page-number">{{ page + 1 }}</span><button type="button" class="pagination-button" [disabled]="(page+1)*pageSize>=filtered.length" (click)="page=page+1">›</button></div></div>
        </div>
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-heading-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.page-heading-row h2{font-size:20px;margin:0 0 5px;color:#172143}.page-heading-row p{font-size:12px;margin:0;color:#8792a6}.export-actions{display:flex;gap:7px}.export-actions .button{font-size:10px}
    .panel{background:white;border:1px solid #e4e9f2;border-radius:10px}.explorer-toolbar{padding:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .search-control{height:34px;min-width:190px;flex:1;display:flex;align-items:center;gap:8px;padding:0 9px;border:1px solid #e4e8f0;border-radius:7px;color:#8490a5}.search-control input,.filter-builder input{min-width:0;flex:1;border:0;outline:0;background:transparent;font-size:11px;color:#35425c}
    .filter-builder{display:flex;gap:6px;align-items:center}.filter-builder select,.filter-builder input,.page-size-label select{height:33px;padding:0 8px;border:1px solid #e4e8f0;border-radius:6px;background:#fff;color:#53617b;font-size:10px}.filter-builder input{width:110px;flex:initial}.small-button{padding:7px 10px;font-size:10px}.page-size-label{display:flex;gap:5px;align-items:center;color:#8b96a8;font-size:10px;white-space:nowrap}
    .filter-chips{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:10px 0}.filter-chips button{border:1px solid #dfe4f4;background:#f3f5ff;color:#4d5bcf;border-radius:20px;padding:5px 9px;font-size:10px;cursor:pointer}.filter-chips button span{margin-left:5px}.filter-chips .clear-filters{background:none;border:0;color:#818da3}
    .column-profile{padding:14px;margin-bottom:12px}.close-button{border:0;background:none;color:#71809a;font-size:20px;cursor:pointer}.profile-stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:13px}.profile-stats>span{min-width:86px;padding:8px 11px;background:#f8faff;border:1px solid #edf0f6;border-radius:7px;display:grid;gap:4px}.profile-stats small,.top-values>small{font-size:9px;color:#8793a7}.profile-stats strong{font-size:13px;color:#283554}.top-values{margin-top:13px;max-width:460px}.top-values>div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f2f7;font-size:10px;color:#57647d}.top-values>div strong{color:#263454}
    .table-container{overflow:visible}.table-topline{height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;font-size:10px;color:#53617c}.table-topline>span>strong{color:#17213f}.muted-inline{color:#9aa3b2;margin-left:4px}.column-picker{position:relative}.column-picker summary{list-style:none;cursor:pointer;border:1px solid #e2e7f0;border-radius:6px;padding:6px 9px;color:#53617b}.column-picker summary::-webkit-details-marker{display:none}.column-picker-menu{position:absolute;z-index:5;right:0;top:30px;min-width:160px;padding:9px;background:#fff;border:1px solid #e5e9f0;border-radius:8px;box-shadow:0 9px 24px #1f315018;display:grid;gap:6px}.column-picker-menu label{display:flex;gap:7px;align-items:center;font-size:10px}.column-picker-menu input{accent-color:#5965df}
    .explorer-table{max-height:calc(100vh - 340px);min-height:260px;overflow:auto;border-top:1px solid #edf0f5}table{width:100%;border-collapse:collapse;white-space:nowrap}th{position:sticky;top:0;z-index:1;background:#f8faff;text-align:left;color:#6b7891;font-weight:600;font-size:10px}th,td{height:37px;padding:0 9px;border-bottom:1px solid #edf0f5}td{max-width:250px;overflow:hidden;text-overflow:ellipsis;color:#485774;font-size:10px}.row-index{position:sticky;left:0;z-index:2;background:#f8faff;color:#9aa4b6;text-align:center;min-width:42px;width:42px}.sort-button{border:0;background:transparent;padding:0;color:inherit;font-size:inherit;cursor:pointer}.sort-button span{color:#a1acc0;margin-left:5px}.profile-button{margin-left:3px;border:0;background:none;color:#8a96aa;cursor:pointer}.highlight-row td{background:#fff8df}.highlight-row .row-index{background:#fff2c6}.empty-row{text-align:center;height:90px;color:#8793a7}
    .table-footer{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 13px;color:#8792a6;font-size:10px}.table-footer>div{display:flex;align-items:center;gap:7px}.pagination-button{width:27px;height:27px;border:1px solid #e1e6f0;border-radius:6px;background:white;color:#67758f;font-size:16px;cursor:pointer}.pagination-button:disabled{opacity:.4;cursor:default}.page-number{min-width:25px;height:25px;display:grid;place-items:center;border-radius:6px;background:#5964df;color:white}
    @media(max-width:850px){.filter-builder{order:3;flex:1;flex-wrap:wrap}.filter-builder select{flex:1}.filter-builder input{flex:1}.page-size-label{margin-left:auto}}
    @media(max-width:600px){.page-heading-row{align-items:flex-start}.export-actions{flex-direction:column}.export-actions .button{padding:6px 8px}.filter-builder{width:100%}.filter-builder select{min-width:0}.explorer-table{max-height:60vh}}
  `],
})
export class DataExplorerPageComponent {
  readonly state = inject(WorkspaceService);
  readonly Math = Math;
  search = '';
  filterColumn = '';
  filterOperator: Workspace['filters'][number]['operator'] = 'contains';
  filterValue = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 0;
  pageSize = 25;
  selectedColumn?: DatasetColumn;
  private selectedColumnName = '';
  private filteredCacheKey = '';
  private filteredCache: { row: Record<string, string>; index: number }[] = [];
  hiddenColumns = new Set<string>();
  targetRow = -1;

  constructor(private readonly route: ActivatedRoute) {
    this.route.queryParamMap.subscribe((params) => {
      this.search = params.get('search') ?? this.search;
      const column = params.get('column');
      if (column) {
        this.selectedColumnName = column;
        this.selectedColumn = this.dataset?.columns.find((item) => item.name === column);
      }
      this.targetRow = Number(params.get('row') ?? -1);
      if (this.targetRow >= 0) this.page = Math.floor(this.targetRow / this.pageSize);
    });
    try {
      const savedPageSize = Number(localStorage.getItem('csv-analytics-rows-per-page'));
      if ([10, 25, 50, 100].includes(savedPageSize)) this.pageSize = savedPageSize;
    } catch {
      this.state.error.set('Saved table preferences are unavailable in this browser.');
    }
  }

  get dataset() { return this.state.datasetWithCalculatedFields(); }
  get workspace() { return this.state.workspace(); }
  get filters() { return this.workspace?.filters ?? []; }
  get filterOperators(): { value: Workspace['filters'][number]['operator']; label: string }[] {
    const type = this.columns.find((column) => column.name === this.filterColumn)?.dataType ?? 'string';
    const common = [{ value: 'is-empty' as const, label: 'Is empty' }, { value: 'is-not-empty' as const, label: 'Is not empty' }];
    if (type === 'number') return [
      { value: 'equals', label: 'Equals' }, { value: 'does-not-equal', label: 'Does not equal' },
      { value: 'greater-than', label: 'Greater than' }, { value: 'greater-or-equal', label: 'Greater than or equal' },
      { value: 'less-than', label: 'Less than' }, { value: 'less-or-equal', label: 'Less than or equal' },
      { value: 'between', label: 'Between (min, max)' }, ...common,
    ];
    if (type === 'date' || type === 'datetime') return [
      { value: 'before', label: 'Before' }, { value: 'after', label: 'After' }, { value: 'on', label: 'On' },
      { value: 'between', label: 'Between (start, end)' }, ...common,
    ];
    if (type === 'boolean') return [
      { value: 'is-true', label: 'Is true' }, { value: 'is-false', label: 'Is false' }, ...common,
    ];
    return [
      { value: 'contains', label: 'Contains' }, { value: 'does-not-contain', label: 'Does not contain' },
      { value: 'equals', label: 'Equals' }, { value: 'does-not-equal', label: 'Does not equal' },
      { value: 'starts-with', label: 'Starts with' }, { value: 'ends-with', label: 'Ends with' }, ...common,
    ];
  }
  get columns() {
    const columns = this.dataset?.columns ?? [];
    if (!this.selectedColumn && this.selectedColumnName) this.selectedColumn = columns.find((item) => item.name === this.selectedColumnName);
    return columns;
  }
  get shownColumns() { return this.columns.filter((column) => !this.hiddenColumns.has(column.name)); }
  get filtered(): { row: Record<string, string>; index: number }[] {
    const dataset = this.dataset;
    if (!dataset) return [];
    const key = JSON.stringify([
      dataset.id,
      dataset.updatedAt,
      this.workspace?.updatedAt,
      this.search,
      this.sortColumn,
      this.sortDirection,
      [...this.hiddenColumns].sort(),
    ]);
    if (key === this.filteredCacheKey) return this.filteredCache;
    const allowed = new Set(this.state.visibleRows());
    let rows = dataset.rows.map((row, index) => ({ row, index })).filter((item) => allowed.has(item.row));
    if (this.search.trim()) {
      const query = this.search.toLowerCase();
      rows = rows.filter(({ row }) => this.shownColumns.some((column) => (row[column.name] ?? '').toLowerCase().includes(query)));
    }
    if (this.sortColumn) {
      const key = this.sortColumn;
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const left = a.row[key] ?? '';
        const right = b.row[key] ?? '';
        const leftNumber = Number(left.replace(/,/g, ''));
        const rightNumber = Number(right.replace(/,/g, ''));
        const comparison = Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
          ? leftNumber - rightNumber
          : left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
        return comparison * direction;
      });
    }
    this.filteredCacheKey = key;
    this.filteredCache = rows;
    return this.filteredCache;
  }
  get visiblePage() { return this.filtered.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize); }
  get profile() { return this.dataset && this.selectedColumn ? summarizeColumn(this.dataset, this.selectedColumn, this.state.visibleRows()) : undefined; }

  sortBy(name: string): void {
    this.sortDirection = this.sortColumn === name && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortColumn = name;
  }
  setFilterColumn(name: string): void {
    this.filterColumn = name;
    if (!this.filterOperators.some((operator) => operator.value === this.filterOperator)) {
      this.filterOperator = this.filterOperators[0]?.value ?? 'contains';
    }
  }
  selectColumn(column: DatasetColumn): void { this.selectedColumn = column; }
  toggleColumn(name: string): void {
    const next = new Set(this.hiddenColumns);
    if (next.has(name)) next.delete(name); else next.add(name);
    this.hiddenColumns = next;
  }
  addFilter(): void {
    if (!this.workspace) return;
    this.filterColumn ||= this.columns[0]?.name ?? '';
    if (!this.filterColumn) return;
    const needsValue = this.filterOperator !== 'is-empty' && this.filterOperator !== 'is-not-empty'
      && this.filterOperator !== 'is-true' && this.filterOperator !== 'is-false';
    if (needsValue && !this.filterValue.trim()) return;
    const filter = { id: crypto.randomUUID(), column: this.filterColumn, operator: this.filterOperator, value: this.filterValue };
    void this.state.saveWorkspace({ ...this.workspace, filters: [...this.filters, filter] });
    this.filterValue = '';
    this.page = 0;
  }
  removeFilter(id: string): void {
    if (this.workspace) void this.state.saveWorkspace({ ...this.workspace, filters: this.filters.filter((filter) => filter.id !== id) });
  }
  clearFilters(): void { if (this.workspace) void this.state.saveWorkspace({ ...this.workspace, filters: [] }); }

  exportFiltered(format: 'csv' | 'json'): void {
    if (!this.dataset) return;
    const rows = this.filtered.map((item) => item.row);
    const content = format === 'json' ? JSON.stringify(rows, null, 2) : this.toCsv(rows);
    this.download(content, `${this.dataset.name}-filtered.${format}`, format === 'json' ? 'application/json' : 'text/csv;charset=utf-8');
  }
  private toCsv(rows: Record<string, string>[]): string {
    const headers = this.columns.map((column) => column.name);
    return [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ''))]
      .map((line) => line.map((value) => {
        const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;
        return `"${safe.replace(/"/g, '""')}"`;
      }).join(',')).join('\r\n');
  }
  private download(content: string, filename: string, mime: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  }
}

@Component({
  selector: 'app-quality-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (dataset; as source) {
      <section class="page">
        <div class="page-heading-row"><div><h2>Data quality</h2><p>Review potential issues before relying on your analysis.</p></div><span class="quality-score"><strong>{{ score }}</strong><small> / 100 quality score</small></span></div>
        <div class="quality-overview">
          <article class="quality-stat panel"><span class="quality-stat-icon warning">!</span><div><small>Total issues</small><strong>{{ issues.length | number }}</strong><span>Across {{ affectedColumns }} columns</span></div></article>
          <article class="quality-stat panel"><span class="quality-stat-icon red">◌</span><div><small>Missing values</small><strong>{{ metrics.missing | number }}</strong><span>Incomplete cells</span></div></article>
          <article class="quality-stat panel"><span class="quality-stat-icon purple">◉</span><div><small>Duplicate records</small><strong>{{ metrics.duplicates | number }}</strong><span>Exact row matches</span></div></article>
          <article class="quality-stat panel"><span class="quality-stat-icon green">✓</span><div><small>Columns checked</small><strong>{{ source.columnCount }}</strong><span>Type and consistency</span></div></article>
        </div>
        <article class="panel quality-list-panel"><div class="panel-heading"><div><h3>Detected issues</h3><span class="muted">Select an issue to inspect the affected records.</span></div><label class="severity-filter">Severity <select [(ngModel)]="severity"><option value="all">All issues</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>
          <div class="issue-list">
            @for (issue of visibleIssues; track issue.id) {
              <article class="issue-row"><span class="severity-dot" [class]="issue.severity"></span><div class="issue-copy"><div><strong>{{ issue.title }}</strong><span class="severity-label" [class]="issue.severity">{{ issue.severity }}</span></div><p>{{ issue.description }}</p></div><strong class="issue-count">{{ issue.count | number }}</strong><a class="button secondary issue-action" [routerLink]="['/workspace', state.workspace()?.id, 'data']" [queryParams]="{column: issue.column, row: issue.rows[0]}">View records <span>→</span></a></article>
            } @empty { <div class="quality-empty"><span>✓</span><h3>No quality issues found</h3><p>Your dataset passed the available checks.</p></div> }
          </div>
        </article>
        <p class="quality-disclaimer">The quality score is a rule-based indicator for exploration, not a scientifically authoritative measurement.</p>
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-heading-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.page-heading-row h2{font-size:20px;margin:0 0 5px}.page-heading-row p{font-size:12px;color:#8792a6;margin:0}.quality-score{padding:9px 13px;background:#eaf8f2;border:1px solid #cfede0;border-radius:8px;color:#178468}.quality-score strong{font-size:17px}.quality-score small{font-size:10px;color:#6a8a80}.quality-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .panel{background:white;border:1px solid #e4e9f2;border-radius:10px}.quality-stat{display:flex;align-items:center;gap:11px;padding:14px}.quality-stat-icon{width:33px;height:33px;display:grid;place-items:center;border-radius:50%;font-weight:700}.warning{background:#fff5e3;color:#df941d}.red{background:#fff0ed;color:#df584d}.purple{background:#f0eafe;color:#8958d9}.green{background:#e6f7ef;color:#189673}.quality-stat>div{display:grid;gap:3px}.quality-stat small,.quality-stat span{font-size:9px;color:#8490a5}.quality-stat strong{font-size:18px;color:#172143}
    .quality-list-panel{padding:15px}.panel-heading{display:flex;justify-content:space-between;align-items:center}.panel-heading h3{margin:0;font-size:12px}.muted{display:block;font-size:9px;color:#8792a6;margin-top:5px}.severity-filter{font-size:10px;color:#7e899e}.severity-filter select{margin-left:6px;padding:6px 8px;border:1px solid #e3e7ef;border-radius:6px;background:white;color:#52607a;font-size:10px}
    .issue-list{margin-top:9px}.issue-row{display:flex;align-items:center;gap:12px;min-height:67px;padding:10px 5px;border-top:1px solid #edf0f5}.severity-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%}.severity-dot.high{background:#e65349}.severity-dot.medium{background:#edaa35}.severity-dot.low{background:#8594ac}.issue-copy{flex:1;min-width:0}.issue-copy>div{display:flex;align-items:center;gap:8px}.issue-copy strong{font-size:11px;color:#293653}.issue-copy p{font-size:9px;margin:4px 0 0;color:#8591a5}.severity-label{padding:2px 6px;border-radius:8px;font-size:8px;text-transform:capitalize}.severity-label.high{color:#b94a42;background:#fff0ee}.severity-label.medium{color:#aa741e;background:#fff7e7}.severity-label.low{color:#64748b;background:#f1f3f7}.issue-count{width:55px;text-align:right;font-size:11px;color:#46536d}.button{display:inline-flex;align-items:center;gap:6px;text-decoration:none;border:1px solid #e1e6ef;background:#fff;border-radius:6px;color:#53617b;padding:7px 9px;font-size:9px}.quality-empty{text-align:center;padding:38px;color:#6f7d96}.quality-empty>span{font-size:24px;color:#159a77}.quality-empty h3{font-size:13px;color:#293653}.quality-empty p,.quality-disclaimer{font-size:10px;color:#8b96a9}.quality-disclaimer{margin-top:12px}
    @media(max-width:850px){.quality-overview{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:570px){.issue-row{gap:7px;flex-wrap:wrap}.issue-copy{flex-basis:calc(100% - 35px)}.issue-count{margin-left:auto}.issue-action{margin-left:auto}.page-heading-row{align-items:flex-start}.quality-score{font-size:10px;padding:6px}}
  `],
})
export class QualityPageComponent {
  readonly state = inject(WorkspaceService);
  severity: 'all' | 'high' | 'medium' | 'low' = 'all';
  get dataset() { return this.state.datasetWithCalculatedFields(); }
  get issues() { return this.state.qualityIssues(); }
  get metrics() { return this.dataset ? datasetMetrics(this.dataset, this.issues) : { missing: 0, duplicates: 0, numeric: 0, text: 0, dates: 0, booleans: 0 }; }
  get affectedColumns() { return new Set(this.issues.map((issue) => issue.column).filter(Boolean)).size; }
  get visibleIssues() { return this.severity === 'all' ? this.issues : this.issues.filter((issue) => issue.severity === this.severity); }
  get score() {
    if (!this.dataset) return 100;
    const penalty = this.issues.reduce((total, issue) => total + issue.count * (issue.severity === 'high' ? 1.5 : 1), 0);
    return Math.max(0, Math.round(100 - penalty / Math.max(1, this.dataset.rowCount * this.dataset.columnCount) * 100));
  }
}

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartViewComponent],
  template: `
    @if (dataset; as source) {
      <section class="page">
        <div class="page-heading-row"><div><h2>Analytics</h2><p>Profile columns and summarize the data in your current view.</p></div><span class="view-count">{{ rows.length | number }} rows in view</span></div>
        <div class="analytics-grid">
          <article class="panel analytics-config"><div class="panel-heading"><div><h3>Group and aggregate</h3><span class="muted">Build a quick summary from your records.</span></div></div>
            <div class="config-grid"><label>Group by<select [(ngModel)]="groupBy" (ngModelChange)="updateChart()">@for (column of categoryColumns; track column.name) { <option [value]="column.name">{{ column.name }}</option> }</select></label>
              <label>Measure<select [(ngModel)]="measure" (ngModelChange)="updateChart()">@for (column of numericColumns; track column.name) { <option [value]="column.name">{{ column.name }}</option> }</select></label>
              <label>Aggregation<select [(ngModel)]="operation" (ngModelChange)="updateChart()">@for (item of aggregates; track item) { <option [value]="item">{{ item | titlecase }}</option> }</select></label>
            </div>
            @if (summaryChart; as chart) { <div class="summary-chart"><app-chart-view [dataset]="source" [visualization]="chart" [rows]="rows" /></div> }
            <div class="summary-table"><div class="summary-table-head"><span>{{ groupBy || 'Group' }}</span><span>{{ operation | titlecase }} of {{ measure || 'Measure' }}</span></div>
              @for (item of groupedValues; track item.label) { <div class="summary-table-row"><span>{{ item.label }}</span><strong>{{ item.value | number:'1.0-2' }}</strong></div> }
              @if (!groupedValues.length) { <p class="muted">Choose columns to create an aggregate summary.</p> }
            </div>
          </article>
          <article class="panel insights-panel"><div class="panel-heading"><div><h3>Automatic insights</h3><span class="muted">Rule-based observations from the current view.</span></div><span class="spark">✦</span></div>
            <ul>@for (insight of insights; track insight) { <li><span>↗</span>{{ insight }}</li> } @empty { <li class="muted">No insights are available for this dataset yet.</li> }</ul>
          </article>
        </div>
        <article class="panel stats-panel"><div class="panel-heading"><div><h3>Column statistics</h3><span class="muted">Descriptive statistics update when workspace filters change.</span></div></div>
          <div class="table-wrap"><table><thead><tr><th>Column</th><th>Type</th><th>Count</th><th>Missing</th><th>Unique</th><th>Minimum</th><th>Maximum</th><th>Average</th><th>Median</th><th>Std. dev.</th></tr></thead><tbody>
            @for (column of source.columns; track column.id) {
              @let profile = column.dataType === 'number' ? numericProfile(column.name) : undefined;
              <tr><td><strong>{{ column.name }}</strong></td><td><span class="type-badge">{{ column.dataType }}</span></td><td>{{ rows.length - (column.dataType === 'number' ? profile?.missing ?? 0 : 0) | number }}</td><td>{{ column.missingCount | number }}</td><td>{{ column.uniqueCount | number }}</td>
                <td>{{ profile ? (profile.min | number:'1.0-2') : '—' }}</td><td>{{ profile ? (profile.max | number:'1.0-2') : '—' }}</td><td>{{ profile ? (profile.average | number:'1.0-2') : '—' }}</td><td>{{ profile ? (profile.median | number:'1.0-2') : '—' }}</td><td>{{ profile ? (profile.standardDeviation | number:'1.0-2') : '—' }}</td></tr>
            }
          </tbody></table></div>
        </article>
        <article class="panel correlation-panel"><div class="panel-heading"><div><h3>Correlation</h3><span class="muted">Pearson correlation across numeric columns. Near ±1 indicates a stronger linear relationship.</span></div></div>
          @if (numericColumns.length < 2) { <p class="muted">Add at least two numeric columns to calculate correlations.</p> }
          @else { <div class="correlation-grid"><div class="correlation-header"></div>@for (column of numericColumns; track column.name) { <div class="correlation-header">{{ column.name }}</div> }
            @for (row of numericColumns; track row.name) { <div class="correlation-header">{{ row.name }}</div>@for (column of numericColumns; track column.name) { <div class="correlation-cell" [class]="correlation(row.name,column.name) >= .7 ? 'strong' : correlation(row.name,column.name) <= -.7 ? 'negative' : ''">{{ correlation(row.name,column.name) | number:'1.2-2' }}</div> } }
          </div> }
        </article>
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-heading-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.page-heading-row h2{font-size:20px;margin:0 0 5px}.page-heading-row p{font-size:12px;color:#8792a6;margin:0}.view-count{font-size:10px;color:#76839b;background:#fff;border:1px solid #e4e9f2;border-radius:20px;padding:7px 10px}
    .analytics-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(240px,.75fr);gap:12px}.panel{background:white;border:1px solid #e4e9f2;border-radius:10px;padding:15px}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start}.panel-heading h3{margin:0;font-size:12px}.muted{display:block;color:#8792a6;font-size:9px;margin-top:5px}.config-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:16px}.config-grid label{display:grid;gap:6px;color:#7a879c;font-size:9px}.config-grid select{height:33px;padding:0 8px;border:1px solid #e3e7f0;border-radius:6px;background:#fff;color:#35415d;font-size:10px}
    .summary-chart{height:230px;margin:12px 0}.summary-table{border:1px solid #edf0f5;border-radius:7px;overflow:hidden}.summary-table-head,.summary-table-row{display:grid;grid-template-columns:1fr 1fr;padding:8px 10px;font-size:10px;border-bottom:1px solid #edf0f5}.summary-table-head{background:#f8faff;color:#8290a7;font-size:9px}.summary-table-row{color:#5d6980}.summary-table-row strong{text-align:right;color:#293752}.summary-table>p{padding:10px}
    .insights-panel ul{list-style:none;padding:0;margin:13px 0;display:grid;gap:10px}.insights-panel li{display:flex;gap:8px;font-size:10px;color:#596780;line-height:1.55}.insights-panel li span{color:#169876}
    .stats-panel,.correlation-panel{margin-top:12px}.table-wrap{overflow:auto;margin-top:12px}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{padding:9px 10px;text-align:right;border-bottom:1px solid #eef0f5;font-size:9px;color:#56637d}th{background:#f8faff;color:#7c899f;font-weight:600}th:first-child,td:first-child{text-align:left}.type-badge{padding:3px 6px;border-radius:5px;background:#f0f3f9;color:#64738d;font-size:8px}
    .correlation-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(75px,1fr));margin-top:13px;overflow:auto}.correlation-header,.correlation-cell{min-width:76px;padding:9px 5px;text-align:center;border:1px solid #edf0f5;font-size:9px;color:#66738d}.correlation-header{font-weight:600;background:#f8faff}.correlation-cell{color:#4b5975}.correlation-cell.strong{background:#e5f6ef;color:#138061}.correlation-cell.negative{background:#fff0ee;color:#b24c42}.spark{color:#eba631;font-size:17px}
    @media(max-width:850px){.analytics-grid{grid-template-columns:1fr}}
    @media(max-width:580px){.config-grid{grid-template-columns:1fr}.page-heading-row{align-items:flex-start}.view-count{font-size:9px}.summary-chart{height:190px}}
  `],
})
export class AnalyticsPageComponent {
  readonly state = inject(WorkspaceService);
  readonly aggregates = AGGREGATES;
  groupBy = '';
  measure = '';
  operation: Aggregate = 'sum';
  summaryChart?: Visualization;

  constructor() {
    effect(() => {
      const dataset = this.state.datasetWithCalculatedFields();
      if (dataset) {
        this.groupBy = dataset.columns.find((column) => column.dataType === 'string')?.name ?? dataset.columns[0]?.name ?? '';
        this.measure = dataset.columns.find((column) => column.dataType === 'number')?.name ?? '';
        this.updateChart();
      }
    });
  }
  get dataset() { return this.state.datasetWithCalculatedFields(); }
  get rows() {
    return this.state.visibleRows();
  }
  get numericColumns() { return this.dataset?.columns.filter((column) => column.dataType === 'number') ?? []; }
  get categoryColumns() { return this.dataset?.columns.filter((column) => column.dataType !== 'number' && column.dataType !== 'unknown') ?? []; }
  get insights() { return this.dataset ? buildInsights(this.dataset, this.rows) : []; }
  get groupedValues() {
    if (!this.groupBy || !this.measure) return [];
    const groups = new Map<string, string[]>();
    this.rows.forEach((row) => {
      const label = row[this.groupBy] || '(empty)';
      const values = groups.get(label);
      if (values) values.push(row[this.measure] ?? '');
      else groups.set(label, [row[this.measure] ?? '']);
    });
    return [...groups.entries()].map(([label, values]) => ({ label, value: aggregate(values, this.operation) }))
      .sort((a, b) => b.value - a.value).slice(0, 20);
  }
  updateChart(): void {
    if (!this.dataset || !this.measure) { this.summaryChart = undefined; return; }
    this.summaryChart = {
      id: 'analytics-summary', type: 'bar', title: 'Grouped summary', dimension: this.groupBy || this.dataset.columns[0].name,
      measure: this.measure, aggregate: this.operation, createdAt: '', updatedAt: '',
    };
  }
  numericProfile(column: string) {
    return this.dataset ? getNumericProfile(this.dataset, column, this.rows) : undefined;
  }
  correlation(first: string, second: string): number {
    const pairs = this.rows.map((row) => [Number(row[first]), Number(row[second])] as const)
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    if (pairs.length < 2) return 0;
    const meanA = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
    const meanB = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
    const numerator = pairs.reduce((sum, pair) => sum + (pair[0] - meanA) * (pair[1] - meanB), 0);
    const denominatorA = Math.sqrt(pairs.reduce((sum, pair) => sum + (pair[0] - meanA) ** 2, 0));
    const denominatorB = Math.sqrt(pairs.reduce((sum, pair) => sum + (pair[1] - meanB) ** 2, 0));
    return denominatorA && denominatorB ? numerator / (denominatorA * denominatorB) : 0;
  }
}

@Component({
  selector: 'app-visualize-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartViewComponent],
  template: `
    @if (dataset; as source) {
      <section class="page">
        <div class="page-heading-row"><div><h2>Visualization builder</h2><p>Configure a chart, preview it, and save it to your workspace.</p></div></div>
        <div class="builder-layout">
          <article class="panel chart-config"><div class="panel-heading"><h3>Chart configuration</h3></div>
            <label>Chart title<input [(ngModel)]="title" (ngModelChange)="scheduleTitlePreview()" (blur)="commitTitlePreview()" (keydown.enter)="blurTitleInput($event)" placeholder="e.g. Revenue by country" /></label>
            <label>Chart type<select [(ngModel)]="chartType" (ngModelChange)="updatePreview()">@for (type of chartTypes; track type.value) { <option [value]="type.value">{{ type.label }}</option> }</select></label>
            @if (chartType !== 'kpi' && chartType !== 'histogram') { <label>Dimension<select [(ngModel)]="dimension" (ngModelChange)="updatePreview()">@for (column of dimensionOptions; track column.name) { <option [value]="column.name">{{ column.name }} · {{ column.dataType }}</option> }</select></label> }
            <label>{{ chartType === 'kpi' ? 'Value' : 'Measure' }}<select [(ngModel)]="measure" (ngModelChange)="updatePreview()">@for (column of numericColumns; track column.name) { <option [value]="column.name">{{ column.name }}</option> }</select></label>
            @if (chartType !== 'kpi' && chartType !== 'histogram' && chartType !== 'scatter') { <label>Aggregation<select [(ngModel)]="operation" (ngModelChange)="updatePreview()">@for (item of aggregates; track item) { <option [value]="item">{{ item | titlecase }}</option> }</select></label> }
            <button type="button" class="button primary save-chart" [disabled]="!preview || !measure" (click)="saveChart()">{{ editingId ? 'Save changes' : 'Save visualization' }}</button>
            @if (editingId) { <button type="button" class="button secondary cancel-edit" (click)="cancelEdit()">Cancel editing</button> }
            @if (validationMessage) { <p class="validation-message">{{ validationMessage }}</p> }
          </article>
          <article class="panel preview-panel"><div class="panel-heading"><div><h3>Live preview</h3><span class="muted">Updates as you configure your chart.</span></div>@if (preview) { <button class="button secondary" type="button" (click)="downloadPreview()">⇩ PNG</button> }</div>
            @if (preview) { <div class="chart-preview"><app-chart-view #chart [dataset]="source" [visualization]="preview" [rows]="rows" /></div> }
            @else { <div class="chart-empty"><span>◔</span><strong>Choose a numeric measure to get started.</strong><p>Chart options are based on the columns in your dataset.</p></div> }
          </article>
        </div>
        <article class="panel saved-visualizations"><div class="panel-heading"><div><h3>Saved visualizations</h3><span class="muted">Add a saved chart to your dashboard at any time.</span></div><span class="count-pill">{{ saved.length }}</span></div>
          @if (saved.length) { <div class="saved-list">@for (chart of saved; track chart.id) { <div class="saved-item"><span class="chart-type-icon">▥</span><div class="saved-copy"><strong>{{ chart.title }}</strong><small>{{ chart.type | titlecase }} · {{ chart.dimension }} · {{ chart.measure }}</small></div><div class="saved-actions"><button class="button secondary" type="button" (click)="editChart(chart)">Edit</button><button class="button secondary" type="button" (click)="duplicateChart(chart)">Duplicate</button><button class="button secondary" type="button" (click)="addToDashboard(chart.id)">＋ Dashboard</button><button class="button delete-chart" type="button" [attr.aria-label]="'Delete ' + chart.title" (click)="deleteChart(chart)">×</button></div></div> }</div> }
          @else { <div class="empty-inline">Saved charts will appear here.</div> }
        </article>
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-heading-row{margin-bottom:15px}.page-heading-row h2{font-size:20px;margin:0 0 5px}.page-heading-row p{font-size:12px;color:#8792a6;margin:0}.panel{background:#fff;border:1px solid #e4e9f2;border-radius:10px;padding:15px}.builder-layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:12px}.panel-heading{display:flex;align-items:center;justify-content:space-between}.panel-heading h3{font-size:12px;margin:0}.muted{display:block;font-size:9px;color:#8792a6;margin-top:5px}.chart-config{display:grid;align-content:start;gap:13px}.chart-config>label{display:grid;gap:6px;font-size:9px;color:#7b879b}.chart-config input,.chart-config select{height:34px;padding:0 9px;border:1px solid #e3e7f0;border-radius:6px;background:#fff;color:#35415d;font-size:10px}.save-chart{justify-content:center;margin-top:4px;padding:10px}.save-chart:disabled{opacity:.5;cursor:default}.cancel-edit{justify-content:center}.validation-message{font-size:10px;color:#b95347;margin:0}.preview-panel{min-width:0}.chart-preview{height:390px;margin-top:15px}.chart-empty{height:390px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#8c97aa;text-align:center}.chart-empty span{font-size:26px;color:#6973dc;margin-bottom:10px}.chart-empty strong{font-size:12px;color:#53617c}.chart-empty p{font-size:10px}.saved-visualizations{margin-top:12px}.count-pill{background:#f0f2ff;color:#5361d4;border-radius:15px;padding:4px 8px;font-size:9px}.saved-list{margin-top:10px}.saved-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #edf0f5}.chart-type-icon{width:32px;height:32px;border-radius:7px;background:#eff1ff;color:#5966dc;display:grid;place-items:center}.saved-copy{display:grid;gap:4px;flex:1;min-width:0}.saved-copy strong{font-size:10px;color:#293653}.saved-copy small{font-size:9px;color:#8994a8}.saved-actions{display:flex;gap:5px;align-items:center}.saved-item .button{font-size:9px;white-space:nowrap}.delete-chart{min-width:29px;padding:6px;color:#a24a42}.empty-inline{padding:24px;text-align:center;font-size:10px;color:#8792a6}
    @media(max-width:780px){.builder-layout{grid-template-columns:1fr}.chart-config{grid-template-columns:repeat(2,minmax(0,1fr))}.chart-config .panel-heading,.save-chart,.validation-message,.cancel-edit{grid-column:span 2}.chart-preview,.chart-empty{height:290px}}
    @media(max-width:520px){.chart-config{grid-template-columns:1fr}.chart-config .panel-heading,.save-chart,.validation-message,.cancel-edit{grid-column:auto}.saved-item{flex-wrap:wrap}.saved-actions{width:100%;flex-wrap:wrap}.saved-item .button{margin-left:0}}
  `],
})
export class VisualizePageComponent implements OnDestroy {
  readonly state = inject(WorkspaceService);
  readonly chartTypes = TYPES;
  readonly aggregates = AGGREGATES;
  chartType: ChartType = 'bar';
  dimension = '';
  measure = '';
  operation: Aggregate = 'sum';
  title = '';
  preview?: Visualization;
  validationMessage = '';
  @ViewChild('chart') private chartView?: ChartViewComponent;
  editingId = '';
  private titleUpdateTimer?: ReturnType<typeof setTimeout>;
  constructor() {
    effect(() => {
      const dataset = this.state.datasetWithCalculatedFields();
      if (dataset && !this.measure) {
        this.measure = dataset.columns.find((column) => column.dataType === 'number')?.name ?? '';
        this.dimension = dataset.columns.find((column) => column.dataType === 'string' || column.dataType === 'date')?.name ?? dataset.columns[0]?.name ?? '';
        this.title = this.measure && this.dimension ? `${this.measure} by ${this.dimension}` : '';
        this.updatePreview();
      }
    });
  }
  get dataset() { return this.state.datasetWithCalculatedFields(); }
  get workspace() { return this.state.workspace(); }
  get rows() {
    return this.state.visibleRows();
  }
  get columns() { return this.dataset?.columns ?? []; }
  get numericColumns() { return this.columns.filter((column) => column.dataType === 'number'); }
  get dimensionOptions() { return this.chartType === 'scatter' ? this.numericColumns : this.columns; }
  get saved() { return this.workspace?.visualizations ?? []; }

  ngOnDestroy(): void {
    if (this.titleUpdateTimer) clearTimeout(this.titleUpdateTimer);
  }

  scheduleTitlePreview(): void {
    if (this.titleUpdateTimer) clearTimeout(this.titleUpdateTimer);
    this.titleUpdateTimer = setTimeout(() => {
      this.titleUpdateTimer = undefined;
      this.updatePreview();
    }, 400);
  }
  commitTitlePreview(): void {
    if (!this.titleUpdateTimer) return;
    clearTimeout(this.titleUpdateTimer);
    this.titleUpdateTimer = undefined;
    this.updatePreview();
  }
  blurTitleInput(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  updatePreview(): void {
    if (!this.dataset) return;
    const requiredDimension = !['kpi', 'histogram'].includes(this.chartType);
    if (!this.measure || (requiredDimension && !this.dimension)) {
      this.preview = undefined;
      this.validationMessage = 'Select the fields required for this chart.';
      return;
    }
    if (this.chartType === 'scatter' && !this.numericColumns.some((column) => column.name === this.dimension)) {
      this.preview = undefined;
      this.validationMessage = 'Scatter charts need numeric values for both axes.';
      return;
    }
    this.validationMessage = '';
    this.preview = {
      id: 'live-preview',
      type: this.chartType,
      title: this.title.trim() || `${this.chartType} chart`,
      dimension: this.dimension || this.measure,
      measure: this.measure,
      aggregate: this.operation,
      createdAt: '',
      updatedAt: '',
    };
  }
  saveChart(): void {
    this.commitTitlePreview();
    if (!this.preview || !this.workspace) return;
    const now = new Date().toISOString();
    const original = this.saved.find((item) => item.id === this.editingId);
    const chart = { ...this.preview, id: this.editingId || crypto.randomUUID(), title: this.title.trim() || this.preview.title, createdAt: original?.createdAt ?? now, updatedAt: now };
    void this.state.saveVisualization(chart).then(() => { this.editingId = ''; }).catch(() => undefined);
  }
  addToDashboard(id: string): void { void this.state.addVisualizationToDashboard(id).catch(() => undefined); }
  editChart(chart: Visualization): void {
    this.editingId = chart.id;
    this.chartType = chart.type;
    this.dimension = chart.dimension;
    this.measure = chart.measure;
    this.operation = chart.aggregate;
    this.title = chart.title;
    this.updatePreview();
  }
  cancelEdit(): void {
    this.editingId = '';
    this.updatePreview();
  }
  duplicateChart(chart: Visualization): void {
    const now = new Date().toISOString();
    void this.state.saveVisualization({ ...chart, id: crypto.randomUUID(), title: `${chart.title} copy`, createdAt: now, updatedAt: now }).catch(() => undefined);
  }
  deleteChart(chart: Visualization): void {
    if (!window.confirm(`Delete the visualization "${chart.title}"?`)) return;
    void this.state.deleteVisualization(chart.id).catch(() => undefined);
  }
  downloadPreview(): void {
    try {
      this.chartView?.downloadPng();
    } catch (error) {
      this.state.error.set(error instanceof Error ? error.message : 'The chart image could not be exported.');
    }
  }
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CdkDropList, CdkDrag, ChartViewComponent],
  template: `
    @if (dataset; as source) {
      <section class="page">
        <div class="page-heading-row"><div><h2>{{ dashboard?.name || 'Dashboard' }}</h2><p>{{ dashboard?.presentationMode ? 'Presentation mode · editing is disabled' : 'Arrange saved visualizations into a clear, shareable overview.' }}</p></div><div class="dashboard-actions">@if (!dashboard?.presentationMode) { <input class="dashboard-name" aria-label="Dashboard name" [ngModel]="dashboard?.name" (ngModelChange)="renameDashboard($event)" /> }<button class="button secondary" type="button" (click)="togglePresentation()">{{ dashboard?.presentationMode ? 'Exit presentation' : '▷ Present' }}</button><button class="button primary" type="button" [disabled]="!dashboardCharts.length" (click)="exportDashboard()">⇩ Export PNG</button></div></div>
        @if (!dashboardCharts.length) {
          <div class="dashboard-empty panel"><span>▦</span><h3>Your dashboard is ready for charts</h3><p>Create a visualization, then add it to this dashboard.</p><a class="button primary" [routerLink]="['/workspace', workspace?.id, 'visualize']">Create a chart</a></div>
        } @else {
          <div class="dashboard-grid" cdkDropList [cdkDropListDisabled]="dashboard?.presentationMode" (cdkDropListDropped)="drop($event)">
            @for (chart of dashboardCharts; track chart.id) {
              <article class="dashboard-widget panel" cdkDrag [cdkDragDisabled]="dashboard?.presentationMode">
                <div class="widget-heading"><div><h3>{{ chart.title }}</h3><span>{{ chart.type | titlecase }} · {{ chart.measure }}</span></div>@if (!dashboard?.presentationMode) { <div class="widget-controls"><button type="button" cdkDragHandle aria-label="Drag to reorder">⠿</button><button type="button" aria-label="Remove from dashboard" (click)="remove(chart.id)">×</button></div> }</div>
                <div class="widget-chart"><app-chart-view [dataset]="source" [visualization]="chart" [rows]="rows" /></div>
              </article>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-heading-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.page-heading-row h2{font-size:20px;margin:0 0 5px}.page-heading-row p{font-size:12px;color:#8792a6;margin:0}.dashboard-actions{display:flex;gap:7px;align-items:center}.dashboard-name{height:33px;width:150px;padding:0 8px;border:1px solid #e2e7f0;border-radius:6px;font-size:10px;color:#45526d}.button{border:1px solid #e0e5ef;border-radius:6px;padding:8px 10px;background:white;color:#52607a;font-size:10px;text-decoration:none;cursor:pointer}.primary{background:#5663de;border-color:#5663de;color:white}.button:disabled{opacity:.45;cursor:default}.panel{background:white;border:1px solid #e4e9f2;border-radius:10px}.dashboard-empty{min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#8995a8}.dashboard-empty>span{font-size:30px;color:#6570da}.dashboard-empty h3{font-size:15px;color:#283654;margin:14px 0 5px}.dashboard-empty p{font-size:11px;margin:0 0 15px}.dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dashboard-widget{min-width:0;min-height:300px;padding:13px;resize:both;overflow:auto}.widget-heading{display:flex;align-items:flex-start;justify-content:space-between}.widget-heading h3{font-size:11px;margin:0;color:#253351}.widget-heading span{display:block;font-size:9px;color:#8a95a8;margin-top:4px}.widget-controls{display:flex;gap:4px}.widget-controls button{width:25px;height:25px;border:1px solid #e5e9f1;border-radius:5px;background:white;color:#66728b;font-size:14px;cursor:pointer}.widget-chart{height:230px;margin-top:10px}.cdk-drag-preview{box-shadow:0 12px 30px #18284a22}.cdk-drag-placeholder{opacity:.25}.cdk-drop-list-dragging .dashboard-widget:not(.cdk-drag-placeholder){transition:transform 150ms ease}.dashboard-widget.cdk-drag-disabled{cursor:default}
    @media(max-width:750px){.dashboard-grid{grid-template-columns:1fr}.page-heading-row{align-items:flex-start;flex-direction:column}.dashboard-actions{flex-wrap:wrap}.dashboard-name{flex:1}}
  `],
})
export class DashboardPageComponent {
  readonly state = inject(WorkspaceService);
  get dataset() { return this.state.datasetWithCalculatedFields(); }
  get workspace() { return this.state.workspace(); }
  get dashboard() { return this.workspace?.dashboard; }
  get dashboardCharts() {
    const workspace = this.workspace;
    if (!workspace) return [];
    return workspace.dashboard.visualizationIds
      .map((id) => workspace.visualizations.find((item) => item.id === id))
      .filter((item): item is Visualization => Boolean(item));
  }
  get rows() {
    return this.state.visibleRows();
  }
  drop(event: CdkDragDrop<Visualization[]>): void {
    const ids = this.dashboardCharts.map((chart) => chart.id);
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    void this.state.updateDashboard(ids).catch(() => undefined);
  }
  remove(id: string): void {
    void this.state.updateDashboard(this.dashboardCharts.filter((chart) => chart.id !== id).map((chart) => chart.id)).catch(() => undefined);
  }
  renameDashboard(name: string): void {
    void this.state.updateDashboard(this.dashboardCharts.map((chart) => chart.id), name).catch(() => undefined);
  }
  togglePresentation(): void {
    if (this.dashboard) void this.state.updateDashboard(this.dashboard.visualizationIds, undefined, !this.dashboard.presentationMode).catch(() => undefined);
  }
  exportDashboard(): void {
    const root = document.querySelector('.dashboard-grid') as HTMLElement | null;
    if (!root) return;
    const widgets = [...root.querySelectorAll<HTMLElement>('.dashboard-widget')];
    if (!widgets.length) return;
    const columns = 2;
    const cellWidth = 720;
    const cellHeight = 440;
    const canvas = document.createElement('canvas');
    canvas.width = cellWidth * columns;
    canvas.height = cellHeight * Math.ceil(widgets.length / columns);
    const context = canvas.getContext('2d');
    if (!context) {
      this.state.error.set('The dashboard image could not be prepared by this browser.');
      return;
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    widgets.forEach((widget, index) => {
      const x = (index % columns) * cellWidth;
      const y = Math.floor(index / columns) * cellHeight;
      const title = widget.querySelector('h3')?.textContent ?? '';
      context.fillStyle = '#18213f';
      context.font = '600 18px Inter, sans-serif';
      context.fillText(title, x + 24, y + 30);
      const chart = widget.querySelector('canvas');
      if (chart) {
        context.drawImage(chart, x + 15, y + 45, cellWidth - 30, cellHeight - 60);
      } else {
        const kpi = widget.querySelector('.kpi-visual');
        if (kpi) {
          context.fillStyle = '#74819a';
          context.font = '16px Inter, sans-serif';
          context.fillText(kpi.querySelector('span')?.textContent ?? '', x + 30, y + 110);
          context.fillStyle = '#18244c';
          context.font = '700 48px Inter, sans-serif';
          context.fillText(kpi.querySelector('strong')?.textContent ?? '', x + 30, y + 190);
          context.fillStyle = '#74819a';
          context.font = '16px Inter, sans-serif';
          context.fillText(kpi.querySelector('small')?.textContent ?? '', x + 30, y + 225);
        }
      }
    });
    const link = document.createElement('a');
    link.download = `${this.dashboard?.name ?? 'dashboard'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

@Component({
  selector: 'app-calculated-fields-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (dataset; as source) {
      <section class="page">
        <div class="page-heading-row"><div><h2>Calculated fields</h2><p>Create derived columns with a safe, limited formula language.</p></div></div>
        <div class="calculated-layout">
          <article class="panel formula-editor"><div class="panel-heading"><div><h3>New calculated field</h3><span class="muted">Formulas are evaluated locally and never run as JavaScript.</span></div></div>
            <label>Field name<input [(ngModel)]="name" placeholder="e.g. Profit" /></label>
            <label>Formula<textarea [(ngModel)]="formula" placeholder="revenue - cost" rows="3"></textarea></label>
            <div class="formula-help"><strong>Supported</strong><span>Arithmetic, parentheses, quoted text, column names, and ABS, ROUND, MIN, MAX, LOWER, UPPER, CONCAT.</span><code>price * quantity</code><code>ROUND(revenue / 1.1, 2)</code><code>[First name] + " " + [Last name]</code></div>
            <button type="button" class="button secondary" (click)="previewFormula()">Preview results</button>
            @if (formulaError) { <p class="formula-error" role="alert">{{ formulaError }}</p> }
            @if (previewValues.length) { <div class="formula-preview"><strong>Preview</strong>@for (item of previewValues; track $index) { <span>{{ item }}</span> }</div> }
            <button type="button" class="button primary create-field" [disabled]="!previewValues.length || !name.trim()" (click)="createField()">Add calculated field</button>
          </article>
          <article class="panel formula-list"><div class="panel-heading"><div><h3>Saved fields</h3><span class="muted">{{ fields.length }} calculated fields in this workspace</span></div></div>
            @for (field of fields; track field.id) { <div class="field-item"><span class="field-icon">ƒx</span><div><strong>{{ field.name }}</strong><code>{{ field.formula }}</code></div><span class="type-badge">{{ field.dataType }}</span><button type="button" aria-label="Delete calculated field" (click)="removeField(field.id)">×</button></div> }
            @if (!fields.length) { <div class="empty-fields"><span>ƒx</span><p>Your derived columns will appear here.</p></div> }
          </article>
        </div>
      </section>
    }
  `,
  styles: [`
    .page{color:#17213f}.page-heading-row{margin-bottom:15px}.page-heading-row h2{font-size:20px;margin:0 0 5px}.page-heading-row p{font-size:12px;color:#8792a6;margin:0}.calculated-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:12px}.panel{background:#fff;border:1px solid #e4e9f2;border-radius:10px;padding:15px}.panel-heading h3{margin:0;font-size:12px}.muted{display:block;color:#8792a6;font-size:9px;margin-top:5px}.formula-editor{display:grid;align-content:start;gap:12px}.formula-editor>label{display:grid;gap:6px;color:#74819a;font-size:10px}.formula-editor input,.formula-editor textarea{width:100%;padding:9px;border:1px solid #e2e7f0;border-radius:6px;background:#fff;color:#2d3955;font-size:11px;resize:vertical}.formula-editor textarea{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.button{justify-content:center;border:1px solid #e1e6ef;background:#fff;color:#53617b;border-radius:6px;padding:9px 11px;font-size:10px;cursor:pointer}.primary{background:#5663de;border-color:#5663de;color:white}.button:disabled{opacity:.5;cursor:default}.formula-help{padding:10px;background:#f8faff;border-radius:7px;display:grid;gap:6px;color:#78859a;font-size:9px}.formula-help strong{color:#4b5975}.formula-help code,.field-item code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#5764d5;font-size:9px}.formula-error{margin:0;color:#b24b42;font-size:10px}.formula-preview{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:9px;color:#728099}.formula-preview span{padding:5px 7px;border-radius:5px;background:#edf8f3;color:#197c62}.create-field{margin-top:2px}.formula-list{min-width:0}.field-item{display:flex;align-items:center;gap:9px;padding:12px 0;border-bottom:1px solid #edf0f5}.field-icon{width:30px;height:30px;border-radius:7px;display:grid;place-items:center;background:#f0edff;color:#7256d5;font-size:11px}.field-item>div{display:grid;gap:4px;min-width:0;flex:1}.field-item>div strong{font-size:10px;color:#34405c}.field-item code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}.type-badge{font-size:8px;color:#70809a;background:#f1f3f8;border-radius:5px;padding:4px 6px}.field-item button{border:0;background:transparent;color:#9aa3b2;font-size:17px;cursor:pointer}.empty-fields{text-align:center;padding:35px 10px;color:#8792a6;font-size:10px}.empty-fields span{font-size:22px;color:#7762d1}
    @media(max-width:780px){.calculated-layout{grid-template-columns:1fr}}
  `],
})
export class CalculatedFieldsPageComponent {
  readonly state = inject(WorkspaceService);
  name = '';
  formula = '';
  formulaError = '';
  previewValues: string[] = [];

  get dataset() { return this.state.datasetWithCalculatedFields(); }
  get workspace() { return this.state.workspace(); }
  get fields() { return this.workspace?.calculatedFields ?? []; }

  previewFormula(): void {
    this.formulaError = '';
    this.previewValues = [];
    if (!this.dataset) return;
    try {
      this.previewValues = this.dataset.rows.slice(0, 5).map((row) => evaluateFormula(this.formula, row));
    } catch (error) {
      this.formulaError = error instanceof Error ? error.message : 'The formula could not be evaluated.';
    }
  }

  createField(): void {
    if (!this.dataset || !this.workspace) return;
    const name = this.name.trim();
    if (!name || this.dataset.columns.some((column) => column.name.toLowerCase() === name.toLowerCase())) {
      this.formulaError = 'Choose a unique field name that does not match an existing column.';
      return;
    }
    this.formulaError = '';
    try {
      const values = this.dataset.rows.map((row) => evaluateFormula(this.formula, row));
      const timestamp = new Date().toISOString();
      const field = { id: crypto.randomUUID(), name, formula: this.formula.trim(), dataType: this.inferType(values), createdAt: timestamp };
      void this.state.saveWorkspace({ ...this.workspace, calculatedFields: [...this.fields, field] })
        .then(() => { this.name = ''; this.formula = ''; this.previewValues = []; })
        .catch(() => undefined);
    } catch (error) {
      this.formulaError = error instanceof Error ? error.message : 'The formula could not be evaluated for every record.';
    }
  }

  removeField(id: string): void {
    const field = this.fields.find((item) => item.id === id);
    if (!field || !this.workspace) return;
    const escaped = field.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reference = new RegExp(`(?:\\[${escaped}\\]|\\b${escaped}\\b)`);
    const dependent = this.fields.find((item) => item.id !== id && reference.test(item.formula));
    if (dependent) {
      this.state.error.set(`Delete "${dependent.name}" before removing "${field.name}" because its formula uses that field.`);
      return;
    }
    void this.state.saveWorkspace({ ...this.workspace, calculatedFields: this.fields.filter((item) => item.id !== id) }).catch(() => undefined);
  }

  private inferType(values: string[]): 'number' | 'string' | 'boolean' | 'date' | 'datetime' | 'unknown' {
    if (values.every((value) => Number.isFinite(Number(value)))) return 'number';
    if (values.length && values.every((value) => ['true', 'false'].includes(value.toLowerCase()))) return 'boolean';
    if (values.length && values.every((value) => Number.isFinite(Date.parse(value)))) return 'date';
    return 'string';
  }
}
