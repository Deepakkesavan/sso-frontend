import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  logoutLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (!user.authenticated) this.router.navigate(['/login']);
      else this.user = user.user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.logoutLoading = true;
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }

  redirectToLMS(): void {
    window.location.href = 'http://localhost:4200';
  }
  redirectToRRF(): void {
    window.location.href = 'http://rrf.yourdomain.com';
  }

  getWelcomeMessage(): string {
    return this.user?.givenName
      ? `Welcome, ${this.user.givenName}!`
      : 'Welcome!';
  }
}
