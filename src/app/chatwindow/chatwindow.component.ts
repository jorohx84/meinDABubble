import { Component, inject, Injectable, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { Message } from '../models/message.class';
import { Firestore, doc, updateDoc, arrayUnion, onSnapshot } from '@angular/fire/firestore';
import { SearchService } from '../search.service';
import { MessageService } from '../message.service';
import { ProfileComponent } from '../profile/profile.component';
import { EditchannelComponent } from '../editchannel/editchannel.component';
import { ReactionService } from '../reactions.service';

@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chatwindow',
  imports: [CommonModule, FormsModule, ProfileComponent, EditchannelComponent],
  templateUrl: './chatwindow.component.html',
  styleUrl: './chatwindow.component.scss'
})
export class ChatwindowComponent {
  @ViewChild('lastMessage', { static: false }) private lastMessageElement?: ElementRef | undefined;
  messageService = inject(MessageService);
  sharedservice = inject(SharedService);
  userService = inject(UserService)
  channelService = inject(ChannelService);
  searchService = inject(SearchService);
  firestore = inject(Firestore)
  reactionService = inject(ReactionService);
  currentReciever: any;
  currentUser: any;
  currentChat: string = '';
  loadDataSubscription: Subscription | null = null;
  isNewMessage: boolean = true;
  isChannel: boolean = false;
  isPersonalChat: boolean = false;
  message: string = '';
  isClicked: boolean = false;
  currentList: any[] = [];
  currentMessages: any[] = [];
  users: any[] = [];
  channels: any[] = [];
  isChannelList: boolean = false;
  isEmpty: boolean = false;
  isYou: boolean = false;
  userID: string = '';
  isSearch: boolean = false;

  searchInput: string = '';
  searchSubscription: Subscription | null = null;
  loadChannelSubscrition: Subscription | null = null;
  logoutSubscription: Subscription | null = null;
  userSubscription: Subscription | null = null;
  memberSubscription: Subscription | null = null;
  emptyChannelSubscribtion: Subscription | null = null;
  searchList: any[] = [];
  isHeaderSearch: boolean = false;
  currentInput: string = '';
  threadLengths: number[] = [];
  editIndex: number = 0;

  constructor(private cdr: ChangeDetectorRef) {
    this.getDataFromDevspace();
    this.loadCurrentWindow();
  }


  ngAfterViewInit() {
    setTimeout(() => this.scrollToBottom(), 0);
  }


  private scrollToBottom(): void {
    this.lastMessageElement?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  async ngOnInit() {
    await this.loadChannels();
    await this.loadUsers();
    this.loadCurrentWindow();
    setTimeout(() => this.scrollToBottom(), 0);
    this.loadDataSubscription = this.sharedservice.loadChatWindow$.subscribe(() => {
      this.scrollToBottom();
      this.getDataFromDevspace();
      this.checkReciever();
      this.loadCurrentWindow();
      this.currentMessages = this.messageService.currentMessages;
    });

    this.searchSubscription = this.searchService.openSearchList$.subscribe((key) => {
      if (key = 'new') {
        this.isChannelList = this.searchService.isChannel;
      }
      this.showList();
    });

    this.loadChannelSubscrition = this.channelService.reloadChannel$.subscribe(async () => {
      await this.reloadChannels();
    });

    this.memberSubscription = this.sharedservice.closeMember$.subscribe(() => {
      this.isSearch = false;
    });

    this.logoutSubscription = this.sharedservice.logoutObserver$.subscribe(() => {
      this.currentChat = 'new';
      this.isNewMessage = true;
      localStorage.setItem('newMessageWindow', JSON.stringify(this.isNewMessage));
      localStorage.setItem('chat', this.currentChat);

    })

    this.userSubscription = this.sharedservice.userObserver$.subscribe(() => {
      this.currentUser = this.sharedservice.currentProfile;
      if (this.currentReciever.id === this.currentUser.id) {
        this.currentReciever = this.sharedservice.currentProfile;
      }
    })

    this.emptyChannelSubscribtion = this.channelService.loadEmptyChannel$.subscribe(() => {
      this.currentChat = 'new';
      this.loadCurrentWindow();
    })
    this.checkReciever();

  }



  searchForReciever() {
    this.searchService.getCurrentList(this.currentInput, this.users, this.channels);
    this.isClicked = this.searchService.isSearch;
    this.isHeaderSearch = this.searchService.isSearch
    this.currentList = this.searchService.currentList;
  }

  toggelFunction(index: number) {
    if (this.isHeaderSearch) {
      this.searchService.chooseReciver(index);
      this.isHeaderSearch = false;
      this.isClicked = false;
      this.currentInput = this.searchService.result;
      this.currentReciever = this.searchService.reciever;
      this.currentChat = this.searchService.currentChat;
      localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
      this.loadMessages();
      this.loadCurrentWindow();
      localStorage.setItem('chat', this.currentChat);
    } else {
      this.getReciever(index);
    }
  }


  async reloadChannels() {
    await this.loadChannels();
    this.currentMessages = [];
    this.currentChat = 'channel'
    this.loadCurrentWindow();
    const newChannelID = this.channelService.channelID;
    this.currentReciever = this.channels.find((channel: any) => channel.id === newChannelID);
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    this.loadMessages();

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

  getDataFromDevspace() {

    this.currentChat = this.getData('chat', this.sharedservice.chat);
    this.currentUser = this.getData('user', this.sharedservice.user);
    this.currentReciever = this.getData('reciever', this.sharedservice.reciever);
    if (this.currentReciever === null) {
      this.currentChat = 'new';
      localStorage.setItem('chat', this.currentChat);
    }
    this.loadMessages();
  }


  getData(key: string, value: any): any {
    if (value) {
      return value;
    } else {
      this.sharedservice.getDataFromLocalStorage(key);
      return this.sharedservice.data;
    }
  }


  loadCurrentWindow() {
    this.isPersonalChat = this.currentChat === 'user';
    this.isChannel = this.currentChat === 'channel';
    this.isNewMessage = this.currentChat === 'new';
    this.sharedservice.getDataFromLocalStorage('resize720');
    this.sharedservice.resize720 = this.sharedservice.data;
    if (this.isNewMessage) {
      this.currentMessages = [];
      this.isEmpty = false;
    }
  }

  getList() {
    const containsHash = this.message.includes('#');
    const containsAt = this.message.includes('@');
    this.isClicked = containsHash || containsAt;
    this.isChannelList = containsHash;
    const memberList: any = this.getcurrentUserList();
    this.currentList = containsHash ? this.channels : containsAt ? memberList : [];

    // Falls weder # noch @ enthalten sind, isClicked bleibt false und currentList bleibt leer.
    if (!containsHash && !containsAt) {
      this.isClicked = false;
    }
  }
  getcurrentUserList() {
    if (this.isChannel) {
      return this.currentReciever.members;
    } else {
      return this.users
    }

  }
  getReciever(index: number) {
    if (this.isChannelList) {
      const currentChannel = this.currentList[index];
      this.message = this.message + ' ' + '@' + currentChannel?.name;
    } else {
      const currentReciever = this.currentList[index];
      this.message = this.message + ' ' + '@' + currentReciever?.name;
    }
    this.isClicked = false;
  }

  toggleList(event: Event) {
    this.isChannelList = false;
    this.isClicked = !this.isClicked;
    if (this.isChannel) {
      this.currentList = this.currentReciever.members;
    } else {
      this.currentList = this.users;
    }
    event.stopPropagation();
  }

  isUser(message: any) {
    return message.from === this.currentUser.id;
  }

  isNewDay(currentMessage: any, previousMessage: any) {
    if (!previousMessage) {
      return true;
    }
    const currentDate = new Date(currentMessage.time).toDateString();
    const previousDate = new Date(previousMessage.time).toDateString();
    const today = new Date().toDateString();

    return currentDate !== previousDate;
  }

  isToday(date: string) {
    const today = new Date().toDateString();
    const messageDate = new Date(date);
    return today === messageDate.toDateString();
  }


  async sendMessage(event: Event) {
    await this.messageService.sendMessage(this.message, this.currentUser, this.currentReciever, this.currentChat);
    this.isEmpty = false;
    this.message = '';
    this.currentInput = '';
    this.scrollToBottom();
    event.stopPropagation();
  }


  loadMessages() {
    this.messageService.loadMessages(this.currentUser, this.currentReciever, this.currentChat).subscribe((messages: any) => {
      this.currentMessages = messages;
      //this.formatMessage(messages);
      this.sortMessages();
      this.checkMessages();


    });

  }

  checkReciever() {
    if (this.currentReciever) {
      if (this.currentReciever.id === this.currentUser.id) {
        this.isYou = true;
      } else {
        this.isYou = false;
      }

    }
  }

  sortMessages() {
    this.currentMessages.sort((a: any, b: any) => {
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);
      return timeA.getTime() - timeB.getTime();
    });
  }

  checkMessages() {
    if (this.currentMessages.length === 0) {
      this.isEmpty = true;
    } else {
      this.isEmpty = false;
    }
  }

  async openThread(message: any, index: number, event: Event) {
    this.sharedservice.setReciever(this.currentReciever);
    this.sharedservice.setUser(this.currentUser);
    await this.messageService.setMessage(message, index, this.currentReciever);
    this.sharedservice.initializeThread('');
    event.stopPropagation();
  }



  openList() {
    this.searchService.openMemberList(this.searchInput, this.users);
  }

  showList() {
    this.sharedservice.openSearch = this.searchService.searchIsOpen;
    this.searchList = this.searchService.currentList;

  }

  closeThread() {
    this.sharedservice.initializeThread('close');
  }

  findMember(index: number) {
    this.searchService.setMember(index);
    this.searchInput = this.searchService.currentMember.name;
    this.sharedservice.openSearch = false;
  }
  async addPerson() {
    if (this.searchInput.length > 0) {


      await this.searchService.addMember(this.currentReciever);
      this.searchInput = '';
      this.sharedservice.isSearch = false;
      this.sharedservice.isOverlay = false;
      await this.loadChannels();
      const currentChannel = this.channels.find(channel => channel.id === this.currentReciever.id);
      localStorage.setItem('reciever', JSON.stringify(currentChannel));
      this.currentReciever = currentChannel;
      if (this.sharedservice.checkLowerWidth(540)) {
        this.openEditChannel();
        this.sharedservice.transformSearch = false;
      }
    }
  }

  openProfile() {
    this.sharedservice.isProfileOpen = true;
    this.sharedservice.isReceiver = true;
    this.sharedservice.isRecieverProfile = true;
    this.sharedservice.currentProfile = this.currentReciever;
    this.sharedservice.isOverlay = true;
    this.sharedservice.isMember = true;
  }


  openEditChannel() {
    this.sharedservice.isOverlay = true;
    this.sharedservice.isEdit = true;
    this.sharedservice.triggerEditChannel(this.currentReciever);
  }

}