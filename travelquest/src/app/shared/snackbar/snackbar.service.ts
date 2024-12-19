import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  private getPanelClass(type: 'success' | 'error'): string[] {
    return type === 'success' ? ['success-snack-style'] : ['error-snack-style'];
  }

  success(message: string, action: string = 'Close', duration: number = 3000) {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: this.getPanelClass('success'),
    };

    console.log('Success Snackbar Config:', config);

    this.snackBar.open(message, action, config);
  }

  error(message: string, action: string = 'Close', duration: number = 3000) {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: this.getPanelClass('error'),
    };

    console.log('Error Snackbar Config:', config);

    this.snackBar.open(message, action, config);
  }
}
