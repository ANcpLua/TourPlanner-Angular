import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthApiService } from './auth-api.service';
import type { LoginRequest, RegisterRequest, UserInfo } from '../../features/auth/models/auth.model';

describe('AuthApiService', () => {
  let service: AuthApiService;
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
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    service = TestBed.inject(AuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should call POST /api/auth/register with request body', () => {
    service.register(registerRequest).subscribe();

    const req = httpTesting.expectOne(`${baseUrl}api/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(null);
  });

  it('should call POST /api/auth/login and return UserInfo', () => {
    service.login(loginRequest).subscribe((user) => {
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(sampleUser);
  });

  it('should call POST /api/auth/logout', () => {
    service.logout().subscribe();

    const req = httpTesting.expectOne(`${baseUrl}api/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should call GET /api/auth/me and return UserInfo', () => {
    service.me().subscribe((user) => {
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
    });

    const req = httpTesting.expectOne(`${baseUrl}api/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(sampleUser);
  });
});
