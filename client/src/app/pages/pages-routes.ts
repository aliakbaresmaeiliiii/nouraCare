import { Routes } from "@angular/router";
import { Layout } from "./layout/layout";
import { Profile } from "./profile/profile";

export const pagesRoutes: Routes = [
  {
    path: '',
    component: Layout,
  },
  {
    path: 'profile',
    component: Profile,
  },
];
