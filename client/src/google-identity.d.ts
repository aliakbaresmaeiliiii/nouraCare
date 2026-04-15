/** Minimal typings for https://accounts.google.com/gsi/client (GIS token client). */
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GisTokenClientConfig) => GisTokenClient;
        };
      };
    };
  }
}

interface GisTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GisTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (resp: GisTokenResponse) => void;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string; scope?: string }) => void;
}
