import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { AuthViewModel } from '../viewmodels/auth.viewmodel';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  const baseUrl = 'http://localhost:7102/';

  describe('form validation', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LoginPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
        ],
      }).compileComponents();
    });

    it('should create', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      expect(form.invalid).toBe(true);
    });

    it('should have valid form with email and password', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.setValue({ email: 'user@example.com', password: 'secret' });

      expect(form.valid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const vm = fixture.componentInstance['vm'];
      let loginCalled = false;
      vi.spyOn(vm, 'login').mockImplementation(async () => { loginCalled = true; });

      const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.click();

      expect(loginCalled).toBe(false);
    });

    it('should reject invalid email format', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      form.setValue({ email: 'not-an-email', password: 'secret' });

      expect(form.get('email')!.invalid).toBe(true);
      expect(form.invalid).toBe(true);
    });

    it('should have register link', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const link = el.querySelector('a[href="/register"]');
      expect(link).not.toBeNull();
    });

    it('should mark form as touched on invalid submit', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const form = fixture.componentInstance['form'];
      // Form is empty (invalid) — no values set
      fixture.componentInstance['submit']();

      expect(form.touched).toBe(true);
    });
  });

  describe('with mocked AuthViewModel', () => {
    const loginMock = vi.fn();

    beforeEach(async () => {
      loginMock.mockResolvedValue(undefined);
      await TestBed.configureTestingModule({
        imports: [LoginPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
          {
            provide: AuthViewModel,
            useValue: {
              login: loginMock,
              register: vi.fn(),
              isLoading: signal(false),
              errorMessage: signal(null),
            },
          },
        ],
      }).compileComponents();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call vm.login with form values on valid submit', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      fixture.componentInstance['form'].setValue({ email: 'user@example.com', password: 'secret' });
      fixture.componentInstance['submit']();

      expect(loginMock).toHaveBeenCalledOnce();
      expect(loginMock).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret' });
    });

    it('should show "Login" text when isLoading is false', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.textContent!.trim()).toBe('Login');
    });
  });

  describe('loading state', () => {
    const isLoadingSignal = signal(true);

    beforeEach(async () => {
      isLoadingSignal.set(true);
      await TestBed.configureTestingModule({
        imports: [LoginPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
          {
            provide: AuthViewModel,
            useValue: {
              login: vi.fn(),
              register: vi.fn(),
              isLoading: isLoadingSignal,
              errorMessage: signal(null),
            },
          },
        ],
      }).compileComponents();
    });

    it('should show "Logging in..." text when isLoading is true', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.textContent!.trim()).toBe('Logging in...');
    });

    it('should disable submit button when isLoading is true', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });
  });

  describe('error message display', () => {
    const errorSignal = signal<string | null>(null);

    beforeEach(async () => {
      errorSignal.set(null);
      await TestBed.configureTestingModule({
        imports: [LoginPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
          {
            provide: AuthViewModel,
            useValue: {
              login: vi.fn(),
              register: vi.fn(),
              isLoading: signal(false),
              errorMessage: errorSignal,
            },
          },
        ],
      }).compileComponents();
    });

    it('should show error message when vm.errorMessage is set', () => {
      errorSignal.set('Invalid email or password.');

      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const errorEl = el.querySelector('.auth-page__error');
      expect(errorEl).not.toBeNull();
      expect(errorEl!.textContent).toContain('Invalid email or password.');
    });

    it('should not show error message when vm.errorMessage is null', () => {
      const fixture = TestBed.createComponent(LoginPageComponent);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.auth-page__error')).toBeNull();
    });
  });
});
