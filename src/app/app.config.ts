import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "meindabubble-9977d", appId: "1:212507195847:web:277c027400614d82d301e2", storageBucket: "meindabubble-9977d.firebasestorage.app", apiKey: "AIzaSyA7wfChuBGWtAZc7wrn-jph0lGj7pFPHbI", authDomain: "meindabubble-9977d.firebaseapp.com", messagingSenderId: "212507195847" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
