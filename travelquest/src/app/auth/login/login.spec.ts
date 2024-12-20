import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service'; // Mock this service
import { of } from 'rxjs';

// Mock Router
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

// Mock AuthService
const mockAuthService = jasmine.createSpyObj('AuthService', ['signIn']);
mockAuthService.signIn.and.callFake((email: string, password: string) => {
  if (email === 'unittest@test.dk' && password === 'password123') {
    return Promise.resolve({
      user: {
        uid: 'wA6K9iaDePTZKzvmNfcyWQP1Z5D3',
        email: 'unittest@test.dk',
      },
    });
  }
  return Promise.reject(new Error('Invalid credentials'));
});

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
      ],
      declarations: [LoginComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }, // Inject mockAuthService
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockAuthService.signIn.calls.reset();
  });

  it('should log in with correct credentials', async () => {
    // Set form values to simulate valid login credentials
    component.form.setValue({
      email: 'unittest@test.dk',
      password: 'password123',
    });

    // Ensure form is valid
    expect(component.form.valid).toBeTrue();

    // Trigger form submission
    await component.onSubmit();

    // Check if the AuthService's signIn was called with correct values
    expect(mockAuthService.signIn).toHaveBeenCalledWith(
      'unittest@test.dk',
      'password123'
    );

    // Check if the router was called to navigate to the home page
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);

    // Ensure isSubmitting is reset
    expect(component.isSubmitting).toBeFalse();
  });

  it('should not call AuthService when form is invalid', async () => {
    // Set empty form values to make the form invalid
    component.form.setValue({
      email: '', // Invalid email
      password: '', // Invalid password
    });

    // Ensure form is invalid
    expect(component.form.invalid).toBeTrue();

    // Trigger form submission
    await component.onSubmit();

    // Check that AuthService.signIn was not called
    expect(mockAuthService.signIn).not.toHaveBeenCalled();

    // Ensure isSubmitting is reset
    expect(component.isSubmitting).toBeFalse();
  });

  it('should navigate to the register page when redirectToRegister is called', () => {
    // Call redirectToRegister
    component.redirectToRegister();

    // Verify the router navigates to the register page
    expect(mockRouter.navigate).toHaveBeenCalledWith(['auth/register']);
  });
});
