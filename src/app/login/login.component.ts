import { Component, Inject, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user.class';
import { signInWithEmailAndPassword, Auth } from '@angular/fire/auth';
import { UserService } from '../user.service';
import { Firestore } from '@angular/fire/firestore';


@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  sharedservice = inject(SharedService);
  userservice = inject(UserService)
  user: User = new User();
  auth = inject(Auth)
  firestore = inject(Firestore);
  routeToSignin(path: string) {
    this.sharedservice.navigateToPath(path);
  }

  async login() {
    console.log('login erfolgreich');
    try {
      await signInWithEmailAndPassword(this.auth, this.user.email, this.user.password);
      this.userservice.setOnlineStatus('login');
      await this.userservice.getCurrentUser(this.userservice.user.uid);
      await this.userservice.setLoginTime();
      this.sharedservice.navigateToPath('/chat')
    } catch (error) {
      console.log(error);

    }

  }



}
