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
    // Redirect to Spring Boot OAuth2 login endpoint
    window.location.href = 'http://localhost:8080/oauth2/authorization/azure';
  }

  // Custom login with username/password
  customLogin(username: string, password: string): Observable<any> {
    const loginData = {
      email: username, // Backend expects email field
      password: password
    };

    return this.http.post(`${this.customLoginUrl}/signin`, loginData, { 
      withCredentials: true,
      observe: 'response'
    }).pipe(
      tap((response) => {
        console.log('Custom login successful:', response);
        // Force a delay to ensure cookie is set before checking auth status
        setTimeout(() => {
          this.checkAuthStatus();
        }, 100);
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
    const isJwtUser = currentUser && !currentUser.user?.id?.includes('oauth'); // Simple check
    
    const logoutUrl = isJwtUser ? 
      `${this.customLoginUrl}/logout` : 
      `${this.apiUrl}/logout`;
    
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

  // Alternative logout method that tries multiple endpoints
  logoutComplete(): Observable<any> {
    // Clear state immediately
    this.userSubject.next({ authenticated: false });
    
    // Try both JWT and OAuth2 logout endpoints
    const jwtLogout = this.http.post(`${this.customLoginUrl}/logout`, {}, { 
      withCredentials: true,
      observe: 'response',
      responseType: 'json'
    });
    
    const apiLogout = this.http.post(`${this.apiUrl}/logout`, {}, { 
      withCredentials: true,
      observe: 'response',
      responseType: 'json'
    });
    
    const springLogout = this.http.post('http://localhost:8080/logout', {}, { 
      withCredentials: true,
      observe: 'response',
      responseType: 'json'
    });
    
    // Try JWT logout first, then API logout, then Spring logout
    return jwtLogout.pipe(
      catchError(() => {
        console.log('JWT logout failed, trying API logout...');
        return apiLogout;
      }),
      catchError(() => {
        console.log('API logout failed, trying Spring logout...');
        return springLogout;
      }),
      catchError((error) => {
        console.error('All logout attempts failed:', error);
        // Still return success since we cleared the client state
        return of({ message: 'Logout completed (client-side cleared)' });
      }),
      tap(() => {
        // Final cleanup
        this.userSubject.next({ authenticated: false });
      })
    );
  }

  // Force clear authentication state
  clearAuth(): void {
    this.userSubject.next({ authenticated: false });
  }

  isAuthenticated(): boolean {
    const user = this.userSubject.value;
    return user && user.authenticated === true;
  }

  getUser(): any {
    return this.userSubject.value;
  }
}