import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppLoginComponent } from '../app/app-login/app-login.component';
import { DashboardComponent } from '../app/dashboard/dashboard.component';
import { SignupComponent } from '../app/sign-up/sign-up.component';
import { AuthGuard } from './auth.guard';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter([
      { path: '', redirectTo: '/login', pathMatch: 'full' },
      { path: 'login', component: AppLoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: '**', redirectTo: '/login' } // Catch-all route
    ]),
    provideHttpClient(withInterceptorsFromDi())
  ]
};