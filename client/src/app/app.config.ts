import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withDebugTracing,
  withRouterConfig,
} from '@angular/router';

import {
  authInterceptor,
  provideAuth,
  StsConfigHttpLoader,
} from 'angular-auth-oidc-client';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { appRoutes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth-interceptor';
import { environment } from './environments/environments';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      withDebugTracing(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor()]),
      withInterceptorsFromDi()
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
    provideClientHydration(withEventReplay()),
  ],
};
