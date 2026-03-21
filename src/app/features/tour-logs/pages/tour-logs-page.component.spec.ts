import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { TourLogViewModel } from '../viewmodels/tour-log.viewmodel';
import { TourLogsPageComponent } from './tour-logs-page.component';
import { TourLog } from '../models/tour-log.model';

describe('TourLogsPageComponent', () => {
  const baseUrl = 'http://localhost:7102/';

  describe('confirmDeleteLog', () => {
    const deleteLogMock = vi.fn();
    const confirmMock = vi.fn<(message?: string) => boolean>();

    const sampleLog: TourLog = {
      id: 'log-1',
      tourId: 'tour-1',
      dateTime: '2026-01-15T10:00:00Z',
      comment: 'Great weather',
      difficulty: 2,
      totalDistance: 500,
      totalTime: 120,
      rating: 4,
    };

    beforeEach(async () => {
      deleteLogMock.mockReset();
      confirmMock.mockReset();
      deleteLogMock.mockResolvedValue(undefined);
      vi.stubGlobal('confirm', confirmMock);

      await TestBed.configureTestingModule({
        imports: [TourLogsPageComponent],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: baseUrl },
          {
            provide: TourLogViewModel,
            useValue: {
              tours: signal([]),
              selectedTourId: signal('tour-1'),
              logs: signal([sampleLog]),
              editingLog: computed(() => null),
              isLoading: signal(false),
              isSaving: signal(false),
              isFormVisible: signal(false),
              errorMessage: signal(null),
              loadTours: vi.fn().mockResolvedValue(undefined),
              selectTour: vi.fn().mockResolvedValue(undefined),
              loadLogs: vi.fn(),
              openCreateForm: vi.fn(),
              openEditForm: vi.fn(),
              closeForm: vi.fn(),
              saveLog: vi.fn(),
              deleteLog: deleteLogMock,
              editingLogId: signal(null),
            },
          },
        ],
      }).compileComponents();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('should call vm.deleteLog when user confirms', async () => {
      confirmMock.mockReturnValue(true);

      const fixture = TestBed.createComponent(TourLogsPageComponent);
      fixture.detectChanges();

      await fixture.componentInstance['confirmDeleteLog'](sampleLog);

      expect(confirmMock).toHaveBeenCalledOnce();
      expect(confirmMock).toHaveBeenCalledWith('Delete this log? This cannot be undone.');
      expect(deleteLogMock).toHaveBeenCalledOnce();
      expect(deleteLogMock).toHaveBeenCalledWith(sampleLog);
    });

    it('should NOT call vm.deleteLog when user cancels', async () => {
      confirmMock.mockReturnValue(false);

      const fixture = TestBed.createComponent(TourLogsPageComponent);
      fixture.detectChanges();

      await fixture.componentInstance['confirmDeleteLog'](sampleLog);

      expect(confirmMock).toHaveBeenCalledOnce();
      expect(deleteLogMock).not.toHaveBeenCalled();
    });
  });
});
