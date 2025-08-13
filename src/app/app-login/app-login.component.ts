import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../auth-service.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-login.component.html',
  styleUrl: './app-login.component.css'
})
export class AppLoginComponent implements OnInit, OnDestroy {
  errorMessage: string = '';
  loading: boolean = true;
  isAuthenticated: boolean = false;
  customLoginLoading: boolean = false;
  private subscription: Subscription = new Subscription();
  
  loginData = {
    username: '',
    password: ''
  };

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for error parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error')) {
      this.errorMessage = 'Login failed. Please try again.';
    }

    // Subscribe to authentication status
    const authSub = this.authService.user$.subscribe({
      next: (user) => {
        console.log('Login component - user status:', user);
        this.loading = false;
        this.isAuthenticated = user && user.authenticated === true;
        
        // If authenticated, redirect to dashboard
        if (this.isAuthenticated) {
          console.log('User is authenticated, redirecting to dashboard');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('Auth subscription error:', error);
        this.loading = false;
        this.isAuthenticated = false;
      }
    });
    
    this.subscription.add(authSub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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

    const loginSub = this.authService.customLogin(this.loginData.username, this.loginData.password).subscribe({
      next: (response) => {
        this.customLoginLoading = false;
        console.log('Login successful:', response);
        
        // Give a small delay to ensure authentication status is updated
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 200);
      },
      error: (error) => {
        this.customLoginLoading = false;
        console.error('Login failed:', error);
        
        if (error.status === 404) {
          this.errorMessage = 'User not found. Please sign up first.';
        } else if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Invalid credentials. Please try again.';
        } else if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
    
    this.subscription.add(loginSub);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}