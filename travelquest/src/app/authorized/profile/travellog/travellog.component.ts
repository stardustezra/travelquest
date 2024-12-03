import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'travelquest-travellog',
  templateUrl: './travellog.component.html',
  styleUrls: ['./travellog.component.scss'],
})
export class TravellogComponent {
  travelLogForm!: FormGroup;
  isModalOpen: boolean = false;

  constructor(private fb: FormBuilder) {
    this.travelLogForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      arrivalDate: ['', Validators.required],
      departureDate: ['', Validators.required],
    });
  }

  openAddTravelLogModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.travelLogForm.valid) {
      const travelLogData = this.travelLogForm.value;
      console.log('Travel Log Data:', travelLogData);
      this.closeModal();
    }
  }
}
