import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-login',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  //   standalone: true,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  form: FormGroup = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]], // Adds email validation
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Register form submitted:', this.form.value);
      // Implement registration logic here, for example:
      // this.http.post('API_URL', this.form.value).subscribe(
      //   response => this.router.navigate(['/login']),
      //   error => console.error('Registration error:', error)
      // );
    } else {
      console.log('Register form is invalid');
    }
  }
}
