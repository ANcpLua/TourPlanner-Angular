import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { SearchViewModel } from './search.viewmodel';

describe('SearchViewModel', () => {
  let vm: SearchViewModel;
  let httpTesting: HttpTestingController;
  let router: Router;
  const baseUrl = 'http://localhost:7102/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    });

    vm = TestBed.inject(SearchViewModel);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  it('should start with empty state', () => {
    expect(vm.searchText()).toBe('');
    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(false);
  });

  it('should search and update results', async () => {
    vm.searchText.set('Vienna');
    const promise = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([
      { id: 'tour-1', name: 'Vienna Tour', from: 'Vienna', to: 'Berlin' },
    ]);
    await promise;

    expect(vm.results()).toHaveLength(1);
    expect(vm.hasSearched()).toBe(true);
  });

  it('should not search with empty text', async () => {
    vm.searchText.set('  ');
    await vm.search();
    expect(vm.hasSearched()).toBe(false);
  });

  it('should set empty results and mark hasSearched on API error', async () => {
    vm.searchText.set('Vienna');
    const promise = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(true);
  });

  it('should allow re-search after clear', async () => {
    vm.searchText.set('Vienna');
    const p1 = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([{ id: '1', name: 'T', from: 'A', to: 'B' }]);
    await p1;

    vm.clear();
    expect(vm.hasSearched()).toBe(false);
    expect(vm.results()).toEqual([]);

    vm.searchText.set('Berlin');
    const p2 = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Berlin`).flush([{ id: '2', name: 'B', from: 'C', to: 'D' }]);
    await p2;

    expect(vm.hasSearched()).toBe(true);
    expect(vm.results()).toHaveLength(1);
  });

  it('should clear search state', () => {
    vm.searchText.set('test');
    vm.hasSearched.set(true);
    vm.results.set([{ id: '1', name: 'T', description: '', from: 'A', to: 'B', transportType: 'Car' }]);

    vm.clear();

    expect(vm.searchText()).toBe('');
    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(false);
  });

  it('should navigate to tour and clear search state', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    vm.searchText.set('Vienna');
    vm.results.set([{ id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car' }]);
    vm.hasSearched.set(true);

    const tour = { id: 'tour-1', name: 'Vienna Tour', description: '', from: 'Vienna', to: 'Berlin', transportType: 'Car' } as const;
    vm.navigateToTour(tour);

    expect(navigateSpy).toHaveBeenCalledWith(['/tours'], { queryParams: { tourId: 'tour-1' } });
    expect(vm.searchText()).toBe('');
    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(false);
  });
});
