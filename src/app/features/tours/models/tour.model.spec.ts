import {
  buildTourForSave,
  CITY_COORDINATES,
  CITY_OPTIONS,
  createEmptyTourFormValue,
  createTourFormValue,
  EMPTY_GUID,
  getAverageRating,
  getCityCoordinates,
  getIsChildFriendly,
  getPopularity,
  Tour,
} from './tour.model';

describe('Tour model', () => {
  describe('CITY_COORDINATES', () => {
    it('should contain 5 cities', () => {
      expect(Object.keys(CITY_COORDINATES)).toHaveLength(5);
    });

    it('should export city options', () => {
      expect(CITY_OPTIONS).toContain('Vienna');
      expect(CITY_OPTIONS).toContain('Paris');
      expect(CITY_OPTIONS).toContain('Berlin');
      expect(CITY_OPTIONS).toContain('Budapest');
      expect(CITY_OPTIONS).toContain('Warsaw');
    });
  });

  describe('getCityCoordinates', () => {
    it('should return coordinates for known city', () => {
      const coords = getCityCoordinates('Vienna');
      expect(coords.latitude).toBe(48.2082);
      expect(coords.longitude).toBe(16.3738);
    });

    it('should throw for unknown city', () => {
      expect(() => getCityCoordinates('Unknown')).toThrow('Unknown city: Unknown');
    });
  });

  describe('createEmptyTourFormValue', () => {
    it('should create empty form value', () => {
      const result = createEmptyTourFormValue();
      expect(result.id).toBeNull();
      expect(result.name).toBe('');
      expect(result.transportType).toBe('Car');
    });
  });

  describe('createTourFormValue', () => {
    it('should map tour to form value', () => {
      const tour: Tour = {
        id: 'tour-1',
        name: 'Test Tour',
        description: 'Desc',
        from: 'Vienna',
        to: 'Berlin',
        transportType: 'Car',
        distance: 1000,
        estimatedTime: 60,
      };

      const result = createTourFormValue(tour);
      expect(result.id).toBe('tour-1');
      expect(result.name).toBe('Test Tour');
      expect(result.from).toBe('Vienna');
    });
  });

  describe('buildTourForSave', () => {
    it('should build tour with route data', () => {
      const formValue = createEmptyTourFormValue();
      formValue.name = '  Tour Name  ';
      formValue.description = '  Description  ';
      formValue.from = 'Vienna';
      formValue.to = 'Berlin';
      formValue.transportType = 'Car';

      const route = { distance: 680000, duration: 420 };
      const result = buildTourForSave(formValue, route);

      expect(result.id).toBe(EMPTY_GUID);
      expect(result.name).toBe('Tour Name');
      expect(result.description).toBe('Description');
      expect(result.distance).toBe(680000);
      expect(result.estimatedTime).toBe(420);
      expect(result.imagePath).toBe('Images/tours/ViennaBerlin.png');
      expect(result.routeInformation).toBeTruthy();
    });

    it('should include coordinates in route information', () => {
      const formValue = createEmptyTourFormValue();
      formValue.from = 'Vienna';
      formValue.to = 'Paris';

      const result = buildTourForSave(formValue, { distance: 100, duration: 60 });
      const routeInfo = JSON.parse(result.routeInformation!);

      expect(routeInfo.FromCoordinates.Latitude).toBe(48.2082);
      expect(routeInfo.ToCoordinates.Latitude).toBe(48.8566);
    });
  });

  describe('getPopularity', () => {
    const baseTour: Tour = {
      id: '1', name: 'T', description: '', from: 'A', to: 'B', transportType: 'Car',
    };

    it('should return "Not popular" with no logs', () => {
      expect(getPopularity(baseTour)).toBe('Not popular');
      expect(getPopularity({ ...baseTour, tourLogs: [] })).toBe('Not popular');
    });

    it('should return "Less popular" with 1 log', () => {
      expect(getPopularity({ ...baseTour, tourLogs: [makeFakeLog()] })).toBe('Less popular');
    });

    it('should return "Moderately popular" with 2 logs', () => {
      expect(getPopularity({ ...baseTour, tourLogs: [makeFakeLog(), makeFakeLog()] })).toBe('Moderately popular');
    });

    it('should return "Popular" with 3 logs', () => {
      expect(getPopularity({ ...baseTour, tourLogs: Array(3).fill(makeFakeLog()) })).toBe('Popular');
    });

    it('should return "Very popular" with 4+ logs', () => {
      expect(getPopularity({ ...baseTour, tourLogs: Array(5).fill(makeFakeLog()) })).toBe('Very popular');
    });
  });

  describe('getAverageRating', () => {
    const baseTour: Tour = {
      id: '1', name: 'T', description: '', from: 'A', to: 'B', transportType: 'Car',
    };

    it('should return null with no logs', () => {
      expect(getAverageRating(baseTour)).toBeNull();
      expect(getAverageRating({ ...baseTour, tourLogs: [] })).toBeNull();
    });

    it('should compute average of ratings', () => {
      const logs = [
        { ...makeFakeLog(), rating: 4 },
        { ...makeFakeLog(), rating: 2 },
      ];
      expect(getAverageRating({ ...baseTour, tourLogs: logs })).toBe(3);
    });

    it('should handle single log', () => {
      const logs = [{ ...makeFakeLog(), rating: 5 }];
      expect(getAverageRating({ ...baseTour, tourLogs: logs })).toBe(5);
    });
  });

  describe('getIsChildFriendly', () => {
    const baseTour: Tour = {
      id: '1', name: 'T', description: '', from: 'A', to: 'B', transportType: 'Car',
    };

    it('should return false with no logs', () => {
      expect(getIsChildFriendly(baseTour)).toBe(false);
    });

    it('should return true when all logs have difficulty <= 2 and rating >= 3', () => {
      const logs = [
        { ...makeFakeLog(), difficulty: 1, rating: 4 },
        { ...makeFakeLog(), difficulty: 2, rating: 3 },
      ];
      expect(getIsChildFriendly({ ...baseTour, tourLogs: logs })).toBe(true);
    });

    it('should return false when any log has difficulty > 2', () => {
      const logs = [
        { ...makeFakeLog(), difficulty: 1, rating: 4 },
        { ...makeFakeLog(), difficulty: 3, rating: 4 },
      ];
      expect(getIsChildFriendly({ ...baseTour, tourLogs: logs })).toBe(false);
    });

    it('should return false when any log has rating < 3', () => {
      const logs = [
        { ...makeFakeLog(), difficulty: 1, rating: 2 },
      ];
      expect(getIsChildFriendly({ ...baseTour, tourLogs: logs })).toBe(false);
    });
  });
});

function makeFakeLog() {
  return {
    comment: 'x',
    difficulty: 2,
    totalDistance: 100,
    totalTime: 1,
    rating: 3,
  };
}
