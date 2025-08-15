import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  RouteReuseStrategy,
  withComponentInputBinding,
} from '@angular/router';

import { authInterceptor, provideAuth } from 'angular-auth-oidc-client';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { appRoutes } from './app.routes';
import { environment } from './environments/environments';
import { AuthInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(appRoutes, withComponentInputBinding()),
    // provideRouter(
    //   withDebugTracing(),
    //   withRouterConfig({ paramsInheritanceStrategy: 'always' })
    // ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor()]),
      withInterceptorsFromDi()
    ),

    importProvidersFrom(
      IonicModule.forRoot(),
    ),
    provideAuth({
      config: {
        authority: environment.oidc.authority,
        redirectUrl: environment.oidc.redirectUrl,
        postLogoutRedirectUri: environment.oidc.postLogoutRedirectUri,
        clientId: environment.oidc.clientId,
        scope: environment.oidc.scope,
        responseType: environment.oidc.responseType,
        useRefreshToken: environment.oidc.useRefreshToken,
        logLevel: environment.oidc.logLevel,
        silentRenew: environment.oidc.silentRenew,
        ignoreNonceAfterRefresh: environment.oidc.ignoreNonceAfterRefresh,
        tokenRefreshInSeconds: environment.oidc.tokenRefreshInSeconds,
        secureRoutes: [environment.apiEndPoint],
      },
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },

    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // provideClientHydration(withEventReplay()),
  ],
};
