import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  constructor(private router: Router) {}

  navigateTo(path: string): void {
    setTimeout(() => {
      this.router.navigate([path]);
    }, 100);
  }
}
