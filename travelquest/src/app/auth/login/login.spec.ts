import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Animation module import
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // Import this for disabling animations

// Firebase imports
import { signInWithEmailAndPassword } from '@angular/fire/auth';

// Mocking signInWithEmailAndPassword from Firebase
const mockSignInWithEmailAndPassword = jasmine.createSpy(
  'signInWithEmailAndPassword'
);

// Mocking Angular's Router
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: Auth;

  beforeEach(() => {
    // Mock the Auth service
    auth = {} as Auth;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: mockRouter },
        {
          provide: signInWithEmailAndPassword,
          useValue: mockSignInWithEmailAndPassword,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the LoginComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if the form is invalid', async () => {
    // Set the form values as invalid
    component.form.setValue({
      email: 'invalidemail',
      password: '123',
    });

    await component.onSubmit();

    // The form should not submit, so signInWithEmailAndPassword should not be called
    expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMessage).toBeNull(); // No error message yet as the form is invalid
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // Router should not be called
  });

  it('should log in with correct credentials', async () => {
    // Mock valid form values
    component.form.setValue({
      email: 'testuser@example.com',
      password: 'correctpassword',
    });

    // Mock a successful response from signInWithEmailAndPassword
    mockSignInWithEmailAndPassword.and.returnValue(
      Promise.resolve({ user: {} })
    );

    await component.onSubmit();

    // Verify signInWithEmailAndPassword was called with the correct values
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'testuser@example.com',
      'correctpassword'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMessage).toBeNull(); // No error after successful login
  });

  it('should show error message with incorrect credentials', async () => {
    // Mock form values for incorrect credentials
    component.form.setValue({
      email: 'testuser@example.com',
      password: 'wrongpassword',
    });

    // Mock an error response from signInWithEmailAndPassword
    mockSignInWithEmailAndPassword.and.returnValue(
      Promise.reject(new Error('Invalid email or password'))
    );

    await component.onSubmit();

    // Verify that the error message is set
    expect(component.errorMessage).toBe('Invalid email or password');
    expect(component.isSubmitting).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalled(); // Router navigate should not be called on failure
  });

  it('should clear error when clearError is called', () => {
    // Set an error message
    component.errorMessage = 'Some error occurred';

    // Call clearError() to clear the error
    component.clearError();

    // Verify that the error message is cleared
    expect(component.errorMessage).toBeNull();
  });

  it('should redirect to register page when redirectToRegister is called', () => {
    // Call the redirectToRegister method
    component.redirectToRegister();

    // Verify that the router navigates to the registration page
    expect(mockRouter.navigate).toHaveBeenCalledWith(['auth/register']);
  });
});
