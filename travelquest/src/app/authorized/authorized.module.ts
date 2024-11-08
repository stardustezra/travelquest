import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AuthorizedComponent } from './authorized.component';
import { AuthorizedRoutingModule } from './authorized-router.module';

@NgModule({
  // TODO: Add navbar
  declarations: [AuthorizedComponent],
  imports: [CommonModule, SharedModule, AuthorizedRoutingModule],
})
export class AuthorizedModule {}
