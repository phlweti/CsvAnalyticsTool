import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WorkspaceService } from '../core/workspace.service';
import { formatBytes } from '../shared/format';

const TABS = [
  { label: 'Overview', path: 'overview' },
  { label: 'Data', path: 'data' },
  { label: 'Analytics', path: 'analytics' },
  { label: 'Visualize', path: 'visualize' },
  { label: 'Dashboard', path: 'dashboard' },
];

@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (state.activeDataset(); as dataset) {
      <div class="shell" [class.mobile-open]="sidebarOpen">
        <aside class="sidebar">
          <a class="brand" routerLink="/"><span class="brand-mark">▥</span><span>CSV Analytics</span></a>
          <div class="sidebar-scroll">
            <div class="nav-group">
              <span class="nav-label">Workspace</span>
              <a class="nav-item" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><span class="nav-icon">⌂</span>Home</a>
              @for (tab of tabs; track tab.path) {
                <a class="nav-item" [routerLink]="['/workspace', state.workspace()?.id, tab.path]" routerLinkActive="active"><span class="nav-icon">{{ iconFor(tab.path) }}</span>{{ tab.label }}</a>
              }
            </div>
            <div class="nav-group">
              <span class="nav-label">Tools</span>
              <a class="nav-item" [routerLink]="['/workspace', state.workspace()?.id, 'quality']" routerLinkActive="active"><span class="nav-icon">◈</span>Data Quality</a>
              <a class="nav-item" [routerLink]="['/workspace', state.workspace()?.id, 'calculated-fields']" routerLinkActive="active"><span class="nav-icon">ƒx</span>Calculated Fields</a>
            </div>
            <div class="nav-group">
              <span class="nav-label">Library</span>
              <a class="nav-item" routerLink="/datasets" routerLinkActive="active"><span class="nav-icon">▤</span>Datasets</a>
              <a class="nav-item" routerLink="/workspaces" routerLinkActive="active"><span class="nav-icon">▧</span>Saved workspaces</a>
            </div>
          </div>
          <div class="sidebar-bottom">
            <a class="nav-item" routerLink="/settings" routerLinkActive="active"><span class="nav-icon">⚙</span>Settings</a>
            <div class="local-note"><span class="lock">▣</span><span><strong>Your data stays here</strong><small>No upload. No account. No server.</small></span></div>
          </div>
        </aside>

        <section class="app-main">
          <header class="topbar">
            <button type="button" class="mobile-menu" aria-label="Toggle navigation" (click)="sidebarOpen=!sidebarOpen">☰</button>
            <div class="global-search"><span>⌕</span><input aria-label="Search data, columns, or insights" placeholder="Search data, columns, or insights…" (keydown.enter)="search(state.workspace()?.id ?? '', $event)" /><kbd>⌘ K</kbd></div>
            <div class="topbar-actions"><button type="button" class="icon-button" aria-label="Toggle theme" (click)="toggleTheme()">◐</button></div>
          </header>

          <main class="workspace-main">
            <div class="dataset-heading">
              <div class="file-icon large">CSV</div>
              <div class="dataset-heading-copy"><h1>{{ dataset.name }}</h1><p>{{ dataset.rowCount | number }} rows <span>·</span> {{ dataset.columnCount }} columns <span>·</span> {{ formatBytes(dataset.fileSize) }}</p></div>
              <div class="dataset-heading-actions">
                <button type="button" class="button secondary" (click)="exportData(dataset.rows, dataset.fileName)">⇩ <span>Export</span></button>
                <a class="icon-button settings-link" routerLink="/settings" aria-label="Settings">⚙</a>
              </div>
            </div>
            <nav class="tabs" aria-label="Dataset sections">
              @for (tab of tabs; track tab.path) {
                <a [routerLink]="['/workspace', state.workspace()?.id, tab.path]" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">{{ tab.label }}</a>
              }
            </nav>
            <router-outlet />
          </main>
        </section>
      </div>
    } @else if (state.error()) {
      <main class="route-error"><div class="error-mark">!</div><h1>Workspace unavailable</h1><p>{{ state.error() }}</p><a class="button primary" routerLink="/datasets">Open dataset library</a></main>
    } @else {
      <main class="route-loading"><span class="spinner"></span><p>Restoring your local workspace…</p></main>
    }
  `,
  styles: [`
    .shell{min-height:100vh;display:flex;background:#f8faff;color:#18213d;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .sidebar{width:232px;flex:0 0 232px;display:flex;flex-direction:column;background:#fff;border-right:1px solid #e8edf5;min-height:100vh}
    .brand{height:61px;padding:0 20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #edf0f5;font-weight:700;font-size:15px;color:#192550;text-decoration:none}
    .brand-mark{display:grid;place-items:center;width:27px;height:27px;background:#3746a4;color:white;border-radius:7px;font-size:17px}
    .sidebar-scroll{padding:18px 11px;flex:1}
    .nav-group{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eef1f6}
    .nav-label{display:block;padding:0 10px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.7px;font-weight:700;color:#9aa4b6}
    .nav-item{height:35px;padding:0 10px;display:flex;align-items:center;gap:11px;border-radius:7px;color:#52617d;text-decoration:none;font-size:12px;margin:2px 0}
    .nav-item:hover{background:#f5f6fb;color:#263675}.nav-item.active{background:#eef0ff;color:#414ed0;font-weight:600}
    .nav-icon{width:17px;text-align:center;color:#73809c;font-size:15px}.nav-item.active .nav-icon{color:#4b59d2}
    .sidebar-bottom{padding:10px 11px 16px}.local-note{display:flex;gap:9px;margin:13px 3px 0;padding:12px 10px;border-radius:8px;background:#f2f6ff;color:#1c3e8b}.lock{font-size:16px}
    .local-note span:last-child{display:flex;flex-direction:column;gap:4px}.local-note strong{font-size:10px}.local-note small{font-size:9px;color:#6b7c9f}
    .app-main{min-width:0;flex:1}.topbar{height:61px;padding:0 24px;display:flex;align-items:center;border-bottom:1px solid #e8edf5;background:#fff;gap:14px}
    .global-search{display:flex;align-items:center;gap:8px;width:min(560px,70%);height:34px;padding:0 10px;border:1px solid #e1e6f0;border-radius:7px;color:#8591a8}.global-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:11px;color:#2d3853}.global-search kbd{font:10px inherit;color:#8c96a7}
    .topbar-actions{margin-left:auto;display:flex;align-items:center;gap:18px}.icon-button{width:34px;height:34px;display:grid;place-items:center;background:white;border:1px solid #e2e7f0;border-radius:8px;color:#4b5975;text-decoration:none;cursor:pointer}
    .mobile-menu{display:none;border:0;background:transparent;font-size:18px;color:#455474}
    .workspace-main{max-width:1700px;margin:0 auto;padding:24px 24px 50px}
    .dataset-heading{display:flex;align-items:center;gap:13px;margin:0 0 21px}
    .file-icon{width:38px;height:42px;border-radius:7px 7px 7px 2px;background:#e8f7f1;color:#14896b;display:grid;place-items:center;font-size:10px;font-weight:800;position:relative}
    .file-icon:before{content:"";position:absolute;right:0;top:0;width:10px;height:10px;border-radius:0 6px 0 4px;background:#bde7d8}
    .file-icon.large{width:40px;height:46px}.dataset-heading-copy h1{font-size:18px;letter-spacing:-.3px;margin:0 0 4px;color:#121d41}.dataset-heading-copy p{margin:0;color:#74819b;font-size:11px}.dataset-heading-copy p span{margin:0 4px;color:#bec6d4}
    .dataset-heading-actions{margin-left:auto;display:flex;gap:9px}.button{display:inline-flex;align-items:center;gap:7px;border-radius:7px;padding:8px 13px;font-size:11px;font-weight:600;text-decoration:none;cursor:pointer}
    .secondary{background:white;border:1px solid #e0e5ef;color:#394967}.primary{background:#5260dc;border:1px solid #5260dc;color:white}
    .tabs{display:flex;align-items:center;gap:4px;border-bottom:1px solid #e4e9f2;margin-bottom:20px;overflow-x:auto}
    .tabs a{padding:10px 13px;margin-bottom:-1px;border-bottom:2px solid transparent;color:#697792;text-decoration:none;font-size:11px;white-space:nowrap}
    .tabs a:hover{color:#4655d1}.tabs a.active{color:#4555d3;border-bottom-color:#5663df;font-weight:600}
    .route-error,.route-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px;color:#5e6b84}.route-error h1{color:#172044;font-size:24px}.route-error p{max-width:420px;line-height:1.6;font-size:13px}.error-mark{width:42px;height:42px;background:#fff0ee;border-radius:50%;display:grid;place-items:center;color:#c04d41;font-weight:700;font-size:20px}
    .spinner{width:27px;height:27px;border:3px solid #e7eaf4;border-top-color:#5865dd;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:900px){.sidebar{width:66px;flex-basis:66px}.brand{justify-content:center;padding:0}.brand>span:last-child,.nav-label{display:none}.nav-item{justify-content:center;padding:0;font-size:0}.nav-icon{font-size:16px}.local-note{justify-content:center;padding:9px 5px}.local-note span:last-child{display:none}}
    @media(max-width:650px){.sidebar{display:none}.shell.mobile-open .sidebar{display:flex;position:fixed;z-index:20;top:0;bottom:0;left:0;width:232px;box-shadow:12px 0 35px #192b4d25}.shell.mobile-open .brand{justify-content:flex-start;padding:0 20px}.shell.mobile-open .brand>span:last-child,.shell.mobile-open .nav-label{display:block}.shell.mobile-open .nav-item{justify-content:flex-start;padding:0 10px;font-size:12px}.shell.mobile-open .local-note span:last-child{display:flex}.mobile-menu{display:block}.topbar{padding:0 13px}.workspace-main{padding:16px 13px 36px}.dataset-heading{gap:9px}.dataset-heading-actions .button span{display:none}.dataset-heading-actions .button{padding:8px 10px}.settings-link{display:none}.tabs a{padding:10px 9px}.global-search{width:min(440px,75%)}.global-search kbd{display:none}}
  `],
})
export class WorkspaceLayoutComponent {
  readonly state = inject(WorkspaceService);
  readonly tabs = TABS;
  readonly formatBytes = formatBytes;
  sidebarOpen = false;

  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && this.state.workspace()?.id !== id) {
        void this.state.openWorkspace(id).catch(() => undefined);
      }
    });
  }

  iconFor(path: string): string {
    return ({ overview: '⌂', data: '▤', analytics: '▥', visualize: '◔', dashboard: '▧' })[path] ?? '•';
  }

  search(datasetId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    if (query) void this.router.navigate(['/workspace', datasetId, 'data'], { queryParams: { search: query } });
  }

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('.global-search input')?.focus();
    }
  }

  toggleTheme(): void {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('csv-analytics-theme', dark ? 'dark' : 'light'); }
    catch { this.state.error.set('Theme preference could not be saved in this browser.'); }
  }

  exportData(rows: Record<string, string>[], filename: string): void {
    const data = rows.map((row) => Object.values(row));
    const headers = this.state.activeDataset()?.columns.map((column) => column.name) ?? [];
    const quote = (value: string): string => `"${value.replace(/"/g, '""')}"`;
    const safeQuote = (value: string): string => {
      const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;
      return quote(safe);
    };
    const csv = [headers, ...data].map((line) => line.map((value) => safeQuote(String(value ?? ''))).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }
}
