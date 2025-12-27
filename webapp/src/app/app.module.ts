import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from "./app-routing.module";
import { NgOptimizedImage } from "@angular/common";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { MaterialModule } from './material_module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from "./app.component";
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { provideHttpClient } from '@angular/common/http';
import { NavigationComponent } from './navigation/navigation.component';
import { MediaDashboardComponent } from './media-dashboard/media-dashboard.component';
import { MediaUploaderMusicComponent } from './media-uploader-music/media-uploader-music.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    NavigationComponent,
    MediaDashboardComponent,
    MediaUploaderMusicComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgOptimizedImage,
    MaterialModule,
    ReactiveFormsModule
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideZoneChangeDetection()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
