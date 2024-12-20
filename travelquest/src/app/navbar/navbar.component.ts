import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  constructor(private router: Router) {}

  isActiveRoute(routes: string[]): boolean {
    return routes.some((route) => this.router.url.startsWith(route));
  }

  navigateTo(path: string): void {
    // TODO: Another way than delay to avoid double click?
    setTimeout(() => {
      this.router.navigate([path]);
    }, 100);
  }
}
