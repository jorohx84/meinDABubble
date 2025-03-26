import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { UserService } from '../user.service';
@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
sharedService=inject(SharedService);
userService=inject(UserService);
currentUser:any;
isRecieverProfile:boolean=false;

constructor(){
  this.loadCurrentUser();


}

loadCurrentUser(){
this.sharedService.getDataFromLocalStorage('user');
this.currentUser=this.sharedService.data;
console.log(this.currentUser);

}

closeProfile(){
  this.sharedService.generalObserve();
}

}
