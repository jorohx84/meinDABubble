import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-removepassword',
  imports: [CommonModule, FormsModule],
  templateUrl: './removepassword.component.html',
  styleUrl: './removepassword.component.scss'
})
export class RemovepasswordComponent {
  input: string = '';
  firestore = inject(Firestore);
  auth = inject(Auth);
  sharedService = inject(SharedService);
  reset() {
    if (this.input) {
      const email = this.input;
      sendPasswordResetEmail(this.auth, email)
        .then(() => {
          console.log("Passwort zurücksetzen E-Mail gesendet!");
          alert("Wir haben dir eine E-Mail zum Zurücksetzen des Passworts geschickt.");
        })
        .then(() => {
          setTimeout(() => {
            this.sharedService.navigateToPath('/login');
          }, 1000);
        })
    }


  }
}

