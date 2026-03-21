import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppNavbarComponent } from './app-navbar.component';
import { AuthState } from '../../core/auth/auth-state.service';

describe('AppNavbarComponent', () => {
  let authState: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    authState = {
      isAuthenticated: vi.fn(() => false),
      currentUser: vi.fn(() => null),
      logout: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [AppNavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthState, useValue: authState },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal('location', { href: '' });
  });

  it('should hide nav links when not authenticated', () => {
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav.navbar__links');
    expect(nav).toBeNull();
  });

  it('should show nav links when authenticated', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    authState['currentUser'].mockReturnValue({ id: 'u1', email: 'user@example.com' });
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav.navbar__links');
    expect(nav).not.toBeNull();
  });

  it('should show user email when authenticated', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    authState['currentUser'].mockReturnValue({ id: 'u1', email: 'user@example.com' });
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.navbar__user span') as HTMLSpanElement;
    expect(span.textContent?.trim()).toBe('user@example.com');
  });

  it('should render empty email span when authenticated but currentUser is null', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    authState['currentUser'].mockReturnValue(null);
    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.navbar__user span') as HTMLSpanElement;
    expect(span.textContent?.trim()).toBe('');
  });

  it('should call authState.logout and redirect on logout click', async () => {
    authState['isAuthenticated'].mockReturnValue(true);
    authState['currentUser'].mockReturnValue({ id: 'u1', email: 'user@example.com' });

    const fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.navbar__logout') as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();

    expect(authState['logout']).toHaveBeenCalled();
    expect(location.href).toBe('/login');
  });
});
