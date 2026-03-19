import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbarComponent } from '../navbar/app-navbar.component';
import { SearchComponent } from '../../features/search/components/search.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, AppNavbarComponent, SearchComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {}
