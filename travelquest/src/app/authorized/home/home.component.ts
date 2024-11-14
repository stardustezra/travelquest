import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(private router: Router) {}

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
