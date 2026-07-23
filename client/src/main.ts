import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from '@app/app.component';
import { appConfig } from '@app/app.config';
import {
  applyThemeDom,
  readStoredPreference,
} from '@app/shared/services/theme.service';

try {
  if (typeof localStorage !== 'undefined') {
    applyThemeDom(readStoredPreference());
  }
} catch {
  /* theme bootstrap is best-effort */
}

bootstrapApplication(AppComponent, appConfig);
