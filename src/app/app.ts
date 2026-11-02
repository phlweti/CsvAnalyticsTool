import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkspaceService } from './core/workspace.service';
import { applyAccentColor, isAccentColor } from './shared/accent-color';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly state = inject(WorkspaceService);

  constructor() {
    void this.state.initialize();
    try {
      const accentColor = localStorage.getItem('csv-analytics-accent-color');
      if (isAccentColor(accentColor)) applyAccentColor(accentColor);
    } catch {
      this.state.error.set('Saved accent color could not be loaded in this browser.');
    }
  }
}
