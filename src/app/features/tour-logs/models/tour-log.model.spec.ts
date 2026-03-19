import {
  buildTourLogForSave,
  createEmptyTourLogFormValue,
  createTourLogFormValue,
  EMPTY_GUID,
  TourLog,
} from './tour-log.model';

describe('TourLog model', () => {
  const sampleLog: TourLog = {
    id: 'abc-123',
    tourId: 'tour-456',
    dateTime: '2026-03-15T10:30:00Z',
    comment: 'Great hike',
    difficulty: 3,
    totalDistance: 15000,
    totalTime: 4.5,
    rating: 4,
  };

  describe('createEmptyTourLogFormValue', () => {
    it('should create form value with given tourId', () => {
      const result = createEmptyTourLogFormValue('tour-789');
      expect(result.id).toBeNull();
      expect(result.tourId).toBe('tour-789');
      expect(result.comment).toBe('');
      expect(result.difficulty).toBe(1);
      expect(result.totalDistance).toBe(0);
      expect(result.totalTime).toBe(0);
      expect(result.rating).toBe(1);
    });
  });

  describe('createTourLogFormValue', () => {
    it('should map all fields from existing log', () => {
      const result = createTourLogFormValue(sampleLog);
      expect(result.id).toBe('abc-123');
      expect(result.tourId).toBe('tour-456');
      expect(result.comment).toBe('Great hike');
      expect(result.difficulty).toBe(3);
      expect(result.totalDistance).toBe(15000);
      expect(result.totalTime).toBe(4.5);
      expect(result.rating).toBe(4);
    });
  });

  describe('buildTourLogForSave', () => {
    it('should use EMPTY_GUID for new logs', () => {
      const formValue = createEmptyTourLogFormValue('tour-456');
      formValue.comment = '  Test comment  ';
      formValue.difficulty = 2;

      const result = buildTourLogForSave(formValue);
      expect(result.id).toBe(EMPTY_GUID);
      expect(result.tourId).toBe('tour-456');
      expect(result.comment).toBe('Test comment');
      expect(result.difficulty).toBe(2);
      expect(result.dateTime).toBeTruthy();
    });

    it('should preserve existing id for updates', () => {
      const formValue = createTourLogFormValue(sampleLog);
      const result = buildTourLogForSave(formValue);
      expect(result.id).toBe('abc-123');
    });

    it('should trim comment whitespace', () => {
      const formValue = createEmptyTourLogFormValue('tour-1');
      formValue.comment = '  spaces  ';
      const result = buildTourLogForSave(formValue);
      expect(result.comment).toBe('spaces');
    });
  });
});
