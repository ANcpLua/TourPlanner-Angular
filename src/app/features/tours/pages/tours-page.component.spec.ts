import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { TourViewModel } from '../viewmodels/tour.viewmodel';
import { ToursPageComponent } from './tours-page.component';
import { Tour } from '../models/tour.model';

describe('ToursPageComponent', () => {
  const baseUrl = 'http://localhost:7102/';

  describe('confirmDeleteTour', () => {
    const deleteTourMock = vi.fn();
    const confirmMock = vi.fn<(message?: string) => boolean>();

    const sampleTour: Tour = {
      id: 'tour-1',
      name: 'Vienna to Paris',
      description: 'A scenic route',
      from: 'Vienna',
      to: 'Paris',
      transportType: 'Car',
    };

    beforeEach(async () => {
      deleteTourMock.mockReset();
      confirmMock.mockReset();
      deleteTourMock.mockResolvedValue(undefined);
      vi.stubGlobal('confirm', confirmMock);

      await TestBed.configureTestingModule({
        imports: [ToursPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
          {
            provide: TourViewModel,
            useValue: {
              tours: signal([sampleTour]),
              selectedTourId: signal(null),
              selectedTour: computed(() => null),
              editingTour: computed(() => null),
              mapCoordinates: computed(() => null),
              isLoading: signal(false),
              isSaving: signal(false),
              isFormVisible: signal(false),
              errorMessage: signal(null),
              loadTours: vi.fn().mockResolvedValue(undefined),
              selectTour: vi.fn(),
              openCreateForm: vi.fn(),
              openEditForm: vi.fn(),
              closeForm: vi.fn(),
              saveTour: vi.fn(),
              deleteTour: deleteTourMock,
            },
          },
        ],
      }).compileComponents();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('should call vm.deleteTour when user confirms', async () => {
      confirmMock.mockReturnValue(true);

      const fixture = TestBed.createComponent(ToursPageComponent);
      fixture.detectChanges();

      await fixture.componentInstance['confirmDeleteTour'](sampleTour);

      expect(confirmMock).toHaveBeenCalledOnce();
      expect(confirmMock).toHaveBeenCalledWith('Delete tour "Vienna to Paris"? This cannot be undone.');
      expect(deleteTourMock).toHaveBeenCalledOnce();
      expect(deleteTourMock).toHaveBeenCalledWith(sampleTour);
    });

    it('should NOT call vm.deleteTour when user cancels', async () => {
      confirmMock.mockReturnValue(false);

      const fixture = TestBed.createComponent(ToursPageComponent);
      fixture.detectChanges();

      await fixture.componentInstance['confirmDeleteTour'](sampleTour);

      expect(confirmMock).toHaveBeenCalledOnce();
      expect(deleteTourMock).not.toHaveBeenCalled();
    });
  });
});
