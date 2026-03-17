import { InjectionToken } from '@angular/core';
import type * as Leaflet from 'leaflet';
import LeafletRuntime from './leaflet.runtime';

export type LeafletApi = typeof LeafletRuntime & typeof import('leaflet');

export const LEAFLET = new InjectionToken<LeafletApi>('LEAFLET', {
  factory: () => LeafletRuntime as LeafletApi,
});
