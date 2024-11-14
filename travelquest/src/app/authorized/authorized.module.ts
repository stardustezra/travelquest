import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AuthorizedComponent } from './authorized.component';
import { AuthorizedRoutingModule } from './authorized-router.module';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule, Routes } from '@angular/router';
import { ProfileListComponent } from './profile/profile-list/profile-list.component';

@NgModule({
  declarations: [AuthorizedComponent, NavbarComponent, ProfileListComponent],
  imports: [CommonModule, SharedModule, AuthorizedRoutingModule],
})
export class AuthorizedModule {}
