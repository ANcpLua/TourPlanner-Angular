import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { authGuard } from './auth.guard';
import { AuthState } from './auth-state.service';

describe('authGuard', () => {
  const baseUrl = 'http://localhost:7102/';

  let authState: AuthState;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    authState = TestBed.inject(AuthState);
    router = TestBed.inject(Router);
  });

  afterEach(() => vi.restoreAllMocks());

  it('should allow access when authenticated', async () => {
    authState.setUser({ id: 'user-1', email: 'user@example.com' });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('should skip session check when already authenticated', async () => {
    vi.spyOn(authState, 'checkSession').mockResolvedValue(undefined);
    authState.setUser({ id: 'user-1', email: 'user@example.com' });

    await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(authState.checkSession).not.toHaveBeenCalled();
  });

  it('should redirect to /login when session check fails', async () => {
    vi.spyOn(authState, 'checkSession').mockImplementation(async () => {
      // session check fails — user stays unauthenticated
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(authState.checkSession).toHaveBeenCalled();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('should allow access after successful session check', async () => {
    vi.spyOn(authState, 'checkSession').mockImplementation(async () => {
      authState.setUser({ id: 'user-1', email: 'user@example.com' });
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(authState.checkSession).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
