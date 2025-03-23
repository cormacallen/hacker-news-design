import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

// For better performance in production
import { provideZoneChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes, // Enable smooth transitions between routes
    ),
    provideHttpClient(),
    // Enable zone.js optimizations
    provideZoneChangeDetection({
      eventCoalescing: true, // Coalesce multiple change detection passes
      runCoalescing: true, // Coalesce multiple change detection runs
    }),
  ],
};
