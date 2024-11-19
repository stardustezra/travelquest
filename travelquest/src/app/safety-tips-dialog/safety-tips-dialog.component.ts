import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-safety-tips-dialog',
  templateUrl: './safety-tips-dialog.component.html',
  styleUrls: ['./safety-tips-dialog.component.scss'],
})
export class SafetyTipsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SafetyTipsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
