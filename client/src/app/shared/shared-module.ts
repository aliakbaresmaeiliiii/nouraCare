import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MaterialModules } from './material/material.module';

const COMMON_MODULES = [
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  NgOptimizedImage,
  RouterLink,
];

@NgModule({
  declarations: [],
  imports: [...COMMON_MODULES, MaterialModules],
  exports: [...COMMON_MODULES, MaterialModules],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule {}
