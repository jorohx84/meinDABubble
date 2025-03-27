import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.class';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  threadSubscription: Subscription | null = null;
  logoutSubscription: Subscription | null = null;
  sharedService = inject(SharedService);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  message: any;
  threadMessage: any;
  currentReciever: any;
  currentUser: any;
  isClicked: boolean = false;
  isChannelList: boolean = false;
  currentList: any[] = [];
  users: any[] = [];
  channels: any[] = [];

  constructor() {

    this.openThreadContent();
  }
  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();
    this.threadSubscription = this.sharedService.openThread$.subscribe(() => {
      console.log('openThread ausgelöst!');
      this.openThreadContent();
    })

    this.logoutSubscription = this.sharedService.logoutObserver$.subscribe(() => {
      this.message = null;
      localStorage.setItem('message', JSON.stringify(this.message));
    });

  }
  ngOnDestroy() {
    if (this.threadSubscription) {
      this.threadSubscription.unsubscribe();
    }
  }
  openThreadContent() {
    if (this.sharedService.user && this.sharedService.reciever && this.sharedService.message) {
      this.setData();
    } else {
      this.reloadDataFromLocalStorage();
    }

    localStorage.setItem('message', JSON.stringify(this.message));
  }

  setData() {
    this.message = this.sharedService.message;
    this.currentUser = this.sharedService.user;
    this.currentReciever = this.sharedService.reciever;
    console.log('Daten direkt geladen', this.currentReciever, this.currentUser);

  }
  reloadDataFromLocalStorage() {
    this.sharedService.getDataFromLocalStorage('user');
    this.currentUser = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('reciever');
    this.currentReciever = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('message');
    this.message = this.sharedService.data;
    console.log('Daten aus localStorage geladen', this.currentReciever, this.currentUser);
  }


  getReciever(index: number, event:Event) {
    if (this.isChannelList) {
      const currentChannel = this.currentList[index];
      this.threadMessage = this.threadMessage + currentChannel?.name.replace(/ /g, '');;
    } else {
      const currentReciever = this.currentList[index];
      this.threadMessage = this.threadMessage + currentReciever?.name.replace(/ /g, '');;
    }
    this.isClicked = false;
    event.stopPropagation();
  }

  getList(event:Event) {
    const containsHash = this.threadMessage.includes('#');
    const containsAt = this.threadMessage.includes('@');
    this.isClicked = containsHash || containsAt;
    this.isChannelList = containsHash;
    this.currentList = containsHash ? this.channels : containsAt ? this.users : [];
    if (!containsHash && !containsAt) {
      this.isClicked = false;
    }
event.stopPropagation();
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

  toggleList(event: Event) {
    this.isChannelList = false;
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
    event.stopPropagation();
  }

  sendThreadMessage(){
    console.log(this.message);
    
    console.log(this.currentUser);
    console.log(this.currentReciever);
    console.log(this.threadMessage);
     const messageObject = new Message(this.currentUser.name || '', this.currentUser.avatar || '', this.threadMessage, this.currentUser.id, this.message.from);
  console.log(messageObject);
  
     this.threadMessage='';
    }

    closeThread(){

    }
}