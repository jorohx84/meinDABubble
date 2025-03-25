import { Component, inject } from '@angular/core';
import { UserService } from '../user.service';
import { User } from '../models/user.class';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { SharedService } from '../shared.service';
@Component({
  selector: 'app-avatar',
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  userservice = inject(UserService)
  sharedservice = inject(SharedService)
  currentUser: any;
  image: string = '';
  auth = getAuth();

  avatars = [
    './img/avatare/avatar1.svg',
    './img/avatare/avatar2.svg',
    './img/avatare/avatar3.svg',
    './img/avatare/avatar4.svg',
    './img/avatare/avatar5.svg',
    './img/avatare/avatar6.svg',
  ]
  constructor(public firestore: Firestore) {
    this.currentUser = this.userservice.user;
  }

  routeToSignin(path: string) {
    this.sharedservice.navigateToPath(path)
  }

  selectAvatar(path: string) {
    this.image = path;
    this.currentUser.avatar = this.image;
    console.log(this.currentUser);

  }

  async createUser() {
    await createUserWithEmailAndPassword(this.auth, this.currentUser.email, this.currentUser.password)
      .then((userCredential) => {
        const user = userCredential.user;
        return updateProfile(user, {
          displayName: this.currentUser.name,
          photoURL: this.currentUser.avatar,
        }).then(() => {
          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          return setDoc(userDocRef, {
            name: this.currentUser.name,
            email: this.currentUser.email,
            avatar: this.currentUser.avatar,
            messages: [],
            channels:[],
            online: false,
            logout:''
          });
        });
      })
      .then(()=>{
        setTimeout(()=>{
          this.sharedservice.navigateToPath('/login');
        }, 2000);
      })
  }
}
