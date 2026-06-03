import { Routes } from '@angular/router';
import { getToolPageRoutes } from './tool-pages.config';

export const TOOL_PAGE_ROUTES: Routes = getToolPageRoutes().map(({ path }) => ({
  path,
  loadComponent: () =>
    import('./tool-generic-page/tool-generic-page.component').then(
      (m) => m.ToolGenericPageComponent,
    ),
  data: { pageRoute: path },
}));
