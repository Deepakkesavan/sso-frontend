import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../auth-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-login',
  imports: [CommonModule],
  templateUrl: './app-login.component.html',
  styleUrl: './app-login.component.css'
})
export class AppLoginComponent implements OnInit{
  errorMessage: string = '';
  loading: boolean = true;
  isAuthenticated: boolean = false;
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

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
