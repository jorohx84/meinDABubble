import { Component, inject, Injectable, ElementRef, ViewChild, AfterViewInit, AfterViewChecked,ChangeDetectorRef } from '@angular/core';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { Message } from '../models/message.class';
import { Firestore, doc, updateDoc, arrayUnion, onSnapshot } from '@angular/fire/firestore';
import { SearchService } from '../search.service';
import { MessageService } from '../message.service';
@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chatwindow',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatwindow.component.html',
  styleUrl: './chatwindow.component.scss'
})
export class ChatwindowComponent implements AfterViewChecked {
  @ViewChild('chatContainer', { static: false }) private chatContainer: ElementRef | undefined;
  messageService = inject(MessageService);
  sharedservice = inject(SharedService);
  userService = inject(UserService)
  channelService = inject(ChannelService);
  searchService = inject(SearchService);
  firestore = inject(Firestore)
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
  isEmpty: boolean = true;
  isYou: boolean = false;
  userID: string = '';
  isSearch: boolean = false;
  openSearch: boolean = false;
  searchInput: string = '';
  searchSubscription: Subscription | null = null;
  loadChannelSubscrition: Subscription | null = null;
  logoutSubscription: Subscription | null = null;
  userSubscription: Subscription | null = null;
  memberSubscription: Subscription | null = null;
  searchList: any[] = [];
  isHeaderSearch: boolean = false;
  currentInput: string = '';

  constructor() {


    this.getDataFromDevspace();
    this.loadCurrentWindow();
    //this.sharedservice.getUserFromLocalStorage();
    //this.userID = this.sharedservice.user.uid;

  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }
  ngAfterViewChecked() {
    this.scrollToBottom();  // Hier führst du das Scrollen nach unten durch
  }

  scrollToBottom() {
    if (this.chatContainer && this.chatContainer.nativeElement) {
      const container = this.chatContainer.nativeElement;
      container.scrollToBottom = container.scrollHeight;
    }
  }

  async ngOnInit() {
    await this.loadChannels();
    await this.loadUsers();
    this.loadDataSubscription = this.sharedservice.loadChatWindow$.subscribe(() => {
      this.getDataFromDevspace();
      this.loadCurrentWindow();
      console.log(this.currentReciever);
      this.checkReciever();
    });
    this.searchSubscription = this.searchService.openSearchList$.subscribe((key) => {
      if (key = 'new') {
        this.isChannelList = this.searchService.isChannel;
        console.log(this.isChannelList);

      }
      this.showList();
    });

    this.loadChannelSubscrition = this.sharedservice.reloadChannel$.subscribe(async () => {
      await this.reloadChannels();
    });

    this.memberSubscription=this.sharedservice.closeMember$.subscribe(()=>{
      this.isSearch=false;
    });

    this.logoutSubscription = this.sharedservice.logoutObserver$.subscribe(() => {
      this.currentChat = 'new';
      this.isNewMessage=true;
      localStorage.setItem('newMessageWindow',JSON.stringify (this.isNewMessage));
      localStorage.setItem('chat', this.currentChat);

    })

    this.userSubscription = this.sharedservice.userObserver$.subscribe(() => {
      this.currentUser = this.sharedservice.currenProfile;
      if (this.currentReciever.id === this.currentUser.id) {
        this.currentReciever = this.sharedservice.currenProfile;
      }
    })
    this.checkReciever();

  }



  searchForReciever() {
    this.searchService.getCurrentList(this.currentInput, this.users, this.channels);
    this.isClicked = this.searchService.isSearch;
    this.isHeaderSearch = this.searchService.isSearch
    console.log(this.isHeaderSearch);
    this.currentList = this.searchService.currentList;
    console.log(this.currentList);

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
    const newChannelID = this.sharedservice.channelID;
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
  /*
    getDataFromDevspace() {
  
      if (this.sharedservice.chat) {
        this.currentChat = this.sharedservice.chat;
      } else {
        this.sharedservice.getDataFromLocalStorage('chat');
        this.currentChat = this.sharedservice.data;
      }
      if (this.sharedservice.user) {
        this.currentUser = this.sharedservice.user;
      } else {
        this.sharedservice.getDataFromLocalStorage('user');
        console.log(this.sharedservice.data);
        this.currentUser = this.sharedservice.data
      }
      if (this.sharedservice.reciever) {
        this.currentReciever = this.sharedservice.reciever;
      } else {
        this.sharedservice.getDataFromLocalStorage('reciever');
        this.currentReciever = this.sharedservice.data;
      }
      if (this.currentReciever === null) {
        this.currentChat = 'new'
        localStorage.setItem('chat', this.currentChat);
      }
      console.log(this.currentChat);
  
      this.loadMessages()
    }
      */
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

    if (this.isNewMessage) {
      this.currentMessages = [];
      this.isEmpty = false;
    }
  }
  /*
    loadCurrentWindow() {
      if (this.currentChat === 'user') {
        this.isPersonalChat = true;
        this.isChannel = false;
        this.isNewMessage = false
      }
      if (this.currentChat === 'channel') {
        this.isPersonalChat = false;
        this.isChannel = true;
        this.isNewMessage = false
      }
      if (this.currentChat === 'new') {
        this.isPersonalChat = false;
        this.isChannel = false;
        this.isNewMessage = true
        this.currentMessages = [];
        this.isEmpty = false;
  
      }
    }
  */

  getList() {
    const containsHash = this.message.includes('#');
    const containsAt = this.message.includes('@');

    this.isClicked = containsHash || containsAt;
    this.isChannelList = containsHash;
    this.currentList = containsHash ? this.channels : containsAt ? this.users : [];

    // Falls weder # noch @ enthalten sind, isClicked bleibt false und currentList bleibt leer.
    if (!containsHash && !containsAt) {
      this.isClicked = false;
    }
  }
  /*
    getList() {
      if (this.message.includes('#')) {
        this.currentList = this.channels;
        this.isClicked = true;
        this.isChannelList = true;
      }
      if (this.message.includes('@')) {
        this.isClicked = true;
        this.currentList = this.users;
        this.isChannelList = false;
      }
      if (
        this.message === '' ||
        (!this.message.includes('#') && !this.message.includes('@'))
      ) {
        this.isClicked = false;
      }
    }
  */

  getReciever(index: number) {
    if (this.isChannelList) {
      const currentChannel = this.currentList[index];
      this.message = this.message + currentChannel?.name.replace(/ /g, '');;
    } else {
      const currentReciever = this.currentList[index];
      this.message = this.message + currentReciever?.name.replace(/ /g, '');;
    }
    this.isClicked = false;
  }

  toggleList(event: Event) {
    this.isChannelList = false;
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
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


  async sendMessage() {
    await this.messageService.sendMessage(this.message, this.currentUser, this.currentReciever, this.currentChat);
    this.isEmpty = false;
    this.message = '';
    this.currentInput = '';
   
  }


  loadMessages() {
    this.messageService.loadMessages(this.currentUser, this.currentReciever, this.currentChat).subscribe((messages: any) => {
      this.currentMessages = messages;
      //this.formatMessage(messages);
      this.sortMessages();
      this.checkMessages();
    });

  }

  /*
    formatMessage(messages: any[]) {
      console.log(messages);
      messages.forEach((message) => {
        const content = message.content
        console.log(content);
  
        let wordArray = content.split(' ').map((word: any) => {
  
          return word;
  
        });
        console.log(wordArray);
        const editedContent=this.editWords(wordArray);
        console.log(editedContent);
        
        message.content = editedContent;
      });
      console.log(messages);
      
    }
  
    editWords(wordArray: any[]) {
      const editedContent = wordArray.map(word => {
        if (word.includes('@') || word.includes('#')) {
          return `<span class="highlight">${word}</span>`;
  
        } else {
          return word
        }
  
      });
      
      const formattedMessage = editedContent.join(' '); // Worte wieder mit Leerzeichen verbinden
      console.log(formattedMessage);
      return formattedMessage;
    }
      */
  /*
    async sendMessage() {
  
      let collection;
      if (this.message === '' || !this.currentReciever.id || !this.currentUser.id) {
        console.log('kein Sender oder Empfänger');
        return;
      }
      if (this.currentChat === 'channel') {
        collection = 'channels'
      }
      if (this.currentChat === 'user') {
        collection = 'users'
      }
      await this.saveMessages(collection);
      this.isEmpty = false;
      this.message = '';
    }
  
    async saveMessages(collection: any) {
      const message = new Message(this.currentUser.name || '', this.currentUser.avatar || '', this.message, this.currentUser.id, this.currentReciever.id);
      const messageData = this.createMessageData(message);
      const currentUserRef = doc(this.firestore, `${collection}/${this.currentUser.id}`);
      const currentReceiverRef = doc(this.firestore, `${collection}/${this.currentReciever.id}`);
      if (this.currentReciever.id !== this.currentUser.id) {
        await updateDoc(currentReceiverRef, {
          messages: arrayUnion(messageData),
        });
      }
      if (this.currentChat != 'channel') {
        await updateDoc(currentUserRef, {
          messages: arrayUnion(messageData),
        });
      }
    }
  
    createMessageData(message: Message) {
      return {
        name: message.name,
        photo: message.photo,
        content: message.content,
        time: message.time.toISOString(),
        from: message.from,
        to: message.to,
        thread: [],
      };
    }
  
  */
  checkReciever() {
    if (this.currentReciever) {
      if (this.currentReciever.id === this.currentUser.id) {
        this.isYou = true;
      } else {
        this.isYou = false;
      }
      console.log(this.isYou);
    }
  }
  /*
  
    loadMessages() {
      console.log(this.currentReciever);
      console.log(this.currentChat);
  
  
      if (this.currentChat === 'user') {
        this.loadUserMessages();
      }
      if (this.currentChat === 'channel') {
        this.loadChannelMessages();
      }
      this.checkReciever();
    }
  
  
    loadChannelMessages() {
      const channelMessagesRef = doc(this.firestore, `channels/${this.currentReciever.id}`);
      onSnapshot(channelMessagesRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const messageData = docSnapshot.data();
          const messages = messageData['messages'] || [];
          console.log(messages);
  
          this.currentMessages = messages;
          this.sortMessages();
          this.checkMessages();
        } else {
          console.log('Dokument existiert nicht');
        }
      });
    }
  
    loadUserMessages() {
      const messagesRef = doc(this.firestore, `users/${this.currentUser.id}`);
      onSnapshot(messagesRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const messageData = docSnapshot.data();
          const messages = messageData['messages'] || [];
          this.currentMessages = [];
          this.buildCurrentMessages(messages);
          this.sortMessages();
          this.checkMessages();
        } else {
          console.log('Benutzerdokument existiert nicht.');
        }
      });
    }
  
  
    buildCurrentMessages(messages: any) {
      messages.forEach((message: any) => {
        if (this.currentUser.id === this.currentReciever.id) {
          if (message['to'] === this.currentReciever.id && message['from'] === this.currentReciever.id) {
            this.currentMessages.push(message);
          }
        } else {
          if (message['to'] === this.currentReciever.id || message['from'] === this.currentReciever.id) {
            this.currentMessages.push(message);
          }
        }
      });
    }
  */
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

  openThread(message: any[], index:number, event: Event) {
    console.log(index);
    this.sharedservice.setReciever(this.currentReciever);
    this.sharedservice.setUser(this.currentUser);
    this.sharedservice.setMessage(message, index);
    this.sharedservice.initializeThread('');
    event.stopPropagation();
  }

  toggleSearch() {
    this.isSearch = !this.isSearch;
    this.sharedservice.openOverlay();

  }

  openList() {
    this.searchService.openMemberList(this.searchInput, this.users);
  }

  showList() {
    this.openSearch = this.searchService.searchIsOpen;
    this.searchList = this.searchService.currentList;

  }

  closeThread(){
    this.sharedservice.initializeThread('close');
  }

  findMember(index: number) {
    this.searchService.setMember(index);
    this.searchInput = this.searchService.currentMember.name;
    this.openSearch = false;
  }
  async addPerson() {
    await this.searchService.addMember(this.currentReciever);
    this.searchInput = '';
    this.isSearch = false;
    await this.loadChannels();
    const currentChannel = this.channels.find(channel => channel.id === this.currentReciever.id);
    localStorage.setItem('reciever', JSON.stringify(currentChannel));
    this.currentReciever = currentChannel;
  }

  openProfile() {
    this.sharedservice.openOverlay();
    this.sharedservice.isReceiver = true;
    console.log(this.currentReciever);
    this.sharedservice.currenProfile = this.currentReciever;
    this.sharedservice.profileObserve('receiver');
  }
}