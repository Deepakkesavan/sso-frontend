import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

interface LoginResponse {
  message: string;
  empId: number;
  designation: string;
  redirect: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthServiceService {
  // Centralized API URLs
  private readonly API = 'http://localhost:8080/api/auth';
  private readonly CUSTOM_API = 'http://localhost:8080/custom-login/auth';
  private readonly FRONTEND_LOGIN_URL = 'http://localhost:5050/login';
  private readonly FRONTEND_DASHBOARD_URL = 'http://localhost:5050/dashboard';

  private userSubject = new BehaviorSubject<any>({ authenticated: false });
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  /** ========================== AUTH STATUS ============================= */
  checkAuthStatus(): void {
    this.http
      .get(`${this.API}/user-attributes`, { withCredentials: true })
      .subscribe({
        next: (user) => {
          console.log('Auth status: authenticated', user);
          this.userSubject.next({ ...user, authenticated: true });
        },
        error: (err: HttpErrorResponse) => {
          console.log('Auth status: not authenticated', err.status);
          this.userSubject.next({ authenticated: false });
        },
      });
  }

  /** ========================== OAUTH LOGIN ============================= */
  login(): void {
    this.cleanup();
    setTimeout(() => {
      window.location.href = `${this.API.replace(
        '/api/auth',
        ''
      )}/oauth2/authorization/azure`;
    }, 100);
  }

  /** ========================== CUSTOM LOGIN ============================= */
  customLogin(username: string, password: string): Observable<any> {
    this.cleanup();

    return this.http
      .post<LoginResponse>(
        `${this.CUSTOM_API}/signin`,
        { email: username, password },
        { withCredentials: true, observe: 'response' }
      )
      .pipe(
        tap((response) => {
          console.log('Custom login success:', response);
          const redirectUrl =
            response.body?.redirect || this.FRONTEND_DASHBOARD_URL;
          this.userSubject.next({ authenticated: true, ...response.body });
          setTimeout(() => (window.location.href = redirectUrl), 200);
        }),
        catchError((error) => {
          console.error('Custom login failed:', error);
          this.userSubject.next({ authenticated: false });
          throw error;
        })
      );
  }

  /** ========================== SIGNUP ============================= */
  signup(userData: {
    username: string;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.CUSTOM_API}/signup`, userData).pipe(
      tap((res) => console.log('Signup successful:', res)),
      catchError((err) => {
        console.error('Signup failed:', err);
        throw err;
      })
    );
  }

  /** ========================== LOGOUT ============================= */
  logout(): Observable<any> {
    const currentUser = this.userSubject.value;
    const isJwtUser =
      currentUser && currentUser.user && !currentUser.user.givenName;
    const logoutUrl = isJwtUser
      ? `${this.CUSTOM_API}/logout`
      : `${this.API}/logout`;

    console.log('Logging out via:', logoutUrl, 'isJwtUser:', isJwtUser);

    return this.http
      .post(logoutUrl, {}, { withCredentials: true, observe: 'response' })
      .pipe(
        tap(() => this.handleLogoutSuccess()),
        catchError((err) => {
          console.error('Logout API failed:', err);
          return this.handleLogoutFailure();
        })
      );
  }

  /** ========================== COMPLETE LOGOUT ============================= */
  logoutComplete(): Observable<any> {
    console.log('Performing complete logout...');

    this.cleanup();

    // Try global, then API, then JWT logout
    return this.http
      .post(
        'http://localhost:8080/logout',
        {},
        { withCredentials: true, observe: 'response' }
      )
      .pipe(
        catchError(() =>
          this.http.post(
            `${this.API}/logout`,
            {},
            { withCredentials: true, observe: 'response' }
          )
        ),
        catchError(() =>
          this.http.post(
            `${this.CUSTOM_API}/logout`,
            {},
            { withCredentials: true, observe: 'response' }
          )
        ),
        catchError((err) => {
          console.error('All logout attempts failed:', err);
          return of({ message: 'Client-side logout only' });
        }),
        tap(() => this.handleLogoutSuccess())
      );
  }

  /** ========================== UTIL METHODS ============================= */
  isAuthenticated(): boolean {
    return this.userSubject.value?.authenticated === true;
  }

  getUser(): any {
    return this.userSubject.value;
  }

  /** ========================== PRIVATE HELPERS ============================= */
  private handleLogoutSuccess(): void {
    this.cleanup();
    window.location.href = this.FRONTEND_LOGIN_URL;
  }

  private handleLogoutFailure(): Observable<any> {
    this.cleanup();
    window.location.href = this.FRONTEND_LOGIN_URL;
    return of({ message: 'Logout completed with errors' });
  }

  /** Clear state + browser data */
  private cleanup(): void {
    this.userSubject.next({ authenticated: false });
    this.clearCookies();
    this.clearBrowserStorage();
  }

  private clearCookies(): void {
    const cookiesToClear = ['jwt', 'JSESSIONID', 'XSRF-TOKEN'];
    cookiesToClear.forEach((c) => {
      document.cookie = `${c}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${c}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
    });

    document.cookie.split(';').forEach((c) => {
      document.cookie = `${
        c.trim().split('=')[0]
      }=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }

  private clearBrowserStorage(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
      console.log('Browser storage cleared');
    } catch (err) {
      console.error('Error clearing storage:', err);
    }
  }

  public clearAuth(): void {
    this.cleanup();
  }
}
