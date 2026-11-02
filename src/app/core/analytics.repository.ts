import { Injectable, InjectionToken } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Dataset, Workspace } from './models';

export interface AnalyticsRepository {
  listDatasets(): Promise<Dataset[]>;
  getDataset(id: string): Promise<Dataset | undefined>;
  saveDataset(dataset: Dataset): Promise<void>;
  saveImport(dataset: Dataset, workspace: Workspace): Promise<void>;
  deleteDataset(id: string): Promise<void>;
  listWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  clear(): Promise<void>;
}

export const ANALYTICS_REPOSITORY = new InjectionToken<AnalyticsRepository>('AnalyticsRepository');

interface AnalyticsDatabase extends DBSchema {
  datasets: {
    key: string;
    value: Dataset;
  };
  workspaces: {
    key: string;
    value: Workspace;
  };
}

@Injectable({ providedIn: 'root' })
export class IndexedDbAnalyticsRepository implements AnalyticsRepository {
  private database?: Promise<IDBPDatabase<AnalyticsDatabase>>;

  private open(): Promise<IDBPDatabase<AnalyticsDatabase>> {
    this.database ??= openDB<AnalyticsDatabase>('csv-analytics-tool', 1, {
      upgrade(database) {
        database.createObjectStore('datasets', { keyPath: 'id' });
        database.createObjectStore('workspaces', { keyPath: 'id' });
      },
    });
    return this.database;
  }

  async listDatasets(): Promise<Dataset[]> {
    return (await this.open()).getAll('datasets');
  }

  async getDataset(id: string): Promise<Dataset | undefined> {
    return (await this.open()).get('datasets', id);
  }

  async saveDataset(dataset: Dataset): Promise<void> {
    await (await this.open()).put('datasets', dataset);
  }

  async saveImport(dataset: Dataset, workspace: Workspace): Promise<void> {
    const transaction = (await this.open()).transaction(['datasets', 'workspaces'], 'readwrite');
    await Promise.all([
      transaction.objectStore('datasets').put(dataset),
      transaction.objectStore('workspaces').put(workspace),
    ]);
    await transaction.done;
  }

  async deleteDataset(id: string): Promise<void> {
    const database = await this.open();
    const workspaces = (await database.getAll('workspaces')).filter((workspace) => workspace.datasetId === id);
    const transaction = database.transaction(['datasets', 'workspaces'], 'readwrite');
    await Promise.all([
      transaction.objectStore('datasets').delete(id),
      ...workspaces.map((workspace) => transaction.objectStore('workspaces').delete(workspace.id)),
    ]);
    await transaction.done;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return (await this.open()).getAll('workspaces');
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    return (await this.open()).get('workspaces', id);
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    await (await this.open()).put('workspaces', workspace);
  }

  async deleteWorkspace(id: string): Promise<void> {
    await (await this.open()).delete('workspaces', id);
  }

  async clear(): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(['datasets', 'workspaces'], 'readwrite');
    await Promise.all([
      transaction.objectStore('datasets').clear(),
      transaction.objectStore('workspaces').clear(),
    ]);
    await transaction.done;
  }
}
