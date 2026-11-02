import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home.page';
import { WorkspaceLayoutComponent } from './layout/workspace-layout';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  {
    path: 'workspace/:id',
    component: WorkspaceLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', loadComponent: () => import('./features/workspace-pages').then((module) => module.OverviewPageComponent) },
      { path: 'data', loadComponent: () => import('./features/workspace-pages').then((module) => module.DataExplorerPageComponent) },
      { path: 'analytics', loadComponent: () => import('./features/workspace-pages').then((module) => module.AnalyticsPageComponent) },
      { path: 'quality', loadComponent: () => import('./features/workspace-pages').then((module) => module.QualityPageComponent) },
      { path: 'visualize', loadComponent: () => import('./features/workspace-pages').then((module) => module.VisualizePageComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/workspace-pages').then((module) => module.DashboardPageComponent) },
      { path: 'calculated-fields', loadComponent: () => import('./features/workspace-pages').then((module) => module.CalculatedFieldsPageComponent) },
      { path: '**', redirectTo: 'overview' },
    ],
  },
  { path: 'datasets', loadComponent: () => import('./features/library-pages').then((module) => module.DatasetsPageComponent) },
  { path: 'workspaces', loadComponent: () => import('./features/library-pages').then((module) => module.WorkspacesPageComponent) },
  { path: 'settings', loadComponent: () => import('./features/library-pages').then((module) => module.SettingsPageComponent) },
  { path: '**', redirectTo: '' },
];
