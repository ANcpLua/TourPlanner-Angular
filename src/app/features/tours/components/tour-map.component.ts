import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-tour-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-map.component.html',
  styleUrl: './tour-map.component.css',
})
export class TourMapComponent {
  readonly fromLat = input<number | null>(null);
  readonly fromLng = input<number | null>(null);
  readonly toLat = input<number | null>(null);
  readonly toLng = input<number | null>(null);

  protected readonly mapContainer = viewChild<ElementRef>('mapEl');

  private map: L.Map | null = null;
  private routeLayer = L.layerGroup();

  protected readonly isVisible = signal(false);

  constructor() {
    afterNextRender(() => this.initMap());

    effect(() => {
      const from = { lat: this.fromLat(), lng: this.fromLng() };
      const to = { lat: this.toLat(), lng: this.toLng() };
      this.updateRoute(from, to);
    });
  }

  protected toggle(): void {
    this.isVisible.update((v) => !v);
    if (this.isVisible()) {
      setTimeout(() => this.map?.invalidateSize(), 0);
    }
  }

  private initMap(): void {
    const container = this.mapContainer();
    if (!container) return;

    this.map = L.map(container.nativeElement, {
      center: [48.2082, 16.3738],
      zoom: 5,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.routeLayer.addTo(this.map);
  }

  private updateRoute(
    from: { lat: number | null; lng: number | null },
    to: { lat: number | null; lng: number | null },
  ): void {
    if (!this.map) return;

    this.routeLayer.clearLayers();

    if (from.lat == null || from.lng == null || to.lat == null || to.lng == null) {
      return;
    }

    const fromLatLng = L.latLng(from.lat, from.lng);
    const toLatLng = L.latLng(to.lat, to.lng);

    const startIcon = L.divIcon({
      html: '<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
      iconSize: [14, 14],
      className: '',
    });

    const endIcon = L.divIcon({
      html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
      iconSize: [14, 14],
      className: '',
    });

    L.marker(fromLatLng, { icon: startIcon }).addTo(this.routeLayer);
    L.marker(toLatLng, { icon: endIcon }).addTo(this.routeLayer);

    L.polyline([fromLatLng, toLatLng], {
      color: '#8d5a21',
      weight: 3,
      dashArray: '8 4',
    }).addTo(this.routeLayer);

    this.map.fitBounds(L.latLngBounds([fromLatLng, toLatLng]), { padding: [40, 40] });
  }
}
