import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchViewModel } from '../viewmodels/search.viewmodel';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent {
  protected readonly vm = inject(SearchViewModel);

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      void this.vm.search();
    }
  }
}
