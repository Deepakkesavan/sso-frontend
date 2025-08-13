import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private customLoginUrl = 'http://localhost:8080/custom-login/auth';
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  checkAuthStatus(): void {
    this.http.get(`${this.apiUrl}/user-attributes`, { withCredentials: true })
      .subscribe({
        next: (user) => {
          console.log('Auth status check - authenticated:', user);
          this.userSubject.next(user);
        },
        error: (error: HttpErrorResponse) => {
          console.log('Auth status check - not authenticated:', error.status);
          this.userSubject.next({ authenticated: false });
        }
      });
  }

  login(): void {
    // Clear any existing state before OAuth2 login
    this.clearAuth();
    // Redirect to Spring Boot OAuth2 login endpoint
    window.location.href = 'http://localhost:8080/oauth2/authorization/azure';
  }

  // Custom login with username/password
  customLogin(username: string, password: string): Observable<any> {
    const loginData = {
      email: username, // Backend expects email field
      password: password
    };

    // Clear any existing authentication state before login
    this.clearAuth();

    return this.http.post(`${this.customLoginUrl}/signin`, loginData, { 
      withCredentials: true,
      observe: 'response'
    }).pipe(
      tap((response) => {
        console.log('Custom login successful:', response);
        // Force a delay to ensure cookie is set and any previous auth is cleared
        setTimeout(() => {
          this.checkAuthStatus();
        }, 200);
      }),
      catchError((error) => {
        console.error('Custom login failed:', error);
        this.userSubject.next({ authenticated: false });
        throw error;
      })
    );
  }

  // Signup method
  signup(userData: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.customLoginUrl}/signup`, userData).pipe(
      tap((response) => {
        console.log('Signup successful:', response);
      }),
      catchError((error) => {
        console.error('Signup failed:', error);
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    // Clear user state immediately
    this.userSubject.next({ authenticated: false });
    
    // Determine logout endpoint based on current user type
    const currentUser = this.userSubject.value;
    const isJwtUser = currentUser && currentUser.user && !currentUser.user.givenName; // JWT users don't have givenName
    
    const logoutUrl = isJwtUser ? 
      `${this.customLoginUrl}/logout` : 
      `${this.apiUrl}/logout`;
    
    console.log('Logging out via:', logoutUrl, 'isJwtUser:', isJwtUser);
    
    return this.http.post(logoutUrl, {}, { 
      withCredentials: true,
      observe: 'response',
      responseType: 'json'
    }).pipe(
      tap((response) => {
        console.log('Logout successful:', response);
        this.userSubject.next({ authenticated: false });
      }),
      catchError((error) => {
        console.error('Logout failed:', error);
        // Keep user state cleared even if request fails
        this.userSubject.next({ authenticated: false });
        return of({ message: 'Logout completed with errors' });
      })
    );
  }

  // Enhanced logout method that tries multiple endpoints and clears everything
  logoutComplete(): Observable<any> {
    // Clear state immediately
    this.clearAuth();
    
    // Try comprehensive logout
    const comprehensiveLogout = this.http.post(`${this.apiUrl}/logout`, {}, { 
      withCredentials: true,
      observe: 'response',
      responseType: 'json'
    });
    
    return comprehensiveLogout.pipe(
      catchError(() => {
        console.log('API logout failed, trying JWT logout...');
        return this.http.post(`${this.customLoginUrl}/logout`, {}, { 
          withCredentials: true,
          observe: 'response',
          responseType: 'json'
        });
      }),
      catchError(() => {
        console.log('JWT logout failed, trying Spring logout...');
        return this.http.post('http://localhost:8080/logout', {}, { 
          withCredentials: true,
          observe: 'response',
          responseType: 'json'
        });
      }),
      catchError((error) => {
        console.error('All logout attempts failed:', error);
        return of({ message: 'Logout completed (client-side cleared)' });
      }),
      tap(() => {
        // Final cleanup
        this.clearAuth();
        // Clear any cached data
        this.clearBrowserCache();
      })
    );
  }

  // Force clear authentication state and browser cache
  clearAuth(): void {
    this.userSubject.next({ authenticated: false });
  }

  // Clear browser cache/cookies
  private clearBrowserCache(): void {
    // Clear all cookies for the current domain
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  }

  isAuthenticated(): boolean {
    const user = this.userSubject.value;
    return user && user.authenticated === true;
  }

  getUser(): any {
    return this.userSubject.value;
  }
}