import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MediaDashboardComponent } from './media-dashboard/media-dashboard.component';
import { MediaUploaderMusicComponent } from './media-uploader-music/media-uploader-music.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'media', component: MediaDashboardComponent, canActivate: [AuthGuard] },
  { path: 'music-editor', component: MediaUploaderMusicComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
