import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { isAuthed } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    loadChildren: () =>
      import('./authorized/authorized.module').then((m) => m.AuthorizedModule),
    //canActivate: [isAuthed],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
