import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AuthorizedComponent } from './authorized.component';
import { AuthorizedRoutingModule } from './authorized-router.module';
import { NavbarComponent } from '../navbar/navbar.component';
// import { RouterModule, Routes } from '@angular/router';
import { ProfileCreationComponent } from './profile-creation/profile-creation.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material/material.config';
import { ProfileListComponent } from './profile/profile-list/profile-list.component';

@NgModule({
  declarations: [
    AuthorizedComponent,
    NavbarComponent,
    ProfileCreationComponent,
    ProfileListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AuthorizedRoutingModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class AuthorizedModule {}
