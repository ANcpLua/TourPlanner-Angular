import { TestBed } from '@angular/core/testing';
import { SearchComponent } from './search.component';
import { Tour } from '../../tours/models/tour.model';

describe('SearchComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should render search input with searchText value', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('searchText', 'Vienna');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('Vienna');
  });

  it('should emit searchTextChange on input', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.searchTextChange.subscribe((v: string) => emitted.push(v));

    const input = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = 'Paris';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(emitted).toEqual(['Paris']);
  });

  it('should emit search on button click', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('searchText', 'Vienna');
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.search.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('.search__bar button') as HTMLButtonElement;
    btn.click();

    expect(emitted).toBe(true);
  });

  it('should emit search on Enter keydown', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.search.subscribe(() => (emitted = true));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(emitted).toBe(true);
  });

  it('should show clear button when hasSearched is true', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('hasSearched', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.search__clear')).toBeNull();

    fixture.componentRef.setInput('hasSearched', true);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.textContent).toContain('Clear');
  });

  it('should emit clear on clear button click', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('hasSearched', true);
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.clear.subscribe(() => (emitted = true));

    const clearBtn = fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement;
    clearBtn.click();

    expect(emitted).toBe(true);
  });

  it('should show results when hasSearched and results are provided', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('hasSearched', true);
    fixture.componentRef.setInput('results', [
      { id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car', distance: 680000 },
      { id: 'tour-2', name: 'Paris Trip', description: '', from: 'Paris', to: 'Berlin', transportType: 'Bike', distance: 1050000 },
    ] satisfies Tour[]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const resultButtons = el.querySelectorAll('.search__result');
    expect(resultButtons.length).toBe(2);
    expect(resultButtons[0].textContent).toContain('Vienna Tour');
    expect(resultButtons[1].textContent).toContain('Paris Trip');
    expect(el.querySelector('.search__empty')).toBeNull();
  });

  it('should emit navigateToTour when result is clicked', () => {
    const tour: Tour = { id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car' };

    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('hasSearched', true);
    fixture.componentRef.setInput('results', [tour]);
    fixture.detectChanges();

    const emitted: Tour[] = [];
    fixture.componentInstance.navigateToTour.subscribe((t: Tour) => emitted.push(t));

    const resultBtn = fixture.nativeElement.querySelector('.search__result') as HTMLButtonElement;
    resultBtn.click();

    expect(emitted).toEqual([tour]);
  });

  it('should show "No tours found" when hasSearched but results are empty', () => {
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.componentRef.setInput('hasSearched', true);
    fixture.componentRef.setInput('results', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const emptyMsg = el.querySelector('.search__empty');
    expect(emptyMsg).not.toBeNull();
    expect(emptyMsg!.textContent).toContain('No tours found.');
  });
});
