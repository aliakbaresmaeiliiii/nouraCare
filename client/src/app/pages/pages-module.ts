import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './home/home';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { pagesRoutes } from './pages-routes';
import { Layout } from './layout/layout';
import { Profile } from './profile/profile';
import { CircleProgressBar } from '../shared/components/circle-progress-bar/circle-progress-bar';



@NgModule({
  declarations: [Home, Layout, Profile],
  imports: [
    CommonModule,
    SharedModule,
    CircleProgressBar,

    RouterModule.forChild(pagesRoutes),
  ],
  exports:[Profile,Layout],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
