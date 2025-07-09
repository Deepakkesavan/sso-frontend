import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();
  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }
  checkAuthStatus(): void {
    this.http.get(`${this.apiUrl}/user`, { withCredentials: true })
      .subscribe({
        next: (user) => {
          this.userSubject.next(user);
        },
        error: (error) => {
          console.log('Not authenticated:', error);
          this.userSubject.next({ authenticated: false });
        }
      });
  }
  login(): void {
    // Redirect to Spring Boot OAuth2 login endpoint
    window.location.href = 'http://localhost:8080/oauth2/authorization/azure';
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  isAuthenticated(): boolean {
    const user = this.userSubject.value;
    return user && user.authenticated === true;
  }

  getUser(): any {
    return this.userSubject.value;
  }
}
