import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './home/home';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { pagesRoutes } from './pages-routes';
import { Layout } from './layout/layout';
import { Profile } from './profile/profile';

@NgModule({
  declarations: [Home, Layout, Profile],
  imports: [CommonModule, SharedModule, RouterModule.forChild(pagesRoutes)],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
