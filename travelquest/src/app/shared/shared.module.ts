import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../material/material.config';
import { HashtagListComponent } from './components/hashtag-list/hashtag-list.component';
import { HashtagEditComponent } from './components/hashtag-edit/hashtag-edit.component';
import { FormsModule } from '@angular/forms';

// const declarationList = [];
const importList = [RouterModule, MaterialModule];
const exportList = [MaterialModule];

@NgModule({
  // If you make a new component in shared folder
  // ...declarationList
  declarations: [HashtagListComponent, HashtagEditComponent],
  imports: [...importList, CommonModule, FormsModule],
  // If components needs to be used outside of shared folder then add it here
  exports: [...exportList, HashtagListComponent, HashtagEditComponent],
})
export class SharedModule {}
