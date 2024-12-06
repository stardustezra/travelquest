import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'travelquest-travellog',
  templateUrl: './travellog.component.html',
  styleUrls: ['./travellog.component.scss'],
})
export class TravellogComponent implements OnInit {
  travelLogForm!: FormGroup;
  isModalOpen: boolean = false;
  travelLogs: Array<{
    country: string;
    city: string;
    arrivalDate: string;
    departureDate: string;
  }> = [];
  editIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private sessionStore: sessionStoreRepository
  ) {
    this.travelLogForm = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      arrivalDate: ['', Validators.required],
      departureDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadTravelLogs();
  }

  loadTravelLogs(): void {
    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (uid) {
        this.sessionStore.getUserProfile(uid).subscribe((profile) => {
          if (profile && profile.travelLogs) {
            this.travelLogs = profile.travelLogs.map((log: any) => ({
              ...log,
              arrivalDate: log.arrivalDate?.toDate(), // Convert Firestore Timestamp to Date
              departureDate: log.departureDate?.toDate(), // Convert Firestore Timestamp to Date
            }));
          }
        });
      }
    });
  }

  saveTravelLogs(): void {
    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (uid) {
        this.sessionStore
          .saveUserProfile({ travelLogs: this.travelLogs })
          .then(() => {
            const newCount = this.travelLogs.length;
            this.sessionStore.updateTravelsCount(uid, newCount);
          })
          .catch((error) => {});
      }
    });
  }

  openAddTravelLogModal(): void {
    this.isModalOpen = true;
  }

  openEditTravelLogModal(index: number): void {
    this.editIndex = index;
    const logToEdit = this.travelLogs[index];
    this.travelLogForm.setValue({
      country: logToEdit.country,
      city: logToEdit.city,
      arrivalDate: logToEdit.arrivalDate,
      departureDate: logToEdit.departureDate,
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.travelLogForm.reset();
    this.isModalOpen = false;
    this.editIndex = null;
  }

  onSubmit(): void {
    if (this.travelLogForm.valid) {
      const formData = this.travelLogForm.value;

      const travelLogData = {
        ...formData,
        arrivalDate: formData.arrivalDate
          ? Timestamp.fromDate(new Date(formData.arrivalDate))
          : null,
        departureDate: formData.departureDate
          ? Timestamp.fromDate(new Date(formData.departureDate))
          : null,
      };

      if (this.editIndex !== null) {
        // Update existing log
        this.travelLogs[this.editIndex] = travelLogData;
      } else {
        // Add new log
        this.travelLogs = [...this.travelLogs, travelLogData];
      }

      this.saveTravelLogs(); // Save updated logs to Firestore
      this.closeModal();
    }
  }

  deleteTravelLog(index: number): void {
    this.travelLogs.splice(index, 1);

    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (uid) {
        this.sessionStore
          .saveUserProfile({ travelLogs: this.travelLogs })
          .then(() => {
            const newCount = this.travelLogs.length; // Update count after deletion
            this.sessionStore.updateTravelsCount(uid, newCount);
            console.log('Travel log deleted and count updated successfully!');
          })
          .catch((error) => {
            console.error('Error deleting travel log:', error);
          });
      }
    });
  }
}
