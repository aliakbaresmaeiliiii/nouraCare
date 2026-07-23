import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';

import { routes } from '@app/app.routes';
import { AuthInterceptor } from '@app/core/auth/interceptor/auth-interceptor';
import { JwtInterceptor } from '@app/core/auth/interceptor/jwt.interceptor';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';

function pwaServiceWorkerEnabled(): boolean {
  if (isDevMode()) {
    return false;
  }
  try {
    if (Capacitor.isNativePlatform()) {
      return false;
    }
  } catch {
    /* non-browser */
  }
  return true;
}

function initialIonicMode(): 'ios' | 'md' {
  try {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform() === 'ios' ? 'ios' : 'md';
    }
  } catch {
    /* non-browser */
  }
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1);
    return isIos ? 'ios' : 'md';
  }
  return 'md';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: initialIonicMode(),
      animated: true,
      rippleEffect: true,
      swipeBackEnabled: true,
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    ModalController,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    LanguageService,
    TranslationService,
    provideServiceWorker('ngsw-worker.js', {
      enabled: pwaServiceWorkerEnabled(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
