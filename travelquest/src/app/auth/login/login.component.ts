import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Custom service

@Component({
  selector: 'travelquest-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, // Use the custom AuthService
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return; // This ensures no further logic runs when the form is invalid

    const { email, password } = this.form.value;
    this.isSubmitting = true;

    try {
      await this.authService.signIn(email, password); // Use AuthService for signIn
      this.router.navigate(['/home']);
    } catch (error) {
      this.errorMessage = 'Invalid email or password';
    } finally {
      this.isSubmitting = false;
    }
  }

  clearError(): void {
    this.errorMessage = null;
  }

  redirectToRegister(): void {
    this.router.navigate(['auth/register']);
  }
}
