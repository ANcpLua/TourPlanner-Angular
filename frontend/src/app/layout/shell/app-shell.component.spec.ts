import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { AuthState } from '../../core/auth/auth-state.service';
import { SearchViewModel } from '../../features/search/viewmodels/search.viewmodel';

describe('AppShellComponent', () => {
  let authState: Record<string, ReturnType<typeof vi.fn>>;
  let searchVm: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    authState = {
      isAuthenticated: vi.fn(() => false),
      currentUser: vi.fn(() => null),
      logout: vi.fn(() => Promise.resolve()),
    };

    searchVm = {
      searchText: vi.fn(() => ''),
      results: vi.fn(() => []),
      hasSearched: vi.fn(() => false),
      search: vi.fn(),
      clear: vi.fn(),
      navigateToTour: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthState, useValue: authState },
        { provide: SearchViewModel, useValue: searchVm },
      ],
    }).compileComponents();
  });

  it('should render navbar', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const navbar = fixture.nativeElement.querySelector('app-navbar');
    expect(navbar).not.toBeNull();
  });

  it('should NOT render search when not authenticated', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector('app-search');
    expect(search).toBeNull();
  });

  it('should render search when authenticated', () => {
    authState['isAuthenticated'].mockReturnValue(true);

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const search = fixture.nativeElement.querySelector('app-search');
    expect(search).not.toBeNull();
  });

  it('should bind searchVm signals to search component inputs', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    searchVm['searchText'].mockReturnValue('Vienna');
    searchVm['results'].mockReturnValue([]);
    searchVm['hasSearched'].mockReturnValue(true);

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('Vienna');
  });

  it('should call searchVm.search when search is emitted', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    searchVm['searchText'].mockReturnValue('test');

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.search__bar button') as HTMLButtonElement;
    btn.click();

    expect(searchVm['search']).toHaveBeenCalled();
  });

  it('should call searchVm.clear when clear is emitted', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    searchVm['hasSearched'].mockReturnValue(true);

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement;
    clearBtn.click();

    expect(searchVm['clear']).toHaveBeenCalled();
  });

  it('should call searchVm.navigateToTour when navigateToTour is emitted', () => {
    const tour = { id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car' };
    authState['isAuthenticated'].mockReturnValue(true);
    searchVm['hasSearched'].mockReturnValue(true);
    searchVm['results'].mockReturnValue([tour]);

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const resultBtn = fixture.nativeElement.querySelector('.search__result') as HTMLButtonElement;
    resultBtn.click();

    expect(searchVm['navigateToTour']).toHaveBeenCalledWith(tour);
  });

  it('should update searchVm.searchText when searchTextChange is emitted', () => {
    authState['isAuthenticated'].mockReturnValue(true);
    const setText = vi.fn();
    Object.assign(searchVm['searchText'], { set: setText });

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = 'Paris';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(setText).toHaveBeenCalledWith('Paris');
  });
});
