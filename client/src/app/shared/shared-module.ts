import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import {
  IonApp,
  IonAvatar,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
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
  IonModal,
  IonNav,
  IonNavLink,
  IonPicker,
  IonPickerColumn,
  IonPickerColumnOption,
  IonRouterLink,
  IonRouterOutlet,
  IonSegment,
  IonSegmentButton,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonText,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
  IonRadio,
  IonRadioGroup,
  IonNote,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonDatetimeButton,
  IonSearchbar,
  IonSpinner,
  IonMenuToggle
} from '@ionic/angular/standalone';
import { CircleProgressBarComponent } from './components/circle-progress-bar/circle-progress-bar.component';
import { MapboxMapComponent } from './components/mapbox-map/mapbox-map.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { HeaderLanguageSwitcherComponent } from './components/header-language-switcher/header-language-switcher.component';

import { TranslatePipe } from './pipes/translate.pipe';

import { MapService } from './services/map.service';
import { ImageUrlService } from './services/image-url.service';
import { ToolsService } from './services/tools.service';
import { MessageService } from './services/message.service';
import { LanguageService } from './services/language.service';
import { TranslationService } from './services/translation.service';

const IONIC_MODULES = [
  IonInput,
  IonDatetimeButton,
  IonItem,
  IonList,
  IonInputOtp,
  IonToggle,
  IonButton,
  IonBadge,
  IonFab,
  IonFabButton,
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
  IonNavLink,
  IonNav,
  IonRouterLink,
  IonSegment,
  IonSegmentButton,
  IonApp,
  IonModal,
  IonDatetime,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonText,
  IonPicker,
  IonPickerColumn,
  IonPickerColumnOption,
  IonRadio,
  IonRadioGroup,
  IonNote,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonSpinner,
  IonMenuToggle
];

const COMMON_MODULES = [
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  NgOptimizedImage,
  RouterLink,
  RouterOutlet,
  RouterModule,
  IonRouterOutlet,
  HttpClientModule,
];

@NgModule({
  declarations: [CircleProgressBarComponent, MapboxMapComponent],
  imports: [...COMMON_MODULES, ...IONIC_MODULES, RouterModule.forChild([]), LanguageSwitcherComponent, HeaderLanguageSwitcherComponent, TranslatePipe],
  exports: [...COMMON_MODULES, ...IONIC_MODULES, CircleProgressBarComponent, MapboxMapComponent, LanguageSwitcherComponent, HeaderLanguageSwitcherComponent, TranslatePipe],
  providers: [MapService, ImageUrlService, ToolsService, MessageService, LanguageService, TranslationService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule { }
