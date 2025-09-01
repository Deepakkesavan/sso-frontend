import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../../services/auth-service.service';
import { Router } from '@angular/router';

interface SignupData {
  username: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'], // fixed here
})
export class SignupComponent {
  errorMessage = '';
  successMessage = '';
  loading = false;

  signupData: SignupData = {
    username: '',
    email: '',
    password: '',
  };

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  signup(): void {
    if (
      !this.signupData.username ||
      !this.signupData.email ||
      !this.signupData.password
    ) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // this.authService.signup(this.signupData).subscribe({
    //   next: (response) => {
    //     this.loading = false;
    //     console.log('Signup successful:', response);
    //     this.successMessage = 'Account created successfully! Redirecting to login...';

    //     // Redirect to login after 2 seconds
    //     setTimeout(() => this.router.navigate(['/login']), 2000);
    //   },
    //   error: (error: { error?: { error: string }; status: number }) => {
    //     this.loading = false;
    //     console.error('Signup failed:', error);

    //     if (error.error?.error) {
    //       this.errorMessage = error.error.error;
    //     } else if (error.status === 400) {
    //       this.errorMessage =
    //         'Email or username already exists. Please try with different credentials.';
    //     } else {
    //       this.errorMessage = 'Signup failed. Please try again.';
    //     }
    //   },
    // });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
