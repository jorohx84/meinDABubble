import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { SharedService } from '../shared.service';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-removepassword',
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './removepassword.component.html',
  styleUrl: './removepassword.component.scss'
})
export class RemovepasswordComponent {
  input: string = '';
  firestore = inject(Firestore);
  auth = inject(Auth);
  sharedService = inject(SharedService);
  isSend: boolean = false;
  reset() {
    if (this.input) {
      const email = this.input;
      sendPasswordResetEmail(this.auth, email)
        .then(() => {
          console.log("Passwort zurücksetzen E-Mail gesendet!");
         
        })
        .then(() => {
          setTimeout(() => {
            this.sharedService.navigateToPath('/login');
          }, 1000);
        })
    }

    this.isSend = true
    setTimeout(() => {
      this.isSend = false;
    }, 800);
  }
}

