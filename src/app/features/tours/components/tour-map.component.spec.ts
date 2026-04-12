import { TestBed } from '@angular/core/testing';
import { LEAFLET } from './leaflet.token';
import { vi } from 'vitest';

const leaflet = vi.hoisted(() => {
  const mapInstances: Array<{
    fitBounds: ReturnType<typeof vi.fn>;
    invalidateSize: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  }> = [];
  const layerGroupInstances: Array<{
    addTo: ReturnType<typeof vi.fn>;
    clearLayers: ReturnType<typeof vi.fn>;
  }> = [];

  const api = {
    divIcon: vi.fn((options: unknown) => options),
    map: vi.fn(() => {
      const instance = {
        fitBounds: vi.fn(),
        invalidateSize: vi.fn(),
        remove: vi.fn(),
      };
      mapInstances.push(instance);
      return instance;
    }),
    layerGroup: vi.fn(() => {
      const instance = {
        addTo: vi.fn().mockReturnThis(),
        clearLayers: vi.fn(),
      };
      layerGroupInstances.push(instance);
      return instance;
    }),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
    })),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    marker: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
    })),
    polyline: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
    })),
    latLngBounds: vi.fn((points: unknown[]) => ({ points })),
    mapInstances,
    layerGroupInstances,
    reset(): void {
      mapInstances.length = 0;
      layerGroupInstances.length = 0;
      api.divIcon.mockClear();
      api.map.mockClear();
      api.layerGroup.mockClear();
      api.tileLayer.mockClear();
      api.latLng.mockClear();
      api.marker.mockClear();
      api.polyline.mockClear();
      api.latLngBounds.mockClear();
    },
  };

  return api;
});

import { TourMapComponent } from './tour-map.component';

describe('TourMapComponent', () => {
  beforeEach(async () => {
    leaflet.reset();

    await TestBed.configureTestingModule({
      imports: [TourMapComponent],
      providers: [
        { provide: LEAFLET, useValue: leaflet },
      ],
    }).compileComponents();
  });

  it('should render the map toggle closed by default', () => {
    const fixture = TestBed.createComponent(TourMapComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector('.map-toggle') as HTMLButtonElement;

    expect(toggle.textContent).toContain('Show Map');
    expect(element.querySelector('.map-container')).toBeNull();
    expect(leaflet.map).not.toHaveBeenCalled();
  });

  it('should create and dispose the map when toggled', async () => {
    const fixture = TestBed.createComponent(TourMapComponent);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.map-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.map-container')).not.toBeNull();
    expect(leaflet.map).toHaveBeenCalledOnce();
    expect(leaflet.mapInstances[0].remove).not.toHaveBeenCalled();

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.map-container')).toBeNull();
    expect(leaflet.mapInstances[0].remove).toHaveBeenCalledOnce();
  });

  it('should draw markers and a line when all coordinates are present', async () => {
    const fixture = TestBed.createComponent(TourMapComponent);
    fixture.componentRef.setInput('fromLat', 48.2082);
    fixture.componentRef.setInput('fromLng', 16.3738);
    fixture.componentRef.setInput('toLat', 52.52);
    fixture.componentRef.setInput('toLng', 13.405);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.map-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(leaflet.marker).toHaveBeenCalledTimes(2);
    expect(leaflet.polyline).toHaveBeenCalledOnce();
    expect(leaflet.latLngBounds).toHaveBeenCalledOnce();
    expect(leaflet.mapInstances[0].fitBounds).toHaveBeenCalledOnce();
  });

  it('should reuse existing map when coordinates change while visible', async () => {
    const fixture = TestBed.createComponent(TourMapComponent);
    fixture.componentRef.setInput('fromLat', 48.2082);
    fixture.componentRef.setInput('fromLng', 16.3738);
    fixture.componentRef.setInput('toLat', 52.52);
    fixture.componentRef.setInput('toLng', 13.405);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.map-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(leaflet.map).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('toLat', 47.0707);
    fixture.componentRef.setInput('toLng', 15.4395);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(leaflet.map).toHaveBeenCalledOnce();
    expect(leaflet.marker).toHaveBeenCalledTimes(4);
  });

  it('should clear the layer and skip drawing when coordinates are incomplete', async () => {
    const fixture = TestBed.createComponent(TourMapComponent);
    fixture.componentRef.setInput('fromLat', 48.2082);
    fixture.componentRef.setInput('fromLng', 16.3738);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.map-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(leaflet.layerGroupInstances[0].clearLayers).toHaveBeenCalledOnce();
    expect(leaflet.marker).not.toHaveBeenCalled();
    expect(leaflet.polyline).not.toHaveBeenCalled();
    expect(leaflet.mapInstances[0].fitBounds).not.toHaveBeenCalled();
  });
});
