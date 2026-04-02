import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import { LEAFLET } from './leaflet.token';

@Component({
  selector: 'app-tour-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-map.component.html',
  styleUrl: './tour-map.component.css',
})
export class TourMapComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly leaflet = inject(LEAFLET);

  readonly fromLat = input<number | null>(null);
  readonly fromLng = input<number | null>(null);
  readonly toLat = input<number | null>(null);
  readonly toLng = input<number | null>(null);

  protected readonly mapContainer = viewChild<ElementRef>('mapEl');

  private map: Leaflet.Map | null = null;
  private routeLayer: Leaflet.LayerGroup | null = null;

  private readonly startIcon = this.leaflet.divIcon({
    html: '<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
    iconSize: [14, 14],
    className: '',
  });

  private readonly endIcon = this.leaflet.divIcon({
    html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
    iconSize: [14, 14],
    className: '',
  });

  protected readonly isVisible = signal(false);

  constructor() {
    effect(() => {
      const container = this.mapContainer()?.nativeElement;
      const isVisible = this.isVisible();
      const from = { lat: this.fromLat(), lng: this.fromLng() };
      const to = { lat: this.toLat(), lng: this.toLng() };

      if (!isVisible || !container) {
        this.disposeMap();
        return;
      }

      const mapWasCreated = this.ensureMap(container);
      this.updateRoute(from, to);

      if (mapWasCreated) {
        setTimeout(() => this.map?.invalidateSize(), 0);
      }
    });

    this.destroyRef.onDestroy(() => this.disposeMap());
  }

  protected toggle(): void {
    this.isVisible.update((v) => !v);
  }

  private ensureMap(container: HTMLDivElement): boolean {
    if (this.map) {
      return false;
    }

    this.map = this.leaflet.map(container, {
      center: [48.2082, 16.3738],
      zoom: 5,
    });

    this.leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.routeLayer = this.leaflet.layerGroup().addTo(this.map);
    return true;
  }

  private disposeMap(): void {
    this.routeLayer = null;
    this.map?.remove();
    this.map = null;
  }

  private updateRoute(
    from: { lat: number | null; lng: number | null },
    to: { lat: number | null; lng: number | null },
  ): void {
    if (!this.map || !this.routeLayer) return;

    this.routeLayer.clearLayers();

    if (from.lat == null || from.lng == null || to.lat == null || to.lng == null) {
      return;
    }

    const fromLatLng = this.leaflet.latLng(from.lat, from.lng);
    const toLatLng = this.leaflet.latLng(to.lat, to.lng);

    this.leaflet.marker(fromLatLng, { icon: this.startIcon }).addTo(this.routeLayer);
    this.leaflet.marker(toLatLng, { icon: this.endIcon }).addTo(this.routeLayer);

    this.leaflet.polyline([fromLatLng, toLatLng], {
      color: '#8d5a21',
      weight: 3,
      dashArray: '8 4',
    }).addTo(this.routeLayer);

    this.map.fitBounds(this.leaflet.latLngBounds([fromLatLng, toLatLng]), { padding: [40, 40] });
  }
}
