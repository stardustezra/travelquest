import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss'],
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  /**
   * Navigate the user back to the home page
   */
  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
