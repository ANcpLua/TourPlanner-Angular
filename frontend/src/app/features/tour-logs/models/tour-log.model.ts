import type { components } from '../../../core/api/generated/api-types';

type TourLogDto = components['schemas']['TourLogDto'];

export type TourLog = Omit<TourLogDto, 'id' | 'tourId' | 'dateTime' | 'comment' | 'difficulty' | 'totalDistance' | 'totalTime' | 'rating'> & {
  id: string;
  tourId: string;
  dateTime: string;
  comment: string;
  difficulty: number;
  totalDistance: number;
  totalTime: number;
  rating: number;
};

export interface TourLogFormValue {
  id: string | null;
  tourId: string;
  comment: string;
  difficulty: number;
  totalDistance: number;
  totalTime: number;
  rating: number;
}

import { EMPTY_GUID } from '../../../core/constants/guid';

export { EMPTY_GUID };

export function createEmptyTourLogFormValue(tourId: string): TourLogFormValue {
  return {
    id: null,
    tourId,
    comment: '',
    difficulty: 1,
    totalDistance: 0,
    totalTime: 0,
    rating: 1,
  };
}

export function createTourLogFormValue(log: TourLog): TourLogFormValue {
  return {
    id: log.id,
    tourId: log.tourId,
    comment: log.comment,
    difficulty: log.difficulty,
    totalDistance: log.totalDistance,
    totalTime: log.totalTime,
    rating: log.rating,
  };
}

export function buildTourLogForSave(formValue: TourLogFormValue): TourLog {
  return {
    id: formValue.id ?? EMPTY_GUID,
    tourId: formValue.tourId,
    dateTime: new Date().toISOString(),
    comment: formValue.comment.trim(),
    difficulty: formValue.difficulty,
    totalDistance: formValue.totalDistance,
    totalTime: formValue.totalTime,
    rating: formValue.rating,
  };
}
