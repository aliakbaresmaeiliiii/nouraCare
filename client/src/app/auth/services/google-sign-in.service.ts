import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { environment } from '../../../environments/environment';

export class GoogleSignInNotConfiguredError extends Error {
  readonly code = 'GOOGLE_NOT_CONFIGURED';
  constructor() {
    super('Google Sign-In is not configured (missing Web Client ID).');
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GoogleSignInService {
  private nativeInitPromise: Promise<void> | null = null;
  private gisScriptPromise: Promise<void> | null = null;

  private getWebClientId(): string {
    return environment.googleWebClientId?.trim() ?? '';
  }

  /**
   * Native (Android/iOS): Capacitor Social Login.
   * Web: Google Identity Services token client — avoids legacy implicit OAuth
   * (`response_type=token id_token`) which often returns Google error 400 invalid_request.
   */
  async signInWithGoogle(): Promise<{
    email: string;
    fullName?: string;
    idToken?: string;
    accessToken?: string;
  }> {
    const webClientId = this.getWebClientId();
    if (!webClientId) {
      throw new GoogleSignInNotConfiguredError();
    }

    if (Capacitor.getPlatform() === 'web') {
      return this.signInWithGoogleWeb(webClientId);
    }

    await this.ensureNativePluginInitialized(webClientId);

    const { result } = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['email', 'profile'],
      },
    });

    if (result.responseType === 'offline') {
      throw new Error('Google Sign-In returned offline mode; expected profile.');
    }

    const email = result.profile.email?.trim();
    if (!email) {
      throw new Error('Google did not return an email for this account.');
    }

    const fromParts = [result.profile.givenName, result.profile.familyName]
      .filter((p): p is string => !!p?.trim())
      .join(' ')
      .trim();
    const fullName =
      fromParts || result.profile.name?.trim() || undefined;

    const idToken = result.idToken?.trim() || undefined;
    const accessToken = result.accessToken?.token?.trim() || undefined;

    return { email, fullName, idToken, accessToken };
  }

  private ensureNativePluginInitialized(webClientId: string): Promise<void> {
    if (this.nativeInitPromise) {
      return this.nativeInitPromise;
    }

    this.nativeInitPromise = SocialLogin.initialize({
      google: {
        webClientId,
        mode: 'online',
        ...(Capacitor.getPlatform() === 'ios' &&
        environment.googleIOSClientId?.trim()
          ? {
              iOSClientId: environment.googleIOSClientId.trim(),
              iOSServerClientId: webClientId,
            }
          : {}),
      },
    });

    return this.nativeInitPromise;
  }

  private loadGoogleIdentityScript(): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Google Sign-In requires a browser.'));
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }

    if (this.gisScriptPromise) {
      return this.gisScriptPromise;
    }

    this.gisScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GIS_SCRIPT_SRC}"]`,
      );
      const done = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
        } else {
          reject(
            new Error(
              'Google Identity Services loaded but oauth2 API is missing.',
            ),
          );
        }
      };

      if (existing) {
        if (window.google?.accounts?.oauth2) {
          resolve();
          return;
        }
        existing.addEventListener('load', done);
        existing.addEventListener('error', () =>
          reject(new Error('Failed to load Google Sign-In script.')),
        );
        return;
      }

      const s = document.createElement('script');
      s.src = GIS_SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => done();
      s.onerror = () =>
        reject(new Error('Failed to load Google Sign-In script.'));
      document.head.appendChild(s);
    });

    return this.gisScriptPromise;
  }

  private signInWithGoogleWeb(
    clientId: string,
  ): Promise<{
    email: string;
    fullName?: string;
    idToken?: string;
    accessToken?: string;
  }> {
    return this.loadGoogleIdentityScript().then(
      () =>
        new Promise((resolve, reject) => {
          const oauth2 = window.google?.accounts?.oauth2;
          if (!oauth2) {
            reject(new Error('Google Identity Services failed to initialize.'));
            return;
          }

          const SIGN_IN_TIMEOUT_MS = 120_000;
          let settled = false;
          const timeoutId = window.setTimeout(() => {
            finish(() =>
              reject(
                new Error(
                  'Google sign-in timed out. If you closed the popup, try again.',
                ),
              ),
            );
          }, SIGN_IN_TIMEOUT_MS);

          const finish = (fn: () => void) => {
            if (settled) {
              return;
            }
            settled = true;
            window.clearTimeout(timeoutId);
            fn();
          };

          try {
            const client = oauth2.initTokenClient({
              client_id: clientId,
              scope: 'openid email profile',
              callback: (tokenResponse) => {
                if (tokenResponse.error) {
                  finish(() =>
                    reject(
                      new Error(
                        tokenResponse.error_description ||
                          tokenResponse.error ||
                          'Google sign-in failed.',
                      ),
                    ),
                  );
                  return;
                }

                const accessToken = tokenResponse.access_token;
                if (!accessToken) {
                  finish(() =>
                    reject(new Error('Google did not return an access token.')),
                  );
                  return;
                }

                void fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` },
                })
                  .then(async (r) => {
                    if (!r.ok) {
                      const t = await r.text();
                      throw new Error(
                        `Could not load Google profile (${r.status}). ${t}`,
                      );
                    }
                    return r.json() as Promise<{
                      email?: string;
                      name?: string;
                      given_name?: string;
                      family_name?: string;
                    }>;
                  })
                  .then((data) => {
                    const email = data.email?.trim();
                    if (!email) {
                      throw new Error(
                        'Google did not return an email for this account.',
                      );
                    }
                    const fromParts = [data.given_name, data.family_name]
                      .filter((p): p is string => !!p?.trim())
                      .join(' ')
                      .trim();
                    const fullName =
                      fromParts || data.name?.trim() || undefined;
                    finish(() =>
                      resolve({ email, fullName, accessToken }),
                    );
                  })
                  .catch((e: unknown) =>
                    finish(() =>
                      reject(
                        e instanceof Error
                          ? e
                          : new Error(String(e)),
                      ),
                    ),
                  );
              },
            });

            client.requestAccessToken({ prompt: 'select_account' });
          } catch (e: unknown) {
            finish(() =>
              reject(
                e instanceof Error ? e : new Error(String(e)),
              ),
            );
          }
        }),
    );
  }
}
