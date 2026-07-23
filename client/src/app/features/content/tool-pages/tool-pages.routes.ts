import { Routes } from '@angular/router';
import { getToolPageRoutes } from '@app/features/content/tool-pages/tool-pages.config';

export const TOOL_PAGE_ROUTES: Routes = getToolPageRoutes().map(({ path }) => ({
  path,
  loadComponent: () =>
    import('@app/features/content/tool-pages/tool-generic-page/tool-generic-page.component').then(
      (m) => m.ToolGenericPageComponent,
    ),
  data: { pageRoute: path },
}));
