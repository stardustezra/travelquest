import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

const materialComponents = [
  MatCardModule,
  MatInputModule,
  MatButtonModule,
  MatFormFieldModule,
];

@NgModule({
  imports: [CommonModule, ...materialComponents],
  exports: [...materialComponents],
})
export class MaterialModule {}
