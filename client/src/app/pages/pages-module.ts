import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './home/home';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { pagesRoutes } from './pages-routes';
import { Layout } from './layout/layout';

@NgModule({
  declarations: [Home, Layout],
  imports: [CommonModule, SharedModule, RouterModule.forChild(pagesRoutes)],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PagesModule {}
