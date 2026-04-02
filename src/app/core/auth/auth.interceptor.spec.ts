import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BROWSER_LOCATION, BrowserLocation } from '../browser/browser-location.token';
import { API_BASE_URL } from '../config/api-base-url.token';
import { authInterceptor } from './auth.interceptor';
import { AuthState } from './auth-state.service';

describe('authInterceptor', () => {
  const baseUrl = 'http://localhost:7102/';
  const testUrl = `${baseUrl}api/tours`;
  const authUrl = `${baseUrl}api/auth/me`;

  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authState: AuthState;
  let location: BrowserLocation;

  beforeEach(() => {
    location = {
      assign: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
        { provide: BROWSER_LOCATION, useValue: location },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthState);
  });

  afterEach(() => httpTesting.verify());

  it('should add withCredentials to requests', () => {
    http.get(testUrl).subscribe();

    const req = httpTesting.expectOne(testUrl);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should pass through successful responses', () => {
    let responseData: unknown;
    http.get(testUrl).subscribe((data) => (responseData = data));

    const req = httpTesting.expectOne(testUrl);
    req.flush({ ok: true });

    expect(responseData).toEqual({ ok: true });
  });

  it('should clear auth state on 401 for non-auth URLs', () => {
    authState.setUser({ id: 'user-1', email: 'user@example.com' });
    expect(authState.isAuthenticated()).toBe(true);

    vi.spyOn(authState, 'clear');

    // suppress the unhandled error from the observable
    http.get(testUrl).subscribe({ error: () => {} });

    const req = httpTesting.expectOne(testUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authState.clear).toHaveBeenCalled();
    expect(location.assign).toHaveBeenCalledWith('/login');
  });

  it('should not clear auth state on 401 for auth URLs', () => {
    authState.setUser({ id: 'user-1', email: 'user@example.com' });

    vi.spyOn(authState, 'clear');

    http.get(authUrl).subscribe({ error: () => {} });

    const req = httpTesting.expectOne(authUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authState.clear).not.toHaveBeenCalled();
    expect(location.assign).not.toHaveBeenCalled();
  });
});
