import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../material/material.config';

// const declarationList = [];
const importList = [RouterModule, MaterialModule];
const exportList = [MaterialModule];

@NgModule({
  // If you make a new component in shared folder
  // ...declarationList
  declarations: [],
  imports: [...importList, CommonModule],
  // If components needs to be used outside of shared folder then add it here
  exports: [...exportList],
})
export class SharedModule {}
