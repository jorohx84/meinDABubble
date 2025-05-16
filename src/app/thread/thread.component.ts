import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.class';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { Firestore, doc, updateDoc, getDocs, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { MessageService } from '../message.service';
import { ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ReactionService } from '../reactions.service';
import { addDoc, collection } from 'firebase/firestore';
@Component({
  selector: 'app-thread',
  imports: [CommonModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  @ViewChild('lastMessage', { static: false }) private lastMessageElement?: ElementRef | undefined;
  threadSubscription: Subscription | null = null;
  logoutSubscription: Subscription | null = null;
  firestore = inject(Firestore);
  sharedService = inject(SharedService);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  messageService = inject(MessageService);
  reactionService = inject(ReactionService);
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
  messageID: string = '';
  isIconBar: boolean = false;
  threadMenuBarIndex: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    this.loadThreadData();
    this.loadThreadMessages();
  }
  async ngOnInit() {
    setTimeout(() => this.scrollToBottom(), 0);
    this.threadSubscription = this.sharedService.openThread$.subscribe(async (key) => {
      if (key === 'close') {
        this.threadStarts = false;
      } else {
        await this.startThread();
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


  private scrollToBottom(): void {
    this.lastMessageElement?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }


  async startThread() {
    this.threadStarts = true;
    localStorage.setItem('threadStarts', JSON.stringify(this.threadStarts));
    this.loadThreadData();
    this.loadThreadMessages();

  }


  loadThreadData() {
    this.sharedService.getDataFromLocalStorage('threadStarts');
    this.threadStarts = this.sharedService.data;
    if (this.sharedService.user && this.sharedService.reciever && this.messageService.message && this.messageService.messageIndex && this.currentMessages.length > 0) {
      this.setData();
    } else {
      this.reloadDataFromLocalStorage();
    }
  }


  async setData() {
    this.currentMessages = this.messageService.currentThreadMessages;
    this.message = this.messageService.message;
    this.messageID = this.messageService.messageID;
    this.currentIndex = this.messageService.messageIndex;
    this.currentUser = this.sharedService.user;
    this.currentReciever = this.sharedService.reciever;
  }


  reloadDataFromLocalStorage() {
    this.sharedService.getDataFromLocalStorage('threadMessages');
    this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('user');
    this.currentUser = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('reciever');
    this.currentReciever = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('message');
    this.message = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('messageIndex');
    this.currentIndex = this.sharedService.data
    this.sharedService.getDataFromLocalStorage('messageID');
    this.messageID = this.sharedService.data;
  }


  getReciever(index: number, event: Event) {
    if (this.isChannelList) {
      const currentChannel = this.currentList[index];
      this.threadMessage = this.threadMessage + currentChannel?.name;
    } else {
      const currentReciever = this.currentReciever.members[index];
      this.threadMessage = this.threadMessage + ' ' + '@' + currentReciever?.name;
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
    this.getMessageID();
    const messagesDocRef = collection(this.firestore, `channels/${this.currentReciever.id}/messages/${this.messageID}/thread`);
    await addDoc(messagesDocRef, messageData);
    this.loadThreadMessages();
    await this.saveThreadLenght();
    this.threadMessage = '';
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    this.channelService.reloadChannelData(this.currentReciever.id);
    this.scrollToBottom();
  }


  getMessageID() {
    if (this.messageService.message) {
      this.messageID = this.messageService.message.id
    } else {
      this.sharedService.getDataFromLocalStorage('messageID');
      this.messageID = this.sharedService.data;
    }
  }


  async loadThreadMessages() {
    this.getMessageID()
    if (this.threadStarts && this.currentReciever) {
      const messagesCollection = collection(this.firestore, `channels/${this.currentReciever.id}/messages/${this.messageID}/thread`);
      const q = query(messagesCollection, orderBy('time', 'asc'));
      onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.currentMessages = messages;
        localStorage.setItem('threadMessages', JSON.stringify(messages));

      }, (error) => {
        console.error('Error loading thread messages:', error);
      });
    }

  }



  async saveThreadLenght() {
    const lastIndex = this.currentMessages.length - 1;
    const lastMessage = this.currentMessages[lastIndex];
    const ref = doc(this.firestore, `channels/${this.currentReciever.id}/messages/${this.messageID}`);
    await updateDoc(ref, {
      threadLength: this.currentMessages.length,
      lastMessage: lastMessage.time,
    })
  }


  closeThread() {
    this.sharedService.initializeThread('close');
    this.threadStarts = false;
    localStorage.setItem('threadStarts', JSON.stringify(this.threadStarts));
  }


  isUser(message: any) {
    return message.from === this.currentUser.id;
  }


  toogleIconBar() {
    this.isIconBar = !this.isIconBar;
  }


  toggleMenuBar(index: number) {
    if (this.threadMenuBarIndex === index) {
      this.threadMenuBarIndex = null;
    } else {
      this.threadMenuBarIndex = index;
    }
  }
}