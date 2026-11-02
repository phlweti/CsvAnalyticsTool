import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Dataset, Workspace } from '../core/models';
import { WorkspaceService } from '../core/workspace.service';
import { formatBytes } from '../shared/format';
import { applyAccentColor, DEFAULT_ACCENT_COLOR, isAccentColor } from '../shared/accent-color';

@Component({
  selector: 'app-datasets-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="library-page">
      <header class="library-header"><a class="brand" routerLink="/"><span class="brand-mark">▥</span>CSV Analytics</a><nav><a routerLink="/">Home</a><a routerLink="/datasets" class="selected">Datasets</a><a routerLink="/workspaces">Workspaces</a><a routerLink="/settings">Settings</a></nav></header>
      <section class="library-content">
        <div class="page-title"><div><span class="eyebrow">YOUR LOCAL LIBRARY</span><h1>Datasets</h1><p>Imported files are stored only in this browser.</p></div><a class="button primary" routerLink="/">＋ Import CSV</a></div>
        @if (state.datasets().length) {
          <div class="dataset-list panel">
            @for (dataset of state.datasets(); track dataset.id) {
              <article class="dataset-row"><span class="file-icon">CSV</span><div class="dataset-copy"><strong>{{ dataset.name }}</strong><small>{{ dataset.rowCount | number }} rows · {{ dataset.columnCount }} columns · {{ formatBytes(dataset.fileSize) }}</small><small>Imported {{ dataset.createdAt | date:'mediumDate' }}</small></div><div class="dataset-actions"><button type="button" class="button secondary" (click)="open(dataset.id)">Open dataset</button><button type="button" class="icon-button" aria-label="Rename dataset" (click)="rename(dataset)">✎</button><button type="button" class="icon-button danger" aria-label="Delete dataset" (click)="remove(dataset)">×</button></div></article>
            }
          </div>
        } @else {
          <div class="empty-state panel"><span>▤</span><h2>No datasets yet</h2><p>Import a CSV to start exploring your data.</p><a class="button primary" routerLink="/">Import your first dataset</a></div>
        }
      </section>
    </main>
  `,
  styles: [`
    .library-page{min-height:100vh;background:#f8faff;color:#17213f}.library-header{height:61px;padding:0 clamp(16px,5vw,70px);display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf5}.brand{display:flex;gap:9px;align-items:center;text-decoration:none;color:#18244c;font-size:14px;font-weight:700}.brand-mark{width:26px;height:26px;display:grid;place-items:center;border-radius:6px;background:#3746a4;color:white;font-size:16px}.library-header nav{display:flex;gap:19px}.library-header nav a{font-size:11px;color:#77839a;text-decoration:none}.library-header nav a.selected{color:#4d5bd4;font-weight:600}
    .library-content{max-width:1040px;margin:0 auto;padding:38px 20px}.page-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.eyebrow{font-size:9px;letter-spacing:1px;font-weight:700;color:#7784a0}.page-title h1{font-size:25px;margin:6px 0 4px;letter-spacing:-.4px}.page-title p{font-size:11px;color:#8792a6;margin:0}.button{display:inline-flex;align-items:center;gap:6px;text-decoration:none;border:1px solid #e0e5ef;border-radius:7px;padding:9px 12px;color:#52607a;background:white;font-size:10px;font-weight:600;cursor:pointer}.primary{background:#5562dc;border-color:#5562dc;color:white}.panel{background:#fff;border:1px solid #e4e9f2;border-radius:10px}.dataset-list{overflow:hidden}.dataset-row{min-height:82px;padding:14px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #edf0f5}.dataset-row:last-child{border-bottom:0}.file-icon{width:37px;height:39px;display:grid;place-items:center;flex:0 0 37px;border-radius:7px;background:#e8f7f1;color:#14896b;font-size:9px;font-weight:800}.dataset-copy{display:grid;gap:4px;min-width:0;flex:1}.dataset-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#263451}.dataset-copy small{color:#8b96a9;font-size:9px}.dataset-actions{display:flex;align-items:center;gap:7px}.icon-button{width:30px;height:30px;display:grid;place-items:center;border:1px solid #e2e7ef;background:#fff;color:#6b7891;border-radius:6px;text-decoration:none;cursor:pointer}.danger:hover{color:#b94b42;border-color:#f0d1ce}.empty-state{min-height:300px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}.empty-state>span{font-size:30px;color:#6470db}.empty-state h2{font-size:15px;margin:12px 0 4px}.empty-state p{font-size:11px;color:#8792a6;margin:0 0 14px}
    @media(max-width:600px){.library-header{padding:0 14px}.library-header nav{gap:10px}.library-header nav a{font-size:9px}.library-content{padding:25px 12px}.page-title{align-items:flex-start}.dataset-row{padding:12px 9px;gap:8px}.dataset-actions .button{font-size:0;padding:8px}.icon-button{width:27px;height:27px}}
  `],
})
export class DatasetsPageComponent {
  readonly state = inject(WorkspaceService);
  readonly formatBytes = formatBytes;
  constructor(private readonly router: Router) { void this.state.initialize(); }

  open(id: string): void {
    void this.state.openDataset(id).then(() => {
      const workspace = this.state.workspace();
      if (workspace) void this.router.navigate(['/workspace', workspace.id, 'overview']);
    }).catch(() => undefined);
  }
  rename(dataset: Dataset): void {
    const name = window.prompt('New dataset name', dataset.name);
    if (name === null) return;
    void this.state.renameDataset(dataset, name).catch((error: unknown) => {
      this.state.error.set(error instanceof Error ? error.message : 'Dataset could not be renamed.');
    });
  }
  remove(dataset: Dataset): void {
    if (!window.confirm(`Delete "${dataset.name}" and its saved workspace from this browser? This cannot be undone.`)) return;
    void this.state.deleteDataset(dataset.id).catch(() => undefined);
  }
}

@Component({
  selector: 'app-workspaces-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="library-page">
      <header class="library-header"><a class="brand" routerLink="/"><span class="brand-mark">▥</span>CSV Analytics</a><nav><a routerLink="/">Home</a><a routerLink="/datasets">Datasets</a><a routerLink="/workspaces" class="selected">Workspaces</a><a routerLink="/settings">Settings</a></nav></header>
      <section class="library-content">
        <div class="page-title"><div><span class="eyebrow">SAVED ANALYSIS</span><h1>Workspaces</h1><p>Return to a dataset and continue where you left off.</p></div><a class="button secondary" routerLink="/datasets">Browse datasets</a></div>
        @if (state.workspaces().length) {
          <div class="dataset-list panel">
            @for (workspace of state.workspaces(); track workspace.id) {
              @let dataset = datasetFor(workspace);
              @if (dataset) {
                <article class="dataset-row"><span class="workspace-icon">▧</span><div class="dataset-copy"><strong>{{ workspace.name }}</strong><small>{{ dataset.name }} · {{ workspace.visualizations.length }} charts · {{ workspace.calculatedFields.length }} calculated fields</small><small>Last updated {{ workspace.updatedAt | date:'medium' }}</small></div><div class="dataset-actions"><button type="button" class="button secondary" (click)="open(workspace)">Open workspace</button><button type="button" class="icon-button danger" aria-label="Delete workspace" (click)="remove(workspace)">×</button></div></article>
              }
            }
          </div>
        } @else { <div class="empty-state panel"><span>▧</span><h2>No saved workspaces</h2><p>Import a dataset and your workspace will be saved here automatically.</p><a class="button primary" routerLink="/">Import a CSV</a></div> }
      </section>
    </main>
  `,
  styles: [`
    .library-page{min-height:100vh;background:#f8faff;color:#17213f}.library-header{height:61px;padding:0 clamp(16px,5vw,70px);display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf5}.brand{display:flex;gap:9px;align-items:center;text-decoration:none;color:#18244c;font-size:14px;font-weight:700}.brand-mark{width:26px;height:26px;display:grid;place-items:center;border-radius:6px;background:#3746a4;color:white;font-size:16px}.library-header nav{display:flex;gap:19px}.library-header nav a{font-size:11px;color:#77839a;text-decoration:none}.library-header nav a.selected{color:#4d5bd4;font-weight:600}
    .library-content{max-width:1040px;margin:0 auto;padding:38px 20px}.page-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.eyebrow{font-size:9px;letter-spacing:1px;font-weight:700;color:#7784a0}.page-title h1{font-size:25px;margin:6px 0 4px;letter-spacing:-.4px}.page-title p{font-size:11px;color:#8792a6;margin:0}.button{display:inline-flex;align-items:center;gap:6px;text-decoration:none;border:1px solid #e0e5ef;border-radius:7px;padding:9px 12px;color:#52607a;background:white;font-size:10px;font-weight:600;cursor:pointer}.primary{background:#5562dc;border-color:#5562dc;color:white}.panel{background:#fff;border:1px solid #e4e9f2;border-radius:10px}.dataset-list{overflow:hidden}.dataset-row{min-height:82px;padding:14px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #edf0f5}.dataset-row:last-child{border-bottom:0}.workspace-icon{width:37px;height:39px;display:grid;place-items:center;flex:0 0 37px;border-radius:7px;background:#eff1ff;color:#5966d9;font-size:17px}.dataset-copy{display:grid;gap:4px;min-width:0;flex:1}.dataset-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#263451}.dataset-copy small{color:#8b96a9;font-size:9px}.dataset-actions{display:flex;align-items:center;gap:7px}.icon-button{width:30px;height:30px;display:grid;place-items:center;border:1px solid #e2e7ef;background:#fff;color:#6b7891;border-radius:6px;cursor:pointer}.danger:hover{color:#b94b42;border-color:#f0d1ce}.empty-state{min-height:300px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}.empty-state>span{font-size:30px;color:#6470db}.empty-state h2{font-size:15px;margin:12px 0 4px}.empty-state p{font-size:11px;color:#8792a6;margin:0 0 14px}
    @media(max-width:600px){.library-header{padding:0 14px}.library-header nav{gap:10px}.library-header nav a{font-size:9px}.library-content{padding:25px 12px}.page-title{align-items:flex-start}.dataset-row{padding:12px 9px;gap:8px}.dataset-actions .button{font-size:0;padding:8px}.icon-button{width:27px;height:27px}}
  `],
})
export class WorkspacesPageComponent {
  readonly state = inject(WorkspaceService);
  constructor(private readonly router: Router) { void this.state.initialize(); }
  datasetFor(workspace: Workspace): Dataset | undefined { return this.state.datasets().find((dataset) => dataset.id === workspace.datasetId); }
  open(workspace: Workspace): void {
    void this.state.openWorkspace(workspace.id).then(() => this.router.navigate(['/workspace', workspace.id, 'overview'])).catch(() => undefined);
  }
  remove(workspace: Workspace): void {
    if (!window.confirm(`Delete the saved workspace "${workspace.name}"? The dataset itself will remain.`)) return;
    void this.state.deleteWorkspace(workspace.id).catch(() => undefined);
  }
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="library-page">
      <header class="library-header"><a class="brand" routerLink="/"><span class="brand-mark">▥</span>CSV Analytics</a><nav><a routerLink="/">Home</a><a routerLink="/datasets">Datasets</a><a routerLink="/workspaces">Workspaces</a><a routerLink="/settings" class="selected">Settings</a></nav></header>
      <section class="library-content">
        <div class="page-title"><div><span class="eyebrow">PREFERENCES</span><h1>Settings</h1><p>Customize your local CSV Analytics experience.</p></div></div>
        <div class="settings-grid">
          <article class="settings-card panel"><div class="settings-icon">◐</div><div class="settings-copy"><h2>Appearance</h2><p>Choose how the application looks on this device.</p></div><label class="setting-control">Theme<select [(ngModel)]="theme" (ngModelChange)="saveTheme()"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></article>
          <article class="settings-card panel"><div class="settings-icon accent-icon">◉</div><div class="settings-copy"><h2>Accent color</h2><p>Choose the primary color used for buttons, navigation, and highlights throughout the app.</p></div><label class="setting-control accent-control">Color<input type="color" aria-label="Accent color" [(ngModel)]="accentColor" (ngModelChange)="saveAccentColor()" /></label></article>
          <article class="settings-card panel"><div class="settings-icon">▤</div><div class="settings-copy"><h2>Data preferences</h2><p>Set a default page size for the Data Explorer.</p></div><label class="setting-control">Rows per page<select [(ngModel)]="rowsPerPage" (ngModelChange)="saveRowsPerPage()"><option [ngValue]="10">10 rows</option><option [ngValue]="25">25 rows</option><option [ngValue]="50">50 rows</option><option [ngValue]="100">100 rows</option></select></label></article>
          <article class="settings-card panel"><div class="settings-icon privacy">▣</div><div class="settings-copy"><h2>Privacy</h2><p>CSV files are parsed and analyzed in this browser. The app does not upload data to a server or require an account.</p><a href="#privacy-details" (click)="privacyExpanded=!privacyExpanded">Learn more <span>→</span></a>@if (privacyExpanded) { <div id="privacy-details" class="privacy-detail">Datasets and workspaces are stored locally in this browser profile using IndexedDB. Other people who use this browser profile may be able to access that data. Clearing browser site data also deletes saved datasets.</div> }</div></article>
          <article class="settings-card panel storage-card"><div class="settings-icon storage">▱</div><div class="settings-copy"><h2>Local storage</h2><p>Your datasets and workspaces are saved in this browser only.</p>@if (storageEstimate !== null) { <small>Approx. {{ storageEstimate | number:'1.0-1' }} MB used by this browser origin</small> } @else { <small>Storage usage is not available in this browser.</small> }</div><button class="button danger-button" type="button" [disabled]="!state.datasets().length" (click)="clearData()">Delete all local data</button></article>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .library-page{min-height:100vh;background:#f8faff;color:#17213f}.library-header{height:61px;padding:0 clamp(16px,5vw,70px);display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e8edf5}.brand{display:flex;gap:9px;align-items:center;text-decoration:none;color:#18244c;font-size:14px;font-weight:700}.brand-mark{width:26px;height:26px;display:grid;place-items:center;border-radius:6px;background:#3746a4;color:white;font-size:16px}.library-header nav{display:flex;gap:19px}.library-header nav a{font-size:11px;color:#77839a;text-decoration:none}.library-header nav a.selected{color:#4d5bd4;font-weight:600}
    .library-content{max-width:940px;margin:0 auto;padding:38px 20px}.page-title{margin-bottom:18px}.eyebrow{font-size:9px;letter-spacing:1px;font-weight:700;color:#7784a0}.page-title h1{font-size:25px;margin:6px 0 4px;letter-spacing:-.4px}.page-title p{font-size:11px;color:#8792a6;margin:0}.settings-grid{display:grid;gap:11px}.panel{background:#fff;border:1px solid #e4e9f2;border-radius:10px}.settings-card{min-height:90px;padding:16px;display:grid;grid-template-columns:37px minmax(0,1fr) 180px;align-items:center;gap:12px}.settings-icon{width:34px;height:34px;border-radius:8px;display:grid;place-items:center;background:#eff1ff;color:#5665d9}.settings-icon.privacy{background:#e8f7f1;color:#179475}.settings-icon.storage{background:#fff3e1;color:#d69320}.settings-copy h2{margin:0 0 5px;font-size:12px;color:#253250}.settings-copy p{margin:0;font-size:10px;color:#8190a7;line-height:1.55}.settings-copy a{display:inline-block;margin-top:8px;color:#5361d4;text-decoration:none;font-size:9px}.settings-copy small{display:block;color:#9aa3b3;font-size:9px;margin-top:7px}.setting-control{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#77849b;font-size:9px}.setting-control select{max-width:125px;height:31px;padding:0 7px;border:1px solid #e3e7f0;border-radius:6px;background:#fff;color:#52607a;font-size:9px}.setting-control input[type=color]{width:42px;height:31px;padding:2px;border:1px solid #e3e7f0;border-radius:6px;background:#fff;cursor:pointer}.privacy-detail{padding:9px;margin-top:8px;background:#f7f9fd;border-radius:6px;color:#72809a;font-size:9px;line-height:1.5}.button{justify-self:end;border:1px solid #e0e5ef;border-radius:6px;padding:8px 10px;background:white;color:#58657d;font-size:9px;cursor:pointer}.danger-button{color:#b24b42;border-color:#f0d4d0}.danger-button:disabled{opacity:.5;cursor:default}
    @media(max-width:650px){.library-header{padding:0 14px}.library-header nav{gap:10px}.library-header nav a{font-size:9px}.library-content{padding:25px 12px}.settings-card{grid-template-columns:33px 1fr}.settings-copy{min-width:0}.setting-control,.settings-card>.button{grid-column:2;justify-self:start}.settings-card>.button{margin-top:5px}}
  `],
})
export class SettingsPageComponent {
  readonly state = inject(WorkspaceService);
  theme: 'system' | 'light' | 'dark' = 'system';
  accentColor = DEFAULT_ACCENT_COLOR;
  rowsPerPage = 25;
  storageEstimate: number | null = null;
  privacyExpanded = false;

  constructor() {
    void this.state.initialize();
    this.loadPreferences();
    void this.readStorageUsage();
  }

  saveTheme(): void {
    this.applyTheme();
    try { localStorage.setItem('csv-analytics-theme', this.theme); }
    catch { this.state.error.set('Theme preference could not be saved in this browser.'); }
  }

  saveAccentColor(): void {
    applyAccentColor(this.accentColor);
    try { localStorage.setItem('csv-analytics-accent-color', this.accentColor); }
    catch { this.state.error.set('Accent color preference could not be saved in this browser.'); }
  }

  saveRowsPerPage(): void {
    try { localStorage.setItem('csv-analytics-rows-per-page', String(this.rowsPerPage)); }
    catch { this.state.error.set('Rows-per-page preference could not be saved in this browser.'); }
  }

  clearData(): void {
    if (!window.confirm('Delete every locally stored dataset and workspace? This cannot be undone.')) return;
    void this.state.clearLocalData().then(() => this.readStorageUsage()).catch(() => undefined);
  }

  private loadPreferences(): void {
    try {
      const savedTheme = localStorage.getItem('csv-analytics-theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') this.theme = savedTheme;
      const savedAccentColor = localStorage.getItem('csv-analytics-accent-color');
      if (isAccentColor(savedAccentColor)) this.accentColor = savedAccentColor;
      applyAccentColor(this.accentColor);
      this.rowsPerPage = Number(localStorage.getItem('csv-analytics-rows-per-page')) || 25;
      this.applyTheme();
    } catch {
      this.state.error.set('Saved preferences are unavailable in this browser.');
    }
  }

  private async readStorageUsage(): Promise<void> {
    if (!navigator.storage?.estimate) return;
    try {
      const estimate = await navigator.storage.estimate();
      this.storageEstimate = (estimate.usage ?? 0) / (1024 * 1024);
    } catch {
      this.state.error.set('Storage usage could not be read from this browser.');
    }
  }

  private applyTheme(): void {
    const systemDark = this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', this.theme === 'dark' || systemDark);
  }
}
