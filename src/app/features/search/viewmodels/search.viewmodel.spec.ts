import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { SearchViewModel } from './search.viewmodel';

describe('SearchViewModel', () => {
  let vm: SearchViewModel;
  let httpTesting: HttpTestingController;
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

  it('should clear search state', () => {
    vm.searchText.set('test');
    vm.hasSearched.set(true);
    vm.results.set([{ id: '1', name: 'T', description: '', from: 'A', to: 'B', transportType: 'Car' }]);

    vm.clear();

    expect(vm.searchText()).toBe('');
    expect(vm.results()).toEqual([]);
    expect(vm.hasSearched()).toBe(false);
  });
});
