import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

const materialComponents = [
  MatCardModule,
  MatInputModule,
  MatButtonModule,
  MatFormFieldModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatSelectModule,
  MatChipsModule,
  MatIconModule,
];

@NgModule({
  imports: [CommonModule, ...materialComponents],
  exports: [...materialComponents], // This is to make the components available to other modules
})
export class MaterialModule {}
