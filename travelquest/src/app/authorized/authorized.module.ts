import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AuthorizedComponent } from './authorized.component';
import { AuthorizedRoutingModule } from './authorized-router.module';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule, Routes } from '@angular/router';

// Navbar routes
const routes: Routes = [
  // TODO: Add navbar routes example:
  // { path: 'user', component: UserComponent },
  { path: '', redirectTo: '/user', pathMatch: 'full' },
];

@NgModule({
  declarations: [AuthorizedComponent, NavbarComponent],
  imports: [
    CommonModule,
    SharedModule,
    AuthorizedRoutingModule,
    RouterModule.forRoot(routes),
  ],
})
export class AuthorizedModule {}
