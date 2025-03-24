
import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { SharedService } from '../shared.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  channelService = inject(ChannelService)
  firestore = inject(Firestore);
  sharedservice = inject(SharedService)
  relaodSubscription: Subscription | null = null
  router: Router = inject(Router);
  currentUser: any = [];
  currentReceiver: any;
  userID: string = '';
  currentChat: string = '';


  constructor() {
    this.sharedservice.getUserFromLocalStorage();
    this.currentUser = this.sharedservice.user;

  }






  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();
    this.relaodSubscription = this.sharedservice.reloadChannel$.subscribe(() => {
      this.loadChannels();
    })


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
      console.log(this.currentUser);

      // this.channels=this.currentUser.channels;
      console.log(this.channels);

      console.log();

      const channelData = await this.channelService.getChannels();

      this.findChannels(channelData);
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  findChannels(channel: any[]) {
    console.log(channel);
    channel.forEach((object:any) => {
      if (object.creatorID === this.currentUser.id) {
        this.channels.push(object);
        console.log(this.channels);

      } else {
        object.members.forEach((member:any) => {
          console.log(member);
          
          if (member.id === this.currentUser.id) {
            this.channels.push(member);
          }
        })
      }


    })

  }

  openChannel(index: any) {
    this.currentReceiver = this.channels[index];
    this.currentChat = 'channel';
    this.sharedservice.getReciever(this.currentReceiver, this.currentUser, this.currentChat);
    this.sharedservice.loadChat();
  }

  openPersonalChat(index: any) {
    this.currentReceiver = this.users[index];
    this.currentChat = 'user';
    this.sharedservice.getReciever(this.currentReceiver, this.currentUser, this.currentChat);
    this.sharedservice.loadChat();
  }

  openNewMessage() {

    this.currentChat = 'new';
    this.sharedservice.getReciever(this.currentReceiver, this.currentUser, this.currentChat);
    this.sharedservice.loadChat();
  }

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

  showChannelOverlay() {
    this.sharedservice.openOverlayChannel();
  }

}
