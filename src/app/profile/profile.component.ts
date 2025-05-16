import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Firestore, arrayUnion, doc, updateDoc } from '@angular/fire/firestore';
@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  firestore = inject(Firestore)
  sharedService = inject(SharedService);
  userService = inject(UserService);
  currentProfile: any;

  recieverSubscription: Subscription | null = null;
  isEdit: boolean = false;
  input: string = '';
  constructor() { }

  ngOnInit() {
    this.recieverSubscription = this.sharedService.recieverObserver$.subscribe(() => {
      this.currentProfile = this.sharedService.currentProfile;
    })
  }


  editProfile() {
    this.isEdit = !this.isEdit;
  }

  
  closeEdit() {
    this.isEdit = false;
  }


  async saveChanges() {
    const profileDocRef = doc(this.firestore, `users/${this.currentProfile.id}`);
    await updateDoc(profileDocRef, {
      name: this.input,
    });
    this.currentProfile = await this.userService.findCurrentUser(this.currentProfile.id,);
    this.sharedService.currentProfile = this.currentProfile;
    this.sharedService.userObserve();
    localStorage.setItem('user', JSON.stringify(this.currentProfile));
    this.input = ''
    this.isEdit = false;

  }
}
