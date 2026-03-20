import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
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
});
