import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { environment } from '../../../environments/environment';

/**
 * Single SocialLogin.initialize() for Google + Apple (Capacitor native).
 */
@Injectable({ providedIn: 'root' })
export class SocialLoginInitService {
  private initPromise: Promise<void> | null = null;

  ensureInitialized(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    const webClientId = environment.googleWebClientId?.trim() ?? '';
    const googleConfig = webClientId
      ? {
          google: {
            webClientId,
            mode: 'online' as const,
            ...(Capacitor.getPlatform() === 'ios' &&
            environment.googleIOSClientId?.trim()
              ? {
                  iOSClientId: environment.googleIOSClientId.trim(),
                  iOSServerClientId: webClientId,
                }
              : {}),
          },
        }
      : {};

    const appleClientId =
      (Capacitor.getPlatform() === 'ios'
        ? environment.appleBundleId
        : environment.appleServiceId || environment.appleBundleId
      )?.trim() ?? '';

    const appleConfig = appleClientId
      ? {
          apple: {
            clientId: appleClientId,
            redirectUrl:
              Capacitor.getPlatform() === 'ios'
                ? ''
                : (environment.appleRedirectUrl?.trim() ?? ''),
            useProperTokenExchange: true,
            useBroadcastChannel: Capacitor.getPlatform() === 'android',
          },
        }
      : {};

    this.initPromise = SocialLogin.initialize({
      ...googleConfig,
      ...appleConfig,
    });

    return this.initPromise;
  }
}
