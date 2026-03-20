import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { AuthViewModel } from '../viewmodels/auth.viewmodel';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  const baseUrl = 'http://localhost:7102/';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    expect(form.invalid).toBe(true);
  });

  it('should reject password shorter than 6 characters', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.setValue({ email: 'user@example.com', password: 'abc' });

    expect(form.get('password')!.invalid).toBe(true);
    expect(form.invalid).toBe(true);
  });

  it('should have valid form with email and valid password', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    form.setValue({ email: 'user@example.com', password: 'secure1' });

    expect(form.valid).toBe(true);
  });

  it('should have login link', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('a[href="/login"]');
    expect(link).not.toBeNull();
  });

  it('should mark form as touched on invalid submit', () => {
    const fixture = TestBed.createComponent(RegisterPageComponent);
    fixture.detectChanges();

    const form = fixture.componentInstance['form'];
    // Form is empty (invalid) — no values set
    fixture.componentInstance['submit']();

    expect(form.touched).toBe(true);
  });

  describe('with mocked AuthViewModel', () => {
    const registerMock = vi.fn();

    beforeEach(async () => {
      registerMock.mockResolvedValue(undefined);
      await TestBed.configureTestingModule({
        imports: [RegisterPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
          {
            provide: AuthViewModel,
            useValue: {
              login: vi.fn(),
              register: registerMock,
              isLoading: signal(false),
              errorMessage: signal(null),
            },
          },
        ],
      }).compileComponents();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call vm.register with form values on valid submit', () => {
      const fixture = TestBed.createComponent(RegisterPageComponent);
      fixture.detectChanges();

      fixture.componentInstance['form'].setValue({ email: 'user@example.com', password: 'secure1' });
      fixture.componentInstance['submit']();

      expect(registerMock).toHaveBeenCalledOnce();
      expect(registerMock).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secure1' });
    });
  });
});
