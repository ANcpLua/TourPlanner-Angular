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

  it('should start unauthenticated', () => {
    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
  });

  it('should set user and become authenticated', () => {
    state.setUser(sampleUser);

    expect(state.isAuthenticated()).toBe(true);
    expect(state.currentUser()).toEqual(sampleUser);
  });

  it('should clear user and become unauthenticated', () => {
    state.setUser(sampleUser);
    state.clear();

    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
  });

  it('checkSession should set user on success', async () => {
    const promise = state.checkSession();
    httpTesting.expectOne(`${baseUrl}api/auth/me`).flush(sampleUser);
    await promise;

    expect(state.isAuthenticated()).toBe(true);
    expect(state.currentUser()).toEqual(sampleUser);
  });

  it('checkSession should clear user on failure', async () => {
    state.setUser(sampleUser);

    const promise = state.checkSession();
    httpTesting.expectOne(`${baseUrl}api/auth/me`).error(new ProgressEvent('error'));
    await promise;

    expect(state.isAuthenticated()).toBe(false);
    expect(state.currentUser()).toBeNull();
  });
});
