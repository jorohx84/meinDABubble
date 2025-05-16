import { Component, Inject, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user.class';
import { signInWithEmailAndPassword, Auth } from '@angular/fire/auth';
import { UserService } from '../user.service';
import { Firestore } from '@angular/fire/firestore';
import { MessageService } from '../message.service';
import { FooterComponent } from '../footer/footer.component';


@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  sharedservice = inject(SharedService);
  userservice = inject(UserService);
  messageService = inject(MessageService);
  user: User = new User();
  auth = inject(Auth)
  firestore = inject(Firestore);
  guest: boolean = false;

  routeToSignin(path: string) {
    this.sharedservice.navigateToPath(path);
  }

  async login() {

    if (this.guest === false) {
      try {
        await signInWithEmailAndPassword(this.auth, this.user.email, this.user.password);
        this.userservice.setOnlineStatus('login');
        await this.userservice.findCurrentUser(this.userservice.user.uid);
        await this.userservice.setLoginTime();
        setTimeout(() => {
          this.sharedservice.navigateToPath('/chat')
        }, 1000);

      } catch (error) {
        console.error(error);

      }
    }
  }
  ngAfterViewInit() {
    this.logoAnimation();
  }


  logoAnimation() {
    const logoContainer = document.getElementById('logo');
    const logoText = document.getElementById('title');
    const intro = document.getElementById('intro');
    const logo = document.getElementById('logoSmall');
    const logoDiv = document.getElementById('logoDiv');
    setTimeout(() => {
      logoContainer?.classList.add('moveLeft');
    }, 1000);
    setTimeout(() => {
      logoText?.classList.add('showTitle');
    }, 1400);
    setTimeout(() => {
      intro?.classList.add('hideIntro');
    }, 4000);
    setTimeout(() => {
      logo?.classList.add('moveToCorner');
      logoDiv?.classList.add('moveToCorner');
    }, 4200);

    setTimeout(() => {
      intro?.classList.add('d_none');
    }, 4400);
  }

  guestLogin() {
    this.guest = true;
    const guestID = this.messageService.generateFirestoreID();
    const currentUser = {
      name: 'Gast',
      online: true,
      avatar: './img/avatare/avatar2.svg',
      id: guestID,
    }
    localStorage.setItem('user', JSON.stringify(currentUser));
    setTimeout(() => {
      this.sharedservice.navigateToPath('/chat');
    }, 1000);
  }
}
