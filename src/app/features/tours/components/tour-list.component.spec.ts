import { TestBed } from '@angular/core/testing';
import { TourListComponent } from './tour-list.component';
import { TourView } from '../models/tour.model';

describe('TourListComponent', () => {
  const sampleTours: TourView[] = [
    {
      id: 'tour-1',
      name: 'City Walk',
      description: 'A walk through the city',
      from: 'Vienna',
      to: 'Berlin',
      transportType: 'Car',
      distance: 680000,
      estimatedTime: 420,
      popularity: 'Not popular',
      averageRating: null,
      isChildFriendly: false,
    },
    {
      id: 'tour-2',
      name: 'Mountain Hike',
      description: 'A hike through the mountains',
      from: 'Budapest',
      to: 'Warsaw',
      transportType: 'Foot',
      distance: 900000,
      estimatedTime: 1200,
      popularity: 'Popular',
      averageRating: 4.5,
      isChildFriendly: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourListComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show empty state when no tours', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).not.toBeNull();
  });

  it('should render tour cards', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', sampleTours);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.tour-card');
    expect(cards).toHaveLength(2);
  });

  it('should display computed properties', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', sampleTours);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Not popular');
    expect(el.textContent).toContain('Popular');
    expect(el.textContent).toContain('4.5');
    expect(el.textContent).toContain('Child-friendly');
  });

  it('should highlight selected tour', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', sampleTours);
    fixture.componentRef.setInput('selectedTourId', 'tour-1');
    fixture.detectChanges();

    const selected = fixture.nativeElement.querySelector('.tour-card--selected');
    expect(selected).not.toBeNull();
    expect(selected.textContent).toContain('City Walk');
  });

  it('should emit selectTour on card click', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', sampleTours);
    fixture.detectChanges();

    let emitted: TourView | null = null;
    fixture.componentInstance.selectTour.subscribe((tour: TourView) => (emitted = tour));

    const cardBody = fixture.nativeElement.querySelector('.tour-card__body');
    cardBody.click();

    expect(emitted).not.toBeNull();
    expect(emitted!.id).toBe('tour-1');
  });

  it('should emit deleteTour on delete button click', () => {
    const fixture = TestBed.createComponent(TourListComponent);
    fixture.componentRef.setInput('tours', sampleTours);
    fixture.detectChanges();

    let emitted: TourView | null = null;
    fixture.componentInstance.deleteTour.subscribe((tour: TourView) => (emitted = tour));

    const deleteBtn = fixture.nativeElement.querySelector('.danger');
    deleteBtn.click();

    expect(emitted).not.toBeNull();
  });
});
