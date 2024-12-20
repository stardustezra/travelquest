import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'travelquest-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  showNavbar = true;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    // Handle route change by subscribing to NavigationEnd events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateNavbarVisibility();
      });

    // Handle initial route when the component is loaded (useful for page refresh)
    this.updateNavbarVisibility();
  }

  private updateNavbarVisibility(): void {
    this.showNavbar = !this.checkHideNavbar(this.activatedRoute);
  }

  private checkHideNavbar(route: ActivatedRoute): boolean {
    let currentRoute: ActivatedRoute | null = route;

    // Traverse to the deepest child route (if any)
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    // Check if the route data has the 'hideNavbar' property set to true
    return currentRoute.snapshot.data['hideNavbar'] === true;
  }

  isActiveRoute(routes: string[]): boolean {
    return routes.some((route) => this.router.url.startsWith(route));
  }

  navigateTo(path: string): void {
    setTimeout(() => {
      this.router.navigate([path]);
    }, 100);
  }
}
