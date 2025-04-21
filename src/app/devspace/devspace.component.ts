
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Injectable, Output, output } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { SharedService } from '../shared.service';
import { Router } from '@angular/router';
import { findIndex, Subscription } from 'rxjs';
import { MessageService } from '../message.service';
import { SearchService } from '../search.service';
import { FormsModule } from '@angular/forms';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-devspace',
  imports: [CommonModule, FormsModule],
  templateUrl: './devspace.component.html',
  styleUrl: './devspace.component.scss'
})
export class DevspaceComponent {
  messageService = inject(MessageService);
  searchService = inject(SearchService);
  public channels: any = [];
  public users: any = [];
  active: boolean = false;
  message: boolean = false;
  userService = inject(UserService);
  channelService = inject(ChannelService)
  firestore = inject(Firestore);
  sharedservice = inject(SharedService)
  relaodSubscription: Subscription | null = null
  userSubscription: Subscription | null = null
  emptyChannelSubscribtion: Subscription | null = null
  router: Router = inject(Router);
  currentUser: any = [];
  currentReceiver: any;
  userID: string = '';
  currentChat: string = '';
  @Output() initializedView = new EventEmitter<void>();

  constructor() {
    this.sharedservice.getUserFromLocalStorage();
    this.currentUser = this.sharedservice.user;

    this.sharedservice.getDataFromLocalStorage('active');
    this.active = this.sharedservice.data;
    this.sharedservice.getDataFromLocalStorage('directMessages');
    this.message = this.sharedservice.data;
  }

  async ngOnInit() {
    this.initializedView.emit();
    await this.loadUsers();
    await this.loadChannels();
    this.relaodSubscription = this.channelService.reloadChannel$.subscribe(() => {

      this.loadChannels();

    })
    this.userSubscription = this.sharedservice.userObserver$.subscribe(async () => {
      this.currentUser = this.sharedservice.currentProfile;
      await this.loadUsers();
      await this.loadChannels();

    })
    this.emptyChannelSubscribtion = this.channelService.loadEmptyChannel$.subscribe(() => {
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
      const channelData = await this.channelService.getChannels();

      this.channelService.findChannels(channelData, this.currentUser);
      this.channels = this.channelService.channels;
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }



  async openChannel(index: any) {
    console.log(index);
    //hier mus eine funktion im messagesservice aufgerufen werden der die akutellen messages lädt und im ls speichert
    this.currentReceiver = this.channels[index];
    this.currentChat = 'channel';
    this.sharedservice.getReciever(this.currentReceiver, this.currentUser, this.currentChat);
    await this.messageService.getCurrentMessages(this.currentUser, this.currentReceiver, this.currentChat);
    this.sharedservice.loadChat();
    if (window.innerWidth <= 1050) {
      this.sharedservice.toogleDevspace();
    }

  }

  async openPersonalChat(index: any) {
    console.log(index);

    //hier mus eine funktion im messagesservice aufgerufen werden der die akutellen messages lädt und im ls speichert
    this.currentReceiver = this.users[index];
    this.currentChat = 'user';
    this.sharedservice.getReciever(this.currentReceiver, this.currentUser, this.currentChat);
    await this.messageService.getCurrentMessages(this.currentUser, this.currentReceiver, this.currentChat);
    this.sharedservice.loadChat();
    if (window.innerWidth <= 1050) {
      this.sharedservice.toogleDevspace();
    }
  }

  openNewMessage() {
    this.currentChat = 'new';
    this.sharedservice.getReciever(this.currentReceiver, this.currentUser, this.currentChat);
    this.sharedservice.loadChat();
  }

  toggleActive() {
    this.active = !this.active;
    localStorage.setItem('active', JSON.stringify(this.active));
  }

  toggleMessage() {
    this.message = !this.message;
    localStorage.setItem('directMessages', JSON.stringify(this.message));
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
    this.sharedservice.toogleDevspace();
  }

  closeThread() {
    this.sharedservice.initializeThread('close')
  }

  openChats(index: number) {
    const searchedObject = this.searchService.currentList[index];
    console.log(searchedObject);
    const searchID = searchedObject.id;
    console.log(searchID);


    if (this.searchService.isChannel === true) {
      const currentIndex = this.channels.findIndex((object: any) => object.id === searchID);
      console.log(currentIndex);
      this.openChannel(currentIndex);
    } else {

      const currentIndex = this.users.findIndex((object: any) => object.id === searchID);
      console.log(currentIndex);
      this.openPersonalChat(currentIndex);
    }
    this.sharedservice.devSlide = true;
  }


  test() {
    console.log('juhu es funtkioniert');

  }
}
