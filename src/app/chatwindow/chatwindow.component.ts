import { Component, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { ChannelService } from '../channel.service';
import { Message } from '../models/message.class';
import { Firestore, doc, updateDoc, arrayUnion, onSnapshot } from '@angular/fire/firestore';


@Component({
  selector: 'app-chatwindow',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatwindow.component.html',
  styleUrl: './chatwindow.component.scss'
})
export class ChatwindowComponent {
  sharedservice = inject(SharedService);
  userService = inject(UserService)
  channelService = inject(ChannelService)
  firestore = inject(Firestore)
  currentReciever: any;
  currentUser: any;
  currentChat: string = '';
  loadDataSubscription: Subscription | null = null;
  isNewMessage: boolean = false;
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
  constructor() {

    
    this.getDataFromDevspace();
    this.loadCurrentWindow();
    //this.sharedservice.getUserFromLocalStorage();
    //this.userID = this.sharedservice.user.uid;
 
  }


  async ngOnInit() {
    await this.loadCurrentUser();
    await this.loadChannels();
    await this.loadUsers();
    this.loadDataSubscription = this.sharedservice.loadChatWindow$.subscribe(() => {
      this.getDataFromDevspace();
      this.loadCurrentWindow();

    });
    
  
    

  }

  async loadCurrentUser() {
    //this.currentUser = await this.userService.getCurrentUser(this.userID);
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
    //this.checkReciever();
    this.loadMessages()
  }


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
      this.currentMessages=[];
    }

    console.log('newMessage ist ' + this.isNewMessage);
    console.log('channel ist ' + this.isChannel);
    console.log('personalchat ist ' + this.isPersonalChat);


  }


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

  getReciever(index: number) {


    if (this.isChannelList) {
      const currentChannel = this.currentList[index];
      this.message = this.message + currentChannel?.name;
    } else {
      const currentReciever = this.currentList[index];
      this.message = '@' + currentReciever?.name;
    }
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
    
    let collection;
    if (this.message === '' || !this.currentReciever.id || !this.currentUser.id) {
      return;
    }

    if (this.currentChat === 'channel') {
      collection = 'channels'
    }
    if (this.currentChat === 'user') {
      collection = 'users'
    }
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

    this.isEmpty = false;
    this.message = '';
  }

  createMessageData(message: Message) {
    return {
      name: message.name,
      photo: message.photo,
      content: message.content,
      time: message.time.toISOString(),
      from: message.from,
      to: message.to,
    };
  }
  checkReciever() {
    if (this.currentReciever.id === this.currentUser.id) {
      this.isYou = true;
    } else {
      this.isYou = false;
    }
  }


 loadMessages(){
  console.log('HAAAAAALLLLLLLLLOOOOOOOOO');
  
  console.log(this.currentChat);
  
  if (this.currentChat==='user') {
    this.loadUserMessages();
  } 
  if (this.currentChat==='channel') {
    this.loadChannelMessages();
  }
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
    console.log(this.currentUser);
    
    const messagesRef = doc(this.firestore, `users/${this.currentUser.id}`);
    onSnapshot(messagesRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const messageData = docSnapshot.data();
        const messages = messageData['messages'] || [];
        this.currentMessages = [];
        messages.forEach((message: any) => {
          if (this.currentUser.id === this.currentReciever.id) {
            if (
              message['to'] === this.currentReciever.id &&
              message['from'] === this.currentReciever.id
            ) {
              this.currentMessages.push(message);
            }
          } else {
            if (
              message['to'] === this.currentReciever.id ||
              message['from'] === this.currentReciever.id
            ) {
              this.currentMessages.push(message);
            }
          }
        });

        this.sortMessages();
        this.checkMessages();
      } else {
        console.log('Benutzerdokument existiert nicht.');
      }
    });
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

}