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

  const sampleTour = {
    id: 'tour-1',
    name: 'Vienna Tour',
    description: '',
    from: 'Vienna',
    to: 'Berlin',
    transportType: 'Car',
  } as const;

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
    expect(vm.isLoading()).toBe(false);
    expect(vm.errorMessage()).toBeNull();
  });

  it('should update searchText through setSearchText', () => {
    vm.setSearchText('Vienna');
    expect(vm.searchText()).toBe('Vienna');
  });

  it('should toggle isLoading during search', async () => {
    vm.setSearchText('Vienna');
    const promise = vm.search();

    expect(vm.isLoading()).toBe(true);

    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([sampleTour]);
    await promise;

    expect(vm.isLoading()).toBe(false);
  });

  it('should search and update results', async () => {
    vm.setSearchText('Vienna');
    const promise = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([sampleTour]);
    await promise;

    expect(vm.results()).toHaveLength(1);
    expect(vm.hasSearched()).toBe(true);
    expect(vm.errorMessage()).toBeNull();
  });

  it('should not search with empty text', async () => {
    vm.setSearchText('  ');
    await vm.search();
    expect(vm.hasSearched()).toBe(false);
    expect(vm.isLoading()).toBe(false);
  });

  it('should not start a second search while one is in flight', async () => {
    vm.setSearchText('Vienna');
    const first = vm.search();
    const second = vm.search();

    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([sampleTour]);
    await Promise.all([first, second]);

    expect(vm.results()).toHaveLength(1);
  });

  it('should set empty results, mark hasSearched, and surface error message on API error', async () => {
    vm.setSearchText('Vienna');
    const promise = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).error(new ProgressEvent('error'));
    await promise;

    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(true);
    expect(vm.errorMessage()).toBe('Search failed. Check whether the API is running.');
    expect(vm.isLoading()).toBe(false);
  });

  it('should clear errorMessage on subsequent successful search', async () => {
    vm.setSearchText('Vienna');
    const failed = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).error(new ProgressEvent('error'));
    await failed;

    expect(vm.errorMessage()).not.toBeNull();

    vm.setSearchText('Berlin');
    const ok = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Berlin`).flush([sampleTour]);
    await ok;

    expect(vm.errorMessage()).toBeNull();
  });

  it('should allow re-search after clear', async () => {
    vm.setSearchText('Vienna');
    const p1 = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([sampleTour]);
    await p1;

    vm.clear();
    expect(vm.hasSearched()).toBe(false);
    expect(vm.results()).toEqual([]);

    vm.setSearchText('Berlin');
    const p2 = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Berlin`).flush([{ ...sampleTour, id: '2' }]);
    await p2;

    expect(vm.hasSearched()).toBe(true);
    expect(vm.results()).toHaveLength(1);
  });

  it('should clear search state including errorMessage', async () => {
    vm.setSearchText('Vienna');
    const promise = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).error(new ProgressEvent('error'));
    await promise;

    vm.clear();

    expect(vm.searchText()).toBe('');
    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(false);
    expect(vm.errorMessage()).toBeNull();
  });

  it('should navigate to tour and clear search state', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    vm.setSearchText('Vienna');
    const promise = vm.search();
    httpTesting.expectOne(`${baseUrl}api/tour/search/Vienna`).flush([sampleTour]);
    await promise;

    vm.navigateToTour(sampleTour);

    expect(navigateSpy).toHaveBeenCalledWith(['/tours'], { queryParams: { tourId: 'tour-1' } });
    expect(vm.searchText()).toBe('');
    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(false);
  });
});
