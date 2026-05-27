import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withPreloading, PreloadAllModules } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { JwtInterceptor } from './auth/interceptor/jwt.interceptor';
import { AuthInterceptor } from './auth/interceptor/auth-interceptor';
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
    TranslationService
  ]
};
