import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AppLoginComponent } from './app-login/app-login.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: AppLoginComponent },
  { path: 'dashboard', component: DashboardComponent },
];
