import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

const materialComponents = [
  MatCardModule,
  MatInputModule,
  MatButtonModule,
  MatFormFieldModule,
  MatIconModule,
];

@NgModule({
  imports: [CommonModule, ...materialComponents],
  exports: [...materialComponents],
})
export class MaterialModule {}
