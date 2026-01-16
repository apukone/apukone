import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { HttpEvent, HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { finalize, Observable } from 'rxjs';
import { LoadingService } from './services/loading.service';
import { provideMarkdown } from 'ngx-markdown';
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const token = localStorage.getItem('access_token');
  if(token) {
    const reqWithAuth = req.clone({
      headers: req.headers.set('Authorization', 'Basic ' + token),
    });
    return next(reqWithAuth);
  } else {
    return next(req);
  }
}
export function loadingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const loadingService = inject(LoadingService);
  loadingService.show();
  return next(req).pipe(finalize(() => loadingService.hide()));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideMarkdown(),
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor
      ])
    ),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
    })), 
    provideAnimationsAsync()
  ]
};
