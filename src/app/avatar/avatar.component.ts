import { Component, inject } from '@angular/core';
import { UserService } from '../user.service';
import { User } from '../models/user.class';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { SharedService } from '../shared.service';
import { FooterComponent } from '../footer/footer.component';
@Component({
  selector: 'app-avatar',
  imports: [CommonModule, FooterComponent],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  userservice = inject(UserService)
  sharedservice = inject(SharedService)
  currentUser: any;
  image: string = '';
  auth = getAuth();
  avatarIndex: number | null = null
  isCreate: boolean = false;
  avatars = [
    './img/avatare/avatar1.svg',
    './img/avatare/avatar2.svg',
    './img/avatare/avatar3.svg',
    './img/avatare/avatar4.svg',
    './img/avatare/avatar5.svg',
    './img/avatare/avatar6.svg',
  ]


  constructor(public firestore: Firestore) {
    if (this.userservice.user === undefined) {
      this.currentUser = this.userservice.user;
    } else {
      this.sharedservice.getDataFromLocalStorage('user');
      this.currentUser = this.sharedservice.data
    }
  }

  routeToSignin(path: string) {
    this.sharedservice.navigateToPath(path)
  }


  selectAvatar(path: string, index: number) {
    this.image = path;
    this.currentUser.avatar = this.image;
    this.checkIndex(index)
  }


  checkIndex(index: number) {
    this.avatarIndex = index;
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
            online: false,
            login: ''
          });
        });
      }).then(() => {
        this.isCreate = true;
        setTimeout(() => {
          this.isCreate = false
        }, 2000);
       
      })
      .then(() => {
        setTimeout(() => {
          this.sharedservice.navigateToPath('/login');
        }, 2000);
      })

  }

}
