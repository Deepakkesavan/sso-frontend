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
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const authSub = this.authService.user$.subscribe(user => {
      this.loading = false;
      this.user = user;
      
      // If not authenticated, redirect to login
      if (!user || !user.authenticated) {
        this.router.navigate(['/login']);
      }
    });
    
    this.subscription.add(authSub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout(): void {
    this.logoutLoading = true;
    
    const logoutSub = this.authService.logoutComplete().subscribe({
      next: (response) => {
        console.log('Logout successful:', response);
        this.logoutLoading = false;
        
        // Force clear auth state
        this.authService.clearAuth();
        
        // Navigate to login with a slight delay to ensure state is cleared
        setTimeout(() => {
          this.router.navigate(['/login']).then(() => {
            // Force page reload to clear any cached data
            window.location.reload();
          });
        }, 100);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.logoutLoading = false;
        
        // Force clear auth state even on error
        this.authService.clearAuth();
        
        // Still redirect to login
        setTimeout(() => {
          this.router.navigate(['/login']).then(() => {
            window.location.reload();
          });
        }, 100);
      }
    });
    
    this.subscription.add(logoutSub);
  }

  goToLogin(): void {
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
}