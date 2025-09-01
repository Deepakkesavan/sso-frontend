import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { AuthServiceService, User } from '../../services/auth-service.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './app-login.component.html',
  styleUrls: ['./app-login.component.css'],
  imports: [FormsModule, CommonModule],
})
export class AppLoginComponent implements OnInit, OnDestroy {
  loginData = { username: '', password: '' };
  errorMessage = '';
  loading = true;
  customLoginLoading = false;
  isAuthenticated = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.loading = false;
      this.isAuthenticated = user.authenticated;

      if (this.isAuthenticated && !user.user) {
        // fetch profile only once
        // this.authService.getUserProfile().subscribe();
        this.router.navigate(['dashboard']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  customLogin(): void {
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.customLoginLoading = true;
    this.errorMessage = '';

    this.authService
      .customLogin(this.loginData.username, this.loginData.password)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.authService.getUserProfile()) // fetch full user profile after login
      )
      .subscribe({
        next: () => {
          this.customLoginLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.customLoginLoading = false;
          this.errorMessage =
            err.status === 404
              ? 'User not found'
              : err.status === 401
              ? 'Invalid credentials'
              : 'Login failed';
        },
      });
  }

  loginWithAzure(): void {
    this.authService.loginWithAzure();
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
