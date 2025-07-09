import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../auth-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  user: any = null;
  loading: boolean = true;

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.loading = false;
      this.user = user;
      
      // If not authenticated, redirect to login
      if (!user || !user.authenticated) {
        this.router.navigate(['/login']);
      }
    });
  }
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.checkAuthStatus(); // Refresh auth status
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still redirect to login even if logout fails
        this.router.navigate(['/login']);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  formatAttributes(attributes: any): string {
    return JSON.stringify(attributes, null, 2);
  }
}
