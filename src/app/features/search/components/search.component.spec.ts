import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { SearchComponent } from './search.component';
import { SearchViewModel } from '../viewmodels/search.viewmodel';

describe('SearchComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:7102/' },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render search input', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="text"]')).not.toBeNull();
    expect(el.querySelector('button')).not.toBeNull();
  });

  it('should disable search button when input is empty', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.search__bar button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should inject SearchViewModel', () => {
    const vm = TestBed.inject(SearchViewModel);
    expect(vm).toBeTruthy();
    expect(vm.searchText()).toBe('');
  });

  it('should trigger search on Enter keydown', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);
    const searchSpy = vi.spyOn(vm, 'search').mockResolvedValue(undefined);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(searchSpy).toHaveBeenCalledOnce();
  });

  it('should not trigger search on non-Enter keydown', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);
    const searchSpy = vi.spyOn(vm, 'search').mockResolvedValue(undefined);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('should enable search button when input has text', async () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);

    vm.searchText.set('Vienna');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.search__bar button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('should show Clear button when hasSearched is true', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);

    // Before search, Clear button should not exist
    expect(fixture.nativeElement.querySelector('.search__clear')).toBeNull();

    vm.hasSearched.set(true);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.textContent).toContain('Clear');
  });

  it('should show "No tours found." when hasSearched is true but results empty', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);

    vm.hasSearched.set(true);
    vm.results.set([]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const emptyMsg = el.querySelector('.search__empty');
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg!.textContent).toContain('No tours found.');
  });

  it('should show search result items when results exist', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);

    vm.hasSearched.set(true);
    vm.results.set([
      { id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car', distance: 680000 },
      { id: 'tour-2', name: 'Paris Trip', description: '', from: 'Paris', to: 'Berlin', transportType: 'Bike', distance: 1050000 },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const resultButtons = el.querySelectorAll('.search__result');
    expect(resultButtons.length).toBe(2);
    expect(resultButtons[0].textContent).toContain('Vienna Tour');
    expect(resultButtons[1].textContent).toContain('Paris Trip');
    // "No tours found" should NOT be shown
    expect(el.querySelector('.search__empty')).toBeNull();
  });

  it('should call navigateToTour when result button clicked', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);

    const tour = { id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car' as const };
    vm.hasSearched.set(true);
    vm.results.set([tour]);
    fixture.detectChanges();

    // Mock to prevent real router navigation (no matching route configured)
    const navSpy = vi.spyOn(vm, 'navigateToTour').mockImplementation(() => {});
    const resultBtn = fixture.nativeElement.querySelector('.search__result') as HTMLButtonElement;
    resultBtn.click();

    expect(navSpy).toHaveBeenCalledOnce();
    expect(navSpy).toHaveBeenCalledWith(tour);
  });

  it('should call vm.clear when Clear button clicked', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    const vm = TestBed.inject(SearchViewModel);

    vm.hasSearched.set(true);
    fixture.detectChanges();

    const clearSpy = vi.spyOn(vm, 'clear');
    const clearBtn = fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement;
    clearBtn.click();

    expect(clearSpy).toHaveBeenCalledOnce();
  });
});
