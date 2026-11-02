import { AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import { Dataset, Visualization } from '../core/models';
import { aggregate } from '../core/analytics';

const CATEGORY_COLORS = ['#21b39b', '#f7a932', '#fa655f', '#26a9c8', '#95a5b6'];

@Component({
  selector: 'app-chart-view',
  standalone: true,
  template: `
    @if (visualization.type === 'kpi') {
      <div class="kpi-visual" role="img" [attr.aria-label]="visualization.title + ': ' + kpiValue">
        <span>{{ visualization.aggregate }}</span><strong>{{ kpiValue }}</strong><small>{{ visualization.measure }}</small>
      </div>
    } @else {
      <canvas #chartCanvas role="img" [attr.aria-label]="visualization.title"></canvas>
    }
  `,
  styles: [':host{display:block;width:100%;height:100%;min-height:180px}canvas{width:100%!important;height:100%!important}.kpi-visual{height:100%;min-height:180px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:8px;color:#7a879d}.kpi-visual span{font-size:10px;text-transform:capitalize}.kpi-visual strong{font-size:clamp(28px,5vw,48px);line-height:1;color:#18244c;letter-spacing:-1.5px}.kpi-visual small{font-size:11px}'],
})
export class ChartViewComponent implements AfterViewInit, AfterViewChecked, OnChanges, OnDestroy {
  @Input({ required: true }) dataset!: Dataset;
  @Input({ required: true }) visualization!: Visualization;
  @Input() rows?: Record<string, string>[];
  @ViewChild('chartCanvas') private canvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngAfterViewChecked(): void {
    if (this.visualization?.type !== 'kpi' && this.canvas && !this.chart) this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataset'] || changes['visualization'] || changes['rows']) {
      if (this.visualization?.type === 'kpi') {
        this.chart?.destroy();
        this.chart = undefined;
      } else {
        this.render();
      }
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  get kpiValue(): string {
    const rows = this.rows ?? this.dataset?.rows ?? [];
    return aggregate(rows.map((row) => row[this.visualization.measure] ?? ''), this.visualization.aggregate)
      .toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  downloadPng(): void {
    const source = this.canvas?.nativeElement;
    let output = source;
    if (!source && this.visualization.type === 'kpi') {
      output = document.createElement('canvas');
      output.width = 900;
      output.height = 500;
      const context = output.getContext('2d');
      if (!context) throw new Error('The chart image could not be prepared by this browser.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, output.width, output.height);
      context.fillStyle = this.accentColor;
      context.font = '600 28px Inter, sans-serif';
      context.fillText(this.visualization.title, 48, 65);
      context.font = '700 82px Inter, sans-serif';
      context.fillText(this.kpiValue, 48, 280);
      context.fillStyle = '#74819a';
      context.font = '22px Inter, sans-serif';
      context.fillText(`${this.visualization.aggregate} · ${this.visualization.measure}`, 48, 335);
    }
    if (!output) return;
    const link = document.createElement('a');
    link.download = `${this.visualization.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = output.toDataURL('image/png');
    link.click();
  }

  private render(): void {
    if (this.visualization?.type === 'kpi') {
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }
    if (!this.canvas || !this.dataset || !this.visualization) return;
    this.chart?.destroy();
    const rows = this.rows ?? this.dataset.rows;
    const { type, dimension, measure, aggregate: operation } = this.visualization;
    const colors = [this.accentColor, ...CATEGORY_COLORS];
    const labels: string[] = [];
    const values: number[] = [];
    const grouped = new Map<string, string[]>();

    if (type === 'histogram') {
      const numeric = rows.map((row) => Number((row[measure] ?? '').replace(/,/g, ''))).filter(Number.isFinite);
      if (numeric.length) {
        const minimum = Math.min(...numeric);
        const maximum = Math.max(...numeric);
        const bins = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(numeric.length))));
        const width = (maximum - minimum) / bins || 1;
        const counts = Array.from({ length: bins }, () => 0);
        numeric.forEach((value) => counts[Math.min(bins - 1, Math.floor((value - minimum) / width))]++);
        counts.forEach((count, index) => {
          labels.push(`${(minimum + index * width).toLocaleString()}–${(minimum + (index + 1) * width).toLocaleString()}`);
          values.push(count);
        });
      }
    } else if (type === 'scatter') {
      const points = rows
        .map((row) => ({ x: Number((row[dimension] ?? '').replace(/,/g, '')), y: Number((row[measure] ?? '').replace(/,/g, '')) }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
      labels.push(...points.map((_, index) => `${index + 1}`));
      values.push(...points.map((point) => point.y));
      this.chart = new Chart(this.canvas.nativeElement, {
        type: 'scatter',
        data: { datasets: [{ label: `${dimension} / ${measure}`, data: points, backgroundColor: colors[0] }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { title: { display: true, text: dimension } }, y: { title: { display: true, text: measure } } },
        },
      });
      return;
    } else {
      for (const row of rows) {
        const label = row[dimension] || '(empty)';
        const valuesForLabel = grouped.get(label);
        if (valuesForLabel) valuesForLabel.push(row[measure] ?? '');
        else grouped.set(label, [row[measure] ?? '']);
      }
      const entries = [...grouped.entries()]
        .map(([label, items]) => ({ label, value: aggregate(items, operation) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);
      labels.push(...entries.map((entry) => entry.label));
      values.push(...entries.map((entry) => entry.value));
    }

    const chartType: 'bar' | 'line' | 'pie' | 'doughnut' =
      type === 'area' ? 'line'
        : type === 'histogram' ? 'bar'
          : type === 'doughnut' ? 'doughnut'
            : type;
    const pie = chartType === 'pie' || chartType === 'doughnut';
    this.chart = new Chart(this.canvas.nativeElement, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: measure,
          data: values,
          backgroundColor: pie ? labels.map((_, index) => colors[index % colors.length]) : colors[0],
          borderColor: colors[0],
          borderWidth: type === 'line' || type === 'area' ? 2 : 0,
          fill: type === 'area',
          tension: 0.35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: pie, position: 'bottom' },
          tooltip: { enabled: true },
        },
        scales: pie ? {} : { y: { beginAtZero: true, grid: { color: '#edf1f8' } }, x: { grid: { display: false } } },
      },
    });
  }

  private get accentColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || '#5965db';
  }
}
