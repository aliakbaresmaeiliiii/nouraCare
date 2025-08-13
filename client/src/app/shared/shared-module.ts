import { CommonModule, NgOptimizedImage } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputOtp,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone';

const IONIC_MODULES = [
  IonInput,
  IonItem,
  IonList,
  IonInputOtp,
  IonToggle,
  IonButton,
  IonFooter,
  IonToast,
  IonContent,
  IonHeader,
  IonIcon,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonBackButton,
  IonButtons,
  IonMenuButton,
  IonToolbar,
  IonMenu,
  IonAvatar,
  IonItemDivider,
];

const COMMON_MODULES = [
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  NgOptimizedImage,
  RouterLink,
];

@NgModule({
  declarations: [],
  imports: [...COMMON_MODULES, ...IONIC_MODULES],
  exports: [...COMMON_MODULES, ...IONIC_MODULES],
  providers: [],
})
export class SharedModule {}
