import { InjectionToken } from '@angular/core';

export type BrowserLocation = Pick<Location, 'assign'>;

export const BROWSER_LOCATION = new InjectionToken<BrowserLocation>('BROWSER_LOCATION', {
  factory: () => window.location,
});
