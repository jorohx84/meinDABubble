import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.class';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { MessageService } from '../message.service';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  threadSubscription: Subscription | null = null;
  logoutSubscription: Subscription | null = null;
  firestore = inject(Firestore);
  sharedService = inject(SharedService);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  messageService = inject(MessageService);
  message: any;
  threadMessage: any;
  currentReciever: any;
  currentUser: any;
  isClicked: boolean = false;
  isChannelList: boolean = false;
  currentList: any[] = [];
  users: any[] = [];
  channels: any[] = [];
  currentIndex: number = 0;
  currentMessages: any[] = [];
  threadStarts: boolean = false;
  constructor(private cdRef: ChangeDetectorRef) {

    this.openThreadContent();
  }
  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();
    this.threadSubscription = this.sharedService.openThread$.subscribe(async (key) => {

      console.log(key);
      if (key === 'close') {
        this.threadStarts = false;
      } else {
        this.threadStarts = true;

        localStorage.setItem('threadStarts', JSON.stringify(this.threadStarts));
        console.log('openThread ausgelöst!');
        await this.loadUsers();
        await this.loadChannels();
        await this.openThreadContent();
      }

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

  async openThreadContent() {
    this.sharedService.getDataFromLocalStorage('threadStarts');
    this.threadStarts = this.sharedService.data;
    if (this.sharedService.user && this.sharedService.reciever && this.sharedService.message && this.sharedService.messageIndex) {
      this.setData();
    } else {
      this.reloadDataFromLocalStorage();
    }
    if (this.currentReciever) {
      this.currentReciever = await this.channelService.setCurrentReciever(this.currentReciever.id);
    }


    this.loadThreadMessages();

  }

  setData() {
    this.message = this.sharedService.message;
    this.currentIndex = this.sharedService.messageIndex;
    this.currentUser = this.sharedService.user;
    this.currentReciever = this.sharedService.reciever;
    console.log('Daten direkt geladen', this.currentReciever, this.currentUser);
    console.log(this.currentReciever);

  }
  reloadDataFromLocalStorage() {
    this.sharedService.getDataFromLocalStorage('user');
    this.currentUser = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('reciever');
    this.currentReciever = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('message');
    this.message = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('messageIndex');
    this.currentIndex = this.sharedService.data
    console.log('Daten aus localStorage geladen', this.currentReciever, this.currentUser);
  }


  getReciever(index: number, event: Event) {
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

  getList(event: Event) {
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

  async sendThreadMessage() {
    const messageObject = new Message(this.currentUser.name || '', this.currentUser.avatar || '', this.threadMessage, this.currentUser.id, this.message.from);
    const messageData = this.messageService.createMessageData(messageObject);
    const THREAD = this.currentReciever.messages[this.currentIndex].thread;
    THREAD.push(messageData);
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    await this.messageService.updateThreadMessages(this.currentReciever);
    this.message = this.currentReciever.messages[this.currentIndex];
    localStorage.setItem('message', JSON.stringify(this.message));
    this.threadMessage = '';

  }

  loadThreadMessages() {
    if (this.threadStarts && this.currentReciever) {
      this.messageService.loadChannelMessages(this.currentReciever).subscribe((messages: any) => {
        if (messages.length > 0) {
          this.currentMessages = messages[this.currentIndex].thread;
        }


      });
    }
  }

  closeThread() {
    this.sharedService.initializeThread('close');
    this.threadStarts = false;
    localStorage.setItem('threadStarts', JSON.stringify(this.threadStarts));
  }

  isUser(message: any) {
    return message.from === this.currentUser.id;
  }
}