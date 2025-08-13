import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../auth-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './app-login.component.html',
  styleUrl: './app-login.component.css'
})
export class AppLoginComponent implements OnInit {
  errorMessage: string = '';
  loading: boolean = true;
  isAuthenticated: boolean = false;
  customLoginLoading: boolean = false;
  
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
    this.authService.user$.subscribe(user => {
      this.loading = false;
      this.isAuthenticated = user && user.authenticated === true;
      
      // If authenticated, redirect to dashboard
      if (this.isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });
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

    this.authService.customLogin(this.loginData.username, this.loginData.password).subscribe({
      next: (response) => {
        this.customLoginLoading = false;
        console.log('Login successful:', response);
        // Refresh auth status after successful login
        this.authService.checkAuthStatus();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.customLoginLoading = false;
        console.error('Login failed:', error);
        
        if (error.status === 404) {
          this.errorMessage = 'User not found. Please sign up first.';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid credentials. Please try again.';
        } else if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}