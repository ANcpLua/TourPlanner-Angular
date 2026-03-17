import { TestBed } from '@angular/core/testing';
import { LEAFLET } from './leaflet.token';

describe('LEAFLET token', () => {
  it('should resolve to the LeafletRuntime API via factory', () => {
    TestBed.configureTestingModule({});
    const leaflet = TestBed.inject(LEAFLET);

    expect(leaflet).toBeDefined();
    expect(typeof leaflet.map).toBe('function');
    expect(typeof leaflet.marker).toBe('function');
    expect(typeof leaflet.tileLayer).toBe('function');
  });
});
