import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthServiceService } from '../../services/auth-service.service';
@Component({
  selector: 'app-app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-login.component.html',
  styleUrls: ['./app-login.component.css'],
})
export class AppLoginComponent implements OnInit, OnDestroy {
  errorMessage = '';
  loading = true;
  isAuthenticated = false;
  customLoginLoading = false;
  loginData = { username: '', password: '' };

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set error message if error param present
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      this.errorMessage = 'Login failed. Please try again.';
    }

    // User auth subscription
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        console.log('Login component - user status:', user);
        this.loading = false;
        this.isAuthenticated = !!user?.authenticated;

        if (this.isAuthenticated) {
          this.navigateToDashboard();
        }
      },
      error: (error) => {
        console.error('Auth subscription error:', error);
        this.loading = false;
        this.isAuthenticated = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  login(): void {
    this.authService.login();
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.customLoginLoading = false;
          setTimeout(() => this.navigateToDashboard(), 200);
        },
        error: (error) => {
          this.customLoginLoading = false;
          console.error('Login failed:', error);

          // Granular error logic
          if (error.status === 404) {
            this.errorMessage = 'User not found. Please sign up first.';
          } else if (error.status === 401 || error.status === 403) {
            this.errorMessage = 'Invalid credentials. Please try again.';
          } else if (error.error?.error) {
            this.errorMessage = error.error.error;
          } else {
            this.errorMessage = 'Login failed. Please try again.';
          }
        },
      });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToDashboard(): void {
    this.navigateToDashboard();
  }

  private navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
    // Optionally, uncomment if you want a hard reload (discouraged in SPA)
    // window.location.href = 'http://localhost:5050/dashboard';
  }
}
