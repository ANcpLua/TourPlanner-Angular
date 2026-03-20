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
});
