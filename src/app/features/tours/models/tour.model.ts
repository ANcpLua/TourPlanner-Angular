import type { components } from '../../../core/api/generated/api-types';

export type TransportType = 'Car' | 'Bike' | 'Foot';

type TourDto = components['schemas']['TourDto'];

export type Tour = Omit<
  TourDto,
  'id' | 'name' | 'description' | 'from' | 'to' | 'transportType'
> & {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  popularity?: string;
  isChildFriendly?: boolean;
  averageRating?: number | null;
};

export interface TourFormValue {
  id: string | null;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
}

export type ResolveRouteRequest = components['schemas']['ResolveRouteRequest'];

export type ResolveRouteResponse = components['schemas']['ResolveRouteResponse'];

import { EMPTY_GUID } from '../../../core/constants/guid';

export { EMPTY_GUID };

export const CITY_COORDINATES = {
  Vienna: { latitude: 48.2082, longitude: 16.3738 },
  Paris: { latitude: 48.8566, longitude: 2.3522 },
  Berlin: { latitude: 52.52, longitude: 13.405 },
  Budapest: { latitude: 47.4979, longitude: 19.0402 },
  Warsaw: { latitude: 52.2297, longitude: 21.0122 },
} as const satisfies Record<string, { latitude: number; longitude: number }>;

export type CityName = keyof typeof CITY_COORDINATES;

export const CITY_OPTIONS = Object.keys(CITY_COORDINATES) as CityName[];

export function getCityCoordinates(city: string): {
  latitude: number;
  longitude: number;
} {
  const coordinates = CITY_COORDINATES[city as CityName];

  if (!coordinates) {
    throw new Error(`Unknown city: ${city}`);
  }

  return coordinates;
}

export function createEmptyTourFormValue(): TourFormValue {
  return {
    id: null,
    name: '',
    description: '',
    from: '',
    to: '',
    transportType: 'Car',
  };
}

export function createTourFormValue(tour: Tour): TourFormValue {
  return {
    id: tour.id,
    name: tour.name,
    description: tour.description,
    from: tour.from,
    to: tour.to,
    transportType: tour.transportType,
  };
}

export function buildTourForSave(
  formValue: TourFormValue,
  route: ResolveRouteResponse,
): Tour {
  const fromCoordinates = getCityCoordinates(formValue.from);
  const toCoordinates = getCityCoordinates(formValue.to);

  return {
    id: formValue.id ?? EMPTY_GUID,
    name: formValue.name.trim(),
    description: formValue.description.trim(),
    from: formValue.from,
    to: formValue.to,
    transportType: formValue.transportType,
    imagePath: `Images/tours/${formValue.from}${formValue.to}.png`,
    routeInformation: JSON.stringify({
      FromCoordinates: {
        Latitude: fromCoordinates.latitude,
        Longitude: fromCoordinates.longitude,
      },
      ToCoordinates: {
        Latitude: toCoordinates.latitude,
        Longitude: toCoordinates.longitude,
      },
      Distance: route.distance,
      Duration: route.duration,
    }),
    distance: route.distance,
    estimatedTime: route.duration,
  };
}
