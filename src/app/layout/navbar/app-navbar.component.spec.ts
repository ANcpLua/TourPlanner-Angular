import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/config/api-base-url.token';
import { AppNavbarComponent } from './app-navbar.component';
import { AuthState } from '../../core/auth/auth-state.service';

describe('AppNavbarComponent', () => {
  let authState: AuthState;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    }).compileComponents();

    authState = TestBed.inject(AuthState);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should hide nav links when not authenticated', () => {
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav.navbar__links');
    expect(nav).toBeNull();
  });

  it('should show nav links when authenticated', () => {
    authState.setUser({ id: 'u1', email: 'user@example.com' });
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav.navbar__links');
    expect(nav).not.toBeNull();
  });

  it('should show user email when authenticated', () => {
    authState.setUser({ id: 'u1', email: 'user@example.com' });
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.navbar__user span') as HTMLSpanElement;
    expect(span.textContent?.trim()).toBe('user@example.com');
  });

  it('should call logout API, clear auth state, and redirect on logout click', async () => {
    authState.setUser({ id: 'u1', email: 'user@example.com' });
    vi.stubGlobal('location', { href: '' });

    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.navbar__logout') as HTMLButtonElement;
    btn.click();

    // Flush the POST /api/auth/logout request.
    httpTesting.expectOne(`${baseUrl}api/auth/logout`).flush(null);
    await fixture.whenStable();

    expect(authState.isAuthenticated()).toBe(false);
    expect(location.href).toBe('/login');

    vi.unstubAllGlobals();
  });
});
