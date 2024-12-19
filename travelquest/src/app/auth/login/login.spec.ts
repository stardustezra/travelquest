import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

// Mock dependencies
class MockAuth {
  signInWithEmailAndPassword = jasmine.createSpy('signInWithEmailAndPassword');
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: MockAuth;
  let router: MockRouter;

  beforeEach(() => {
    auth = new MockAuth();
    router = new MockRouter();

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule],
      declarations: [LoginComponent],
      providers: [
        FormBuilder,
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the LoginComponent', () => {
    expect(component).toBeTruthy();
  });

  describe('Login functionality', () => {
    it('should log in with correct credentials', async () => {
      // Mock form values
      component.form.setValue({
        email: 'unittest@test.dk',
        password: 'password123',
      });

      // Mock successful sign-in
      auth.signInWithEmailAndPassword.and.returnValue(Promise.resolve());

      // Call onSubmit method
      await component.onSubmit();

      // Check if the navigate function was called with the correct path
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
      expect(component.isSubmitting).toBe(false);
      expect(component.errorMessage).toBeNull();
    });

    it('should show error message with incorrect credentials', async () => {
      // Mock form values
      component.form.setValue({
        email: 'unittest@test.dk',
        password: 'password123',
      });

      // Mock failed sign-in (error response)
      const error = { message: 'Invalid email or password' };
      auth.signInWithEmailAndPassword.and.returnValue(Promise.reject(error));

      // Call onSubmit method
      await component.onSubmit();

      // Check if the error message is set
      expect(component.errorMessage).toBe('Invalid email or password');
      expect(component.isSubmitting).toBe(false);
    });

    it('should not submit if form is invalid', async () => {
      // Set an invalid form (missing email or password)
      component.form.setValue({
        email: '',
        password: '',
      });

      // Call onSubmit method
      await component.onSubmit();

      // Expect the sign-in method to not be called
      expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });
  });
});
