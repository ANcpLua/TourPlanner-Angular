import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  const baseUrl = 'http://localhost:7102/';

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
});
