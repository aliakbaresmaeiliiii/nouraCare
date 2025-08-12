import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './home/home';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';
import { pagesRoutes } from './pages-routes';

@NgModule({
  declarations: [Home],
  imports: [CommonModule, SharedModule, RouterModule.forChild(pagesRoutes)],
})
export class PagesModule {}
