import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  sharedService = inject(SharedService);
  userService = inject(UserService);
  currentUser: any;
  isRecieverProfile: boolean = false;
  recieverSubscription: Subscription | null = null;
  constructor() {
    this.loadCurrentUser();


  }

  ngOnInit() {

    this.recieverSubscription = this.sharedService.recieverObserver$.subscribe(() => {

      this.isRecieverProfile = this.sharedService.isReceiver;
      console.log(this.isRecieverProfile);
      
    })
  }

  loadCurrentUser() {
    this.sharedService.getDataFromLocalStorage('user');
    this.currentUser = this.sharedService.data;
    console.log(this.currentUser);

  }



  closeProfile() {
    this.sharedService.profileObserve('');
    console.log(this.isRecieverProfile);

    if (this.isRecieverProfile===true) {
    this.sharedService.openOverlay();

    }
    this.isRecieverProfile = false;
  }

}
