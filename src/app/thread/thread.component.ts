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
import { ChangeDetectorRef } from '@angular/core';
import { ReactionService } from '../reactions.service';
import { addDoc, collection } from 'firebase/firestore';
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
  constructor(private cdRef: ChangeDetectorRef) {

    this.openThreadContent();
    //this.threadStarts = false;
    // localStorage.setItem('threadStarts', JSON.stringify(this.threadStarts));
  }
  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();


    //this.currentMessages = await this.getThreadData();
    console.log(this.currentMessages);
    this.threadSubscription = this.sharedService.openThread$.subscribe(async (key) => {


      if (key === 'close') {
        this.threadStarts = false;
      } else {
        this.threadStarts = true;
        this.currentMessages = this.messageService.currentThreadMessages;
        localStorage.setItem('threadStarts', JSON.stringify(this.threadStarts));
        console.log('openThread ausgelöst!');
        await this.loadUsers();
        await this.loadChannels();
        await this.openThreadContent();
        this.loadThreadMessages();
        console.log(this.currentMessages.length);

        if (this.currentMessages.length === 0) {
          this.sharedService.getDataFromLocalStorage('threadMessages');
          this.currentMessages = this.sharedService.data;
        } else {

        }

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
    if (this.sharedService.user && this.sharedService.reciever && this.sharedService.message && this.messageService.messageIndex) {
      await this.setData();
    } else {
      this.reloadDataFromLocalStorage();
    }
    if (this.currentReciever) {
      this.currentReciever = await this.channelService.setCurrentReciever(this.currentReciever.id);
    }

  }

  async setData() {
    //this.currentMessages = await this.getThreadData();
    this.message = this.sharedService.message;
    this.currentIndex = this.messageService.messageIndex;
    this.currentUser = this.sharedService.user;
    this.currentReciever = this.sharedService.reciever;
    console.log('Daten direkt geladen', this.currentReciever, this.currentUser);
    console.log(this.currentReciever);

  }
  reloadDataFromLocalStorage() {
    this.sharedService.getDataFromLocalStorage('threadMessages');
    this.currentMessages = this.sharedService.data;
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
  /*
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
      this.channelService.reloadChannelData(this.currentReciever.id);
    }
  */

  async sendThreadMessage() {
    const messageObject = new Message(this.currentUser.name || '', this.currentUser.avatar || '', this.threadMessage, this.currentUser.id, this.message.from);
    const messageData = this.messageService.createMessageData(messageObject);
    //const THREAD = this.currentReciever.messages[this.currentIndex].thread;
    //const messagesDocRef = collection(this.firestore, `channels/${this.currentReciever.id}/messages/`);

    this.getMessageID();

    const messagesDocRef = collection(this.firestore, `channels/${this.currentReciever.id}/messages/${this.messageID}/thread`);
    console.log(messagesDocRef);
    await addDoc(messagesDocRef, messageData);

    this.loadThreadMessages();
    await this.saveThreadLenght();
    this.threadMessage = '';

    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    this.channelService.reloadChannelData(this.currentReciever.id);


    /*
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    //await this.messageService.updateThreadMessages(this.currentReciever);
    this.message = this.currentReciever.messages[this.currentIndex];
    localStorage.setItem('message', JSON.stringify(this.message));
    this.threadMessage = '';
    
  */
  }

  getMessageID() {
    if (this.messageService.message) {
      this.messageID = this.messageService.message.id
      console.log('messageID geladen');
    } else {
      this.sharedService.getDataFromLocalStorage('messageID');
      this.messageID = this.sharedService.data;
      console.log('messageID aus dem localStorage geladen');

    }
    console.log(this.messageID);

  }
  /*
    async loadChannelData() {
      try {
        const messagesCollection = collection(this.firestore, `channels/${this.currentReciever.id}/messages/`);
        const userSnapshot = await getDocs(messagesCollection);
        return userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error('Error loading users:', error);
        throw error;
      }
  
    }
  */






  async loadThreadMessages() {
    this.getMessageID()

    if (this.threadStarts && this.currentReciever) {
      // Die Referenz zur Thread-Nachrichtensammlung
      const messagesCollection = collection(this.firestore, `channels/${this.currentReciever.id}/messages/${this.messageID}/thread`);

      // Eine Query erstellen, um nach 'time' zu sortieren (vom ältesten zum neuesten)
      const q = query(messagesCollection, orderBy('time', 'asc')); // 'asc' für aufsteigende Reihenfolge, d.h. ältere Nachrichten zuerst

      // Verwende onSnapshot, um Nachrichten in Echtzeit zu beobachten
      onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Jetzt sind die Nachrichten nach 'time' sortiert
        console.log('Nachrichten nach Zeit sortiert:', messages);

        // Update die UI oder speichere die Nachrichten
        this.currentMessages = messages;
        localStorage.setItem('threadMessages', JSON.stringify(messages));

      }, (error) => {
        console.error('Error loading thread messages:', error);
      });
    }

  }



  async saveThreadLenght() {
    console.log(this.messageID);
    console.log(this.message);
    const lastIndex = this.currentMessages.length - 1;
    console.log(lastIndex);
    const lastMessage = this.currentMessages[lastIndex];
    console.log(lastMessage);
    console.log(lastMessage.time);


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

  toogleIconBar(){
    this.isIconBar=!this.isIconBar;
  }

  
}