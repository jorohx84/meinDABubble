
import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { SharedService } from '../shared.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [CommonModule],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {

  public channels: any = [];
  public users: any = [];
  active: boolean = false;
  message: boolean = false;
  userService = inject(UserService);
  channelService=inject(ChannelService)
  firestore = inject(Firestore);
sharedservice=inject(SharedService)
  router: Router = inject(Router);
  currentUser: any = [];
  currentReceiver: any;
  userID: string = '';
  currentChannel: any;

  constructor() {
    this.sharedservice.getUserFromLocalStorage();
    this.userID = this.sharedservice.user.uid;

  }

 

  async loadCurrenUser() {
    this.currentUser = await this.userService.getCurrentUser(this.userID);
  }


  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();
    await this.loadCurrenUser();
    
  
  }

  async loadUsers() {
    try {
      this.users = await this.userService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  async loadChannels() {
    try {
      this.channels = await this.channelService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }


/*
  openChannel(index: any) {
    this.currentChannel = this.channels[index];
    this.userService.getChannel(this.currentChannel, this.currentUser);
  }

  openPersonalChat(index: any) {
    this.currentReceiver = this.users[index];
    this.userService.getReciepent(this.currentReceiver, this.currentUser);
  }
*/
  toggleActive() {
    this.active = !this.active;
  }

  toggleMessage() {
    this.message = !this.message;
  }

  isOpen() {
    return this.message === true;
  }

  isActive() {
    return this.active === true;
  }
/*
  openWindow(window: string) {
    this.userService.loadComponent(window);
  }

  openDropdown() {
    if (this.userService.channelType === 'channel') {
      this.active = true;
    }
    if (this.userService.channelType === 'direct') {
      this.message = true;
    }
  }
    */
}
