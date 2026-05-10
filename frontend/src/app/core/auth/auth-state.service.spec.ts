import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthState } from './auth-state.service';
import type { UserInfo } from '../../features/auth/models/auth.model';

describe('AuthState', () => {
  let state: AuthState;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  const sampleUser: UserInfo = {
    id: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    state = TestBed.inject(AuthState);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should start unauthenticated with no loading or error', () => {
    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
    expect(state.isLoading()).toBe(false);
    expect(state.errorMessage()).toBeNull();
  });

  it('setUser should set user, mark authenticated, and clear errorMessage', async () => {
    // Seed an error so we can assert setUser clears it
    const failed = state.logout();
    httpTesting.expectOne(`${baseUrl}api/auth/logout`).error(new ProgressEvent('error'));
    await failed;
    expect(state.errorMessage()).not.toBeNull();

    state.setUser(sampleUser);

    expect(state.isAuthenticated()).toBe(true);
    expect(state.currentUser()).toEqual(sampleUser);
    expect(state.errorMessage()).toBeNull();
  });

  it('clear should reset user and unauthenticate', () => {
    state.setUser(sampleUser);
    state.clear();

    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
  });

  describe('checkSession', () => {
    it('should toggle isLoading during the request', async () => {
      const promise = state.checkSession();
      expect(state.isLoading()).toBe(true);

      httpTesting.expectOne(`${baseUrl}api/auth/me`).flush(sampleUser);
      await promise;

      expect(state.isLoading()).toBe(false);
    });

    it('should set user on success', async () => {
      const promise = state.checkSession();
      httpTesting.expectOne(`${baseUrl}api/auth/me`).flush(sampleUser);
      await promise;

      expect(state.isAuthenticated()).toBe(true);
      expect(state.currentUser()).toEqual(sampleUser);
      expect(state.errorMessage()).toBeNull();
    });

    it('should clear user on failure without surfacing an error message', async () => {
      state.setUser(sampleUser);

      const promise = state.checkSession();
      httpTesting.expectOne(`${baseUrl}api/auth/me`).error(new ProgressEvent('error'));
      await promise;

      expect(state.isAuthenticated()).toBe(false);
      expect(state.currentUser()).toBeNull();
      expect(state.isLoading()).toBe(false);
      expect(state.errorMessage()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should toggle isLoading during the request', async () => {
      state.setUser(sampleUser);

      const promise = state.logout();
      expect(state.isLoading()).toBe(true);

      httpTesting.expectOne(`${baseUrl}api/auth/logout`).flush(null);
      await promise;

      expect(state.isLoading()).toBe(false);
    });

    it('should call API, clear user on success, and leave errorMessage null', async () => {
      state.setUser(sampleUser);

      const promise = state.logout();
      httpTesting.expectOne(`${baseUrl}api/auth/logout`).flush(null);
      await promise;

      expect(state.isAuthenticated()).toBe(false);
      expect(state.currentUser()).toBeNull();
      expect(state.errorMessage()).toBeNull();
    });

    it('should still clear user and surface errorMessage when API call fails', async () => {
      state.setUser(sampleUser);

      const promise = state.logout();
      httpTesting.expectOne(`${baseUrl}api/auth/logout`).error(new ProgressEvent('error'));
      await promise;

      expect(state.isAuthenticated()).toBe(false);
      expect(state.currentUser()).toBeNull();
      expect(state.isLoading()).toBe(false);
      expect(state.errorMessage()).toBe(
        'Could not reach the server. You have been signed out locally.',
      );
    });

    it('should clear a pre-existing errorMessage at the start of a new logout', async () => {
      state.setUser(sampleUser);

      // First logout fails and leaves an errorMessage
      const failed = state.logout();
      httpTesting.expectOne(`${baseUrl}api/auth/logout`).error(new ProgressEvent('error'));
      await failed;
      expect(state.errorMessage()).not.toBeNull();

      // Re-authenticate and retry
      state.setUser(sampleUser);
      const succeeded = state.logout();
      httpTesting.expectOne(`${baseUrl}api/auth/logout`).flush(null);
      await succeeded;

      expect(state.errorMessage()).toBeNull();
    });
  });

  describe('public API immutability', () => {
    // Angular's `signal(...).asReadonly()` returns an accessor without a
    // `.set` method at runtime. These checks confirm the public projections
    // can't be mutated by consumers — both the TS type and the runtime
    // shape lack the writable API.
    it('exposes currentUser, isLoading, errorMessage as read-only Signals', () => {
      const asAny = (s: unknown) => s as Record<string, unknown>;
      expect(asAny(state.currentUser)['set']).toBeUndefined();
      expect(asAny(state.currentUser)['update']).toBeUndefined();
      expect(asAny(state.isLoading)['set']).toBeUndefined();
      expect(asAny(state.isLoading)['update']).toBeUndefined();
      expect(asAny(state.errorMessage)['set']).toBeUndefined();
      expect(asAny(state.errorMessage)['update']).toBeUndefined();
    });
  });
});
