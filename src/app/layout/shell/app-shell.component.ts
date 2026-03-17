import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavbarComponent } from '../navbar/app-navbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, AppNavbarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {}
