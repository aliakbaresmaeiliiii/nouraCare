import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { JwtInterceptor } from './app/auth/interceptor/jwt.interceptor';
import { LanguageService } from './app/shared/services/language.service';
import { TranslationService } from './app/shared/services/translation.service';
import { AuthInterceptor } from './app/auth/interceptor/auth-interceptor';

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

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),

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
  ],
});
