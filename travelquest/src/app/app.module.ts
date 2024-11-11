import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-router.module';
import { MapComponent } from './shared/components/map/map.component';

@NgModule({
  declarations: [AppComponent, MapComponent],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
  ],
  // Intercepters/config that needs to be loaded, gets added to providers
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
