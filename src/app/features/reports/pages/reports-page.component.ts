import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReportViewModel } from '../viewmodels/report.viewmodel';

@Component({
  selector: 'app-reports-page',
  imports: [CommonModule],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent implements OnInit {
  protected readonly vm = inject(ReportViewModel);

  async ngOnInit(): Promise<void> {
    await this.vm.loadTours();
  }

  protected onTourSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.vm.selectTour(select.value || null);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.vm.importTour(file);
    }
    input.value = '';
  }
}
