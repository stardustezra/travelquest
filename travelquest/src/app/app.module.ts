import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-router.module';
import { MapComponent } from './authorized/map/map.component';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material/material.config';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import {
  FirestoreModule,
  getFirestore,
  provideFirestore,
} from '@angular/fire/firestore';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [AppComponent, MapComponent],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule,
    MatIconModule,
    FirestoreModule,
    MatDialogModule,
    FormsModule,
  ],
  providers: [
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'travelquest-dd8d8',
        appId: '1:674108070126:web:e428b756092883536d7bff',
        storageBucket: 'travelquest-dd8d8.firebasestorage.app',
        apiKey: 'AIzaSyBj7QZC69zrldTNhx65gyqxXlZqc0EgyzU',
        authDomain: 'travelquest-dd8d8.firebaseapp.com',
        messagingSenderId: '674108070126',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideMessaging(() => getMessaging()),
    provideStorage(() => getStorage()),
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
