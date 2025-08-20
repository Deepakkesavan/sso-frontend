import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-dashboard',
  standalone: true, // modern Angular style (optional: if using standalone)
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  loading = true;
  logoutLoading = false;
  showRawData = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  /** ================= LIFECYCLE ===================== */

  ngOnInit(): void {
    console.log('Dashboard initialized');

    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        console.log('Dashboard - user data received:', user);
        this.loading = false;
        this.user = user;

        if (!user?.authenticated) {
          console.log('User not authenticated → redirecting');
          this.navigateToLogin();
        } else {
          console.log('User authenticated → displaying dashboard');
        }
      },
      error: (err) => {
        console.error('Dashboard subscription error:', err);
        this.handleAuthError();
      },
    });
  }

  ngOnDestroy(): void {
    console.log('Dashboard destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** ================= AUTH / LOGOUT ===================== */

  logout(): void {
    console.log('Logout started...');
    this.logoutLoading = true;

    this.authService
      .logoutComplete()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('Logout API success:', res);
          this.handlePostLogout();
        },
        error: (err) => {
          console.error('Logout API failed:', err);
          this.handlePostLogout(true);
        },
      });
  }

  forceLogout(): void {
    console.log('Force logout triggered');
    this.authService.clearAuth(); // clears on client
    this.logout(); // fallback → still try server logout
  }

  private handlePostLogout(errorCase = false): void {
    this.logoutLoading = false;
    this.authService.clearAuth();

    this.navigateToLogin(
      errorCase
        ? 'Error case - redirected to login'
        : 'Redirecting after logout'
    );
  }

  private handleAuthError(): void {
    this.loading = false;
    this.user = null;
    this.navigateToLogin('Auth error - redirecting to login');
  }

  private navigateToLogin(message?: string): void {
    console.log(message || 'Navigating to login...');
    this.router.navigate(['/login']).then(() => {
      console.log('Navigation complete → hard reload /login');
      setTimeout(() => (window.location.href = '/login'), 100);
    });
  }

  /** ================= UI HELPERS ===================== */

  getUserType(): string {
    if (!this.user?.user) return 'Unknown';
    return this.user.user.givenName || this.user.user.familyName
      ? 'Azure AD (OAuth2)'
      : 'Custom (JWT)';
  }

  getWelcomeMessage(): string {
    if (!this.user?.user) return 'Welcome!';
    const userObj = this.user.user;
    const name =
      userObj.name || userObj.username || userObj.givenName || 'User';
    return `Welcome, ${name}!`;
  }

  getUserEmail(): string {
    return this.user?.user?.email || 'No email available';
  }

  getEmployeeInfo(): string {
    if (!this.user) return 'No employee information available';
    const { empId = 'N/A', designation = 'N/A' } = this.user;
    return `Employee ID: ${empId} | Designation: ${designation}`;
  }

  hasEmployeeInfo(): boolean {
    return Boolean(this.user && (this.user.empId || this.user.designation));
  }

  formatAttributes(attributes: any): string {
    return JSON.stringify(attributes, null, 2);
  }

  /** ================= DEBUG / EXTRA ===================== */

  refreshUserData(): void {
    console.log('Refreshing auth status...');
    this.loading = true;
    this.authService.checkAuthStatus();
  }

  checkSessionStatus(): void {
    console.log('Checking session status...');
    fetch('http://localhost:8080/debug/session-status', {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d) => console.log('Session status:', d))
      .catch((err) => console.error('Session status check failed:', err));
  }

  // Redirects
  redirectToLMS(): void {
    window.location.href = 'http://localhost:4200';
  }
  redirectToRRF(): void {
    window.location.href = 'http://rrf.yourdomain.com';
  }
}
