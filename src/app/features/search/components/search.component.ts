import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tour } from '../../tours/models/tour.model';

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent {
  readonly searchText = input('');
  readonly results = input<readonly Tour[]>([]);
  readonly hasSearched = input(false);

  readonly searchTextChange = output<string>();
  readonly search = output<void>();
  readonly clear = output<void>();
  readonly navigateToTour = output<Tour>();

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.search.emit();
    }
  }
}
