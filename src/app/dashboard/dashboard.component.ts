import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../auth-service.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  loading: boolean = true;
  logoutLoading: boolean = false;
  showRawData: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Dashboard component initialized');
    
    const authSub = this.authService.user$.subscribe({
      next: (user) => {
        console.log('Dashboard - received user data:', user);
        this.loading = false;
        this.user = user;
        
        // If not authenticated, redirect to login
        if (!user || !user.authenticated) {
          console.log('User not authenticated, redirecting to login');
          this.router.navigate(['/login']);
        } else {
          console.log('User is authenticated, displaying dashboard');
        }
      },
      error: (error) => {
        console.error('Dashboard - auth subscription error:', error);
        this.loading = false;
        this.user = null;
        this.router.navigate(['/login']);
      }
    });
    
    this.subscription.add(authSub);
  }

  ngOnDestroy(): void {
    console.log('Dashboard component destroyed');
    this.subscription.unsubscribe();
  }

  logout(): void {
    console.log('Dashboard logout initiated...');
    this.logoutLoading = true;
    
    const logoutSub = this.authService.logoutComplete().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);
        this.logoutLoading = false;
        
        // Force clear auth state
        this.authService.clearAuth();
        
        // Navigate to login immediately
        this.router.navigate(['/login']).then(() => {
          console.log('Navigated to login, reloading page...');
          // Force complete page reload to clear all cached data
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        });
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.logoutLoading = false;
        
        // Force clear auth state even on error
        this.authService.clearAuth();
        
        // Still redirect to login
        this.router.navigate(['/login']).then(() => {
          console.log('Error case - navigated to login, reloading page...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        });
      }
    });
    
    this.subscription.add(logoutSub);
  }

  goToLogin(): void {
    console.log('Redirecting to login manually');
    this.router.navigate(['/login']);
  }

  formatAttributes(attributes: any): string {
    return JSON.stringify(attributes, null, 2);
  }

  getUserType(): string {
    if (!this.user || !this.user.user) return 'Unknown';
    
    // Check if it's OAuth2 user (has OAuth2 specific attributes)
    if (this.user.user.id && (this.user.user.givenName || this.user.user.familyName)) {
      return 'Azure AD (OAuth2)';
    } else {
      return 'Custom (JWT)';
    }
  }

  // Additional helper methods for better user experience
  getWelcomeMessage(): string {
    if (!this.user || !this.user.user) return 'Welcome!';
    
    const name = this.user.user.name || 
                 this.user.user.username || 
                 this.user.user.givenName || 
                 'User';
    return `Welcome, ${name}!`;
  }

  getUserEmail(): string {
    if (!this.user || !this.user.user) return 'No email available';
    return this.user.user.email || 'No email available';
  }

  getEmployeeInfo(): string {
    if (!this.user) return 'No employee information available';
    
    const empId = this.user.empId || 'N/A';
    const designation = this.user.designation || 'N/A';
    
    return `Employee ID: ${empId} | Designation: ${designation}`;
  }

  hasEmployeeInfo(): boolean {
    return this.user && (this.user.empId || this.user.designation);
  }

  // Debug method to check session status
  checkSessionStatus(): void {
    console.log('Checking session status...');
    // You can call a debug endpoint here if needed
    fetch('http://localhost:8080/debug/session-status', {
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      console.log('Session status:', data);
      alert('Session status logged to console');
    })
    .catch(error => {
      console.error('Error checking session status:', error);
    });
  }

  // Method to refresh user data
  refreshUserData(): void {
    console.log('Refreshing user data...');
    this.loading = true;
    this.authService.checkAuthStatus();
  }

  // Method to force logout and clear everything
  forceLogout(): void {
    console.log('Force logout initiated...');
    this.logoutLoading = true;
    
    // Clear everything on client side first
    this.authService.clearAuth();
    
    // Then try server logout
    this.logout();
  }
}