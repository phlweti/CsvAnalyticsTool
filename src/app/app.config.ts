import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ANALYTICS_REPOSITORY, IndexedDbAnalyticsRepository } from './core/analytics.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: ANALYTICS_REPOSITORY, useClass: IndexedDbAnalyticsRepository },
  ]
};
