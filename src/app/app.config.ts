import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

// For better performance in production
import { provideZoneChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(), // Enable smooth transitions between routes
    ),
    provideHttpClient(
      withFetch(), // Use fetch API for HTTP requests
    ),
    provideAnimations(), // For animations

    // Enable zone.js optimizations
    provideZoneChangeDetection({
      eventCoalescing: true, // Coalesce multiple change detection passes
      runCoalescing: true, // Coalesce multiple change detection runs
    }),
  ],
};
