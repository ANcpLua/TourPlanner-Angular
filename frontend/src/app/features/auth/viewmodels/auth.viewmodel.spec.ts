import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { AuthViewModel } from './auth.viewmodel';
import { AuthState } from '../../../core/auth/auth-state.service';
import type { LoginRequest, RegisterRequest, UserInfo } from '../models/auth.model';

describe('AuthViewModel', () => {
  let vm: AuthViewModel;
  let authState: AuthState;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:7102/';

  const sampleUser: UserInfo = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const loginRequest: LoginRequest = {
    email: 'test@example.com',
    password: 'secret',
  };

  const registerRequest: RegisterRequest = {
    email: 'new@example.com',
    password: 'password123',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    vm = TestBed.inject(AuthViewModel);
    authState = TestBed.inject(AuthState);
    httpTesting = TestBed.inject(HttpTestingController);

    // Stub router.navigate so missing routes don't throw and hit the catch block
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpTesting.verify());

  it('should start with empty state', () => {
    expect(vm.isLoading()).toBe(false);
    expect(vm.errorMessage()).toBeNull();
  });

  it('login should set user and navigate on success', async () => {
    const promise = vm.login(loginRequest);
    httpTesting.expectOne(`${baseUrl}api/auth/login`).flush(sampleUser);
    await promise;

    expect(vm.isLoading()).toBe(false);
    expect(vm.errorMessage()).toBeNull();
    expect(authState.isAuthenticated()).toBe(true);
    expect(authState.currentUser()).toEqual(sampleUser);
  });

  it('login should set error on failure', async () => {
    const promise = vm.login(loginRequest);
    httpTesting.expectOne(`${baseUrl}api/auth/login`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.isLoading()).toBe(false);
    expect(vm.errorMessage()).toBe('Invalid email or password.');
    expect(authState.isAuthenticated()).toBe(false);
  });

  it('register should register then auto-login on success', async () => {
    const promise = vm.register(registerRequest);

    // Flush register; the auto-login HTTP call is made after register resolves,
    // so yield the microtask queue before expecting the login request.
    httpTesting.expectOne(`${baseUrl}api/auth/register`).flush(null);
    await Promise.resolve();
    httpTesting.expectOne(`${baseUrl}api/auth/login`).flush(sampleUser);
    await promise;

    expect(vm.isLoading()).toBe(false);
    expect(vm.errorMessage()).toBeNull();
    expect(authState.isAuthenticated()).toBe(true);
    expect(authState.currentUser()).toEqual(sampleUser);
  });

  it('register should set error on failure', async () => {
    const promise = vm.register(registerRequest);
    httpTesting.expectOne(`${baseUrl}api/auth/register`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.isLoading()).toBe(false);
    expect(vm.errorMessage()).toBe('Registration failed. Email may already be in use.');
    expect(authState.isAuthenticated()).toBe(false);
  });
});
