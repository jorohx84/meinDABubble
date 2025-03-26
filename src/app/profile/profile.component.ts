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
  isRecieverProfile: boolean = false;
  recieverSubscription: Subscription | null = null;
  isEdit: boolean = false;
  input: string = '';
  constructor() { }

  ngOnInit() {

    this.recieverSubscription = this.sharedService.recieverObserver$.subscribe(() => {
      this.currentProfile = this.sharedService.currenProfile;
      this.isRecieverProfile = this.sharedService.isReceiver;
      console.log(this.isRecieverProfile);
      console.log(this.currentProfile);


    })
  }



  closeProfile() {
    this.sharedService.profileObserve('');
    console.log(this.isRecieverProfile);

    if (this.isRecieverProfile === true) {
      this.sharedService.openOverlay();

    }
    this.isRecieverProfile = false;
  }

  editProfile(){
this.isEdit=!this.isEdit;
  }

  closeEdit(){
    this.isEdit=false;
  }


  async saveChanges() {
    console.log(this.input);
    console.log(this.currentProfile);
    console.log(this.currentProfile.id);
    const profileDocRef = doc(this.firestore, `users/${this.currentProfile.id}`);
    console.log(profileDocRef);
    await updateDoc(profileDocRef, {
      name: this.input,
    });
    this.currentProfile = await this.userService.getCurrentUser(this.currentProfile.id);

    console.log(this.currentProfile);
    this.sharedService.currenProfile = this.currentProfile;
    this.sharedService.userObserve();
    localStorage.setItem('user', JSON.stringify(this.currentProfile));
    this.input=''
    this.isEdit=false;
  
  }
}
