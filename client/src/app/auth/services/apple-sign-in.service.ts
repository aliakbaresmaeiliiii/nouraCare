import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { environment } from '../../../environments/environment';
import { SocialLoginInitService } from './social-login-init.service';

export class AppleSignInNotConfiguredError extends Error {
  readonly code = 'APPLE_NOT_CONFIGURED';
  constructor() {
    super(
      'Apple Sign-In is not configured. Set appleBundleId / appleServiceId in environment.',
    );
  }
}

export type AppleSignInResult = {
  email?: string;
  fullName?: string;
  idToken: string;
};

@Injectable({ providedIn: 'root' })
export class AppleSignInService {
  private readonly socialInit = inject(SocialLoginInitService);

  async signInWithApple(): Promise<AppleSignInResult> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      return this.signInWithAppleWeb();
    }

    const clientId =
      platform === 'ios'
        ? environment.appleBundleId?.trim()
        : (environment.appleServiceId || environment.appleBundleId)?.trim();

    if (!clientId) {
      throw new AppleSignInNotConfiguredError();
    }

    await this.socialInit.ensureInitialized();

    const { result } = await SocialLogin.login({
      provider: 'apple',
      options: {
        scopes: ['email', 'name'],
      },
    });

    const idToken = result.idToken?.trim();
    if (!idToken) {
      throw new Error('Apple Sign-In did not return an identity token.');
    }

    const email = result.profile?.email?.trim() || undefined;
    const fromParts = [result.profile?.givenName, result.profile?.familyName]
      .filter((p): p is string => !!p?.trim())
      .join(' ')
      .trim();
    const fullName =
      fromParts || undefined;

    return { email, fullName, idToken };
  }

  /** Web: Apple JS SDK (Sign in with Apple button flow). */
  private signInWithAppleWeb(): Promise<AppleSignInResult> {
    const serviceId = environment.appleServiceId?.trim();
    if (!serviceId) {
      throw new AppleSignInNotConfiguredError();
    }

    return this.loadAppleScript().then(
      () =>
        new Promise((resolve, reject) => {
          const AppleID = (window as any).AppleID;
          if (!AppleID?.auth) {
            reject(new Error('Apple Sign-In SDK failed to load.'));
            return;
          }

          AppleID.auth.init({
              clientId: serviceId,
              scope: 'name email',
              redirectURI: environment.appleRedirectUrl?.trim() ?? '',
              usePopup: true,
            });

          AppleID.auth
            .signIn()
            .then((response: { authorization: { id_token: string } }) => {
              const idToken = response?.authorization?.id_token?.trim();
              if (!idToken) {
                throw new Error('Apple Sign-In did not return an identity token.');
              }
              resolve({ idToken });
            })
            .catch((err: unknown) =>
              reject(err instanceof Error ? err : new Error(String(err))),
            );
        }),
    );
  }

  private loadAppleScript(): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Apple Sign-In requires a browser.'));
    }

    if ((window as any).AppleID?.auth) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const src =
        'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${src}"]`,
      );
      const done = () => {
        if ((window as any).AppleID?.auth) {
          resolve();
        } else {
          reject(new Error('Apple SDK loaded but AppleID.auth is missing.'));
        }
      };

      if (existing) {
        if ((window as any).AppleID?.auth) {
          resolve();
          return;
        }
        existing.addEventListener('load', done);
        existing.addEventListener('error', () =>
          reject(new Error('Failed to load Apple Sign-In script.')),
        );
        return;
      }

      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = () => done();
      s.onerror = () =>
        reject(new Error('Failed to load Apple Sign-In script.'));
      document.head.appendChild(s);
    });
  }
}
