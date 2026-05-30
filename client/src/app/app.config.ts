import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth/interceptor/auth-interceptor';
import { JwtInterceptor } from './auth/interceptor/jwt.interceptor';
import { LanguageService } from './shared/services/language.service';
import { TranslationService } from './shared/services/translation.service';

function initialIonicMode(): 'ios' | 'md' {
  return 'md';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideIonicAngular({ mode: initialIonicMode() }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    LanguageService,
    TranslationService,
  ],
};
