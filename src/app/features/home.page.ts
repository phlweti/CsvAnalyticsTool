import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ImportOptions } from '../core/models';
import { WorkspaceService } from '../core/workspace.service';
import { formatBytes } from '../shared/format';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="home">
      <header class="home-header">
        <a class="brand" routerLink="/" aria-label="CSV Analytics home">
          <span class="brand-mark">▥</span><span>CSV Analytics</span>
        </a>
        <nav><a routerLink="/datasets">Datasets</a><a routerLink="/settings">Settings</a></nav>
      </header>

      <section class="hero">
        <span class="eyebrow">PRIVATE BY DESIGN · FREE TO EXPLORE</span>
        <h1>Drop a CSV.<br /><span>Understand your data.</span></h1>
        <p>Explore, analyze, and visualize your data — without uploading it anywhere.</p>

        <div class="upload-zone"
          [class.dragging]="dragging"
          [class.importing]="state.importing()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)">
          <input #filePicker type="file" accept=".csv,text/csv" (change)="onFileSelected($event)" hidden />
          <div class="upload-icon" aria-hidden="true">{{ state.importing() ? '◌' : '↑' }}</div>
          <strong>{{ state.importing() ? 'Importing your dataset…' : dragging ? 'Drop your CSV to analyze' : 'Drop your CSV file here' }}</strong>
          <span>{{ state.importing() ? 'Reading and profiling locally' : 'or choose a file from your device' }}</span>
          @if (state.importing()) {
            <div class="progress-track"><div [style.width.%]="state.progress()"></div></div>
            <small>{{ state.progress() }}% · Your file stays on this device</small>
            <button class="cancel-import" type="button" (click)="state.cancelImport()">Cancel import</button>
          } @else {
            <button class="button primary" type="button" (click)="filePicker.click()">Browse files</button>
            <small>CSV files up to 100 MB</small>
          }
        </div>

        <p class="privacy-note"><span aria-hidden="true">▣</span> Your data stays in your browser. No upload. No account. No server.</p>

        @if (state.error()) {
          <div class="alert error" role="alert">{{ state.error() }}</div>
        }

        <div class="import-options">
          <label>Delimiter
            <select [(ngModel)]="options.delimiter" [disabled]="state.importing()">
              <option value="auto">Auto-detect</option><option value=",">Comma</option>
              <option value=";">Semicolon</option><option value="&#9;">Tab</option><option value="|">Pipe</option>
            </select>
          </label>
          <label class="check"><input type="checkbox" [(ngModel)]="options.firstRowHeaders" [disabled]="state.importing()" /> First row contains headers</label>
          <label class="check"><input type="checkbox" [(ngModel)]="options.trimWhitespace" [disabled]="state.importing()" /> Trim whitespace</label>
        </div>

        <button class="sample-link" type="button" [disabled]="state.importing()" (click)="loadSample()">Explore a sample dataset <span>→</span></button>
      </section>

      @if (state.datasets().length) {
        <section class="recent-section">
          <div class="section-heading"><div><h2>Recent datasets</h2><p>Pick up where you left off.</p></div><a routerLink="/datasets">View all <span>→</span></a></div>
          <div class="recent-grid">
            @for (dataset of state.datasets().slice(0, 3); track dataset.id) {
              <button class="dataset-card" type="button" (click)="openDataset(dataset.id)">
                <span class="file-icon">CSV</span>
                <span class="dataset-card-copy"><strong>{{ dataset.name }}</strong><small>{{ dataset.rowCount | number }} rows · {{ dataset.columnCount }} columns</small></span>
                <span class="dataset-size">{{ formatBytes(dataset.fileSize) }}</span>
              </button>
            }
          </div>
        </section>
      }
    </main>
  `,
  styles: [`
    .home{min-height:100vh;background:#f8faff;color:#172033}
    .home-header{height:68px;padding:0 clamp(20px,5vw,76px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8edf5;background:#fff}
    .brand{display:flex;align-items:center;gap:10px;font-weight:700;color:#17244c;text-decoration:none;font-size:17px}
    .brand-mark{display:grid;place-items:center;width:30px;height:30px;background:#3542a4;color:white;border-radius:8px;font-size:20px}
    nav{display:flex;gap:25px}nav a{font-size:13px;color:#62708a;text-decoration:none}
    .hero{max-width:760px;margin:0 auto;padding:68px 22px 40px;text-align:center}
    .eyebrow{font-size:10px;font-weight:700;letter-spacing:1.55px;color:#5464cc}
    h1{font-size:clamp(38px,6vw,58px);letter-spacing:-2.5px;line-height:1.08;margin:19px 0 15px;color:#101a3c}
    h1 span{color:#5965db}.hero>p{font-size:15px;color:#70809c;margin:0 0 28px}
    .upload-zone{min-height:260px;padding:27px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border:1.5px dashed #b6c4df;border-radius:17px;background:#fff;transition:.18s}
    .upload-zone.dragging{border-color:#5867e8;background:#f2f4ff;transform:scale(1.01)}
    .upload-zone.importing{border-style:solid;border-color:#cdd5f6}
    .upload-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#eef0ff;color:#4f5cda;font-size:26px;margin-bottom:3px}
    .upload-zone strong{font-size:16px;color:#192342}.upload-zone>span{font-size:13px;color:#7a879e}
    .button{border:0;border-radius:8px;padding:10px 24px;font-weight:600;cursor:pointer}
    .primary{color:white;background:#4f5de0;margin-top:8px}.primary:hover{background:#414fc9}
    .upload-zone small{font-size:11px;color:#9aa5b7}
    .cancel-import{border:0;background:transparent;color:#a34840;font-size:10px;cursor:pointer}
    .progress-track{height:7px;width:min(380px,80%);background:#e8ebf5;border-radius:8px;overflow:hidden;margin-top:12px}
    .progress-track div{height:100%;background:#5564e8;transition:width .2s}
    .privacy-note{font-size:12px!important;color:#6b7891!important;margin:16px 0 12px!important}
    .privacy-note span{color:#169c7c;margin-right:5px}
    .import-options{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin:15px auto 0;color:#6b7891;font-size:11px}
    .import-options label{display:flex;align-items:center;gap:7px}.import-options select{border:1px solid #dfe5f0;border-radius:6px;padding:5px 8px;color:#33415f;background:#fff;font-size:11px}
    .import-options input{accent-color:#5965db}.sample-link{margin-top:23px;border:0;background:none;color:#5361d4;font-size:12px;font-weight:600;cursor:pointer}.sample-link span{font-size:16px;margin-left:4px}.sample-link:disabled{opacity:.5}
    .alert{max-width:600px;margin:14px auto 0;padding:11px 14px;border-radius:8px;font-size:12px;text-align:left}
    .error{background:#fff1f0;color:#b43c37;border:1px solid #f3d4d1}
    .recent-section{max-width:920px;margin:24px auto 0;padding:0 22px 50px}
    .section-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.section-heading h2{margin:0 0 4px;font-size:16px;color:#192342}.section-heading p{margin:0;color:#8a95a8;font-size:12px}.section-heading>a{font-size:12px;color:#5663d5;text-decoration:none}
    .recent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .dataset-card{min-width:0;display:flex;align-items:center;gap:11px;text-align:left;padding:14px;background:white;border:1px solid #e4e9f2;border-radius:10px;cursor:pointer}
    .dataset-card:hover{border-color:#b8c2f5;box-shadow:0 5px 15px #273c7410}
    .file-icon{flex:0 0 35px;height:39px;border-radius:7px;background:#e8f7f1;color:#138c69;font-size:10px;font-weight:700;display:grid;place-items:center}
    .dataset-card-copy{min-width:0;display:flex;flex-direction:column;gap:5px}.dataset-card-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#1c2948}.dataset-card-copy small,.dataset-size{font-size:10px;color:#8a95a8;white-space:nowrap}.dataset-size{margin-left:auto}
    @media(max-width:650px){.hero{padding-top:48px}.recent-grid{grid-template-columns:1fr}.import-options{gap:12px}.home-header{padding:0 18px}}
  `],
})
export class HomePageComponent {
  @ViewChild('filePicker') private filePicker?: ElementRef<HTMLInputElement>;
  readonly state = inject(WorkspaceService);
  readonly formatBytes = formatBytes;
  readonly options: ImportOptions = { delimiter: 'auto', firstRowHeaders: true, trimWhitespace: true };
  dragging = false;

  constructor(private readonly router: Router) {
    void this.state.initialize();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {
    if (event.currentTarget === event.target) this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files.item(0);
    if (file) void this.importFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) void this.importFile(file);
    input.value = '';
  }

  loadSample(): void {
    void this.state.createSampleDataset()
      .then(() => this.navigateToOverview())
      .catch(() => undefined);
  }

  openDataset(id: string): void {
    void this.state.openDataset(id)
      .then(() => this.navigateToOverview())
      .catch(() => undefined);
  }

  private importFile(file: File): void {
    void this.state.importFile(file, this.options)
      .then(() => this.navigateToOverview())
      .catch(() => undefined);
  }

  private navigateToOverview(): void {
    const workspace = this.state.workspace();
    if (workspace) void this.router.navigate(['/workspace', workspace.id, 'overview']);
  }
}
