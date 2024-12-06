import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizedComponent } from './authorized.component';
import { HomeComponent } from './home/home.component';
import { ProfileListComponent } from './profile/profile-list/profile-list.component';
import { ProfileCreationComponent } from './profile-creation/profile-creation.component';
import { ProfileEditComponent } from './profile/profile-edit/profile-edit.component';
import { ProfileSettingsComponent } from './profile/profile-settings/profile-settings.component';
import { TravellogComponent } from './profile/travellog/travellog.component';
import { MapComponent } from './map/map.component';
import { ExploreComponent } from './explore/explore.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthorizedComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'profile',
        component: ProfileListComponent,
      },
      {
        path: 'profile-creation',
        component: ProfileCreationComponent,
      },
      {
        path: 'profile-edit',
        component: ProfileEditComponent,
      },
      {
        path: 'settings',
        component: ProfileSettingsComponent,
      },
      {
        path: 'travellog',
        component: TravellogComponent,
      },
      {
        path: 'map',
        component: MapComponent,
      },
      {
        path: 'explore',
        component: ExploreComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthorizedRoutingModule {}
