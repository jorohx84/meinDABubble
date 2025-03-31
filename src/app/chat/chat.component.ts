import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../user.service';
import { SharedService } from '../shared.service';
import { Auth, user } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { DevspaceComponent } from '../devspace/devspace.component';
import { ChatwindowComponent } from '../chatwindow/chatwindow.component';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';
import { Firestore, collection, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { ThreadComponent } from '../thread/thread.component';
import { ProfileComponent } from '../profile/profile.component';

@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chat',
  imports: [CommonModule, DevspaceComponent, ChatwindowComponent, ThreadComponent, FormsModule, ProfileComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  auth = inject(Auth);

  userID: string = '';
  currentUser: any;
  currentReciever: any;
  channel!: Channel;
  firestore = inject(Firestore);
  userservice = inject(UserService);
  sharedservice = inject(SharedService);
  showChannel: boolean = false;
  private channelSubscription: Subscription | null = null;
  isOverlay: boolean = false;
  channelName: string = '';
  channelDescription: string = '';
  //private overlaySubscription: Subscription | null = null;
  private profileSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  isProfileOpen: boolean = false;
  isReceiver: boolean = false;
  userObserver = this.userservice.user$;
  threadIsOpen: boolean = false;
  threadSubscription: Subscription | null = null;
  

  constructor() {
    this.sharedservice.getDataFromLocalStorage('reciever')
    this.currentReciever = this.sharedservice.data;
    console.log(this.currentReciever);
    this.sharedservice.getDataFromLocalStorage('thread')
    this.threadIsOpen = this.sharedservice.data;
  }

  async ngOnInit() {
    this.loadCurrentUser();
    this.channelSubscription = this.sharedservice.openChannelOverlay$.subscribe(() => {
      this.toggleChannelOverlay();
    })

  //  this.overlaySubscription = this.sharedservice.openGeneralOverlay$.subscribe(() => {
    //  this.isOverlay = !this.isOverlay;
    //})

    this.profileSubscription = this.sharedservice.profileObserver$.subscribe((key) => {
      this.loadProfile(key);
    })

    this.userSubscription = this.sharedservice.userObserver$.subscribe(() => {
      this.currentUser = this.sharedservice.currentProfile;
 

    });
    this.threadSubscription = this.sharedservice.openThread$.subscribe((key:string) => {
      if (key==='close') {
        this.threadIsOpen = false;
      }else{
        this.threadIsOpen = true;
      }
      localStorage.setItem('thread', JSON.stringify(this.threadIsOpen));
    })

  }


  loadProfile(key: string) {
    if (key === 'receiver') {
      this.isProfileOpen = true;
      this.isReceiver = true;
      this.sharedservice.recieverObserve(key);
    } else {
      this.isReceiver = false;
      this.isProfileOpen = false;

    }
  }

  loadCurrentUser() {
    this.currentUser = this.userservice.getCurrentUser();


    if (this.currentUser) {

     
      console.log('user wurde direkt geladen', this.currentUser);

    } else {
      this.sharedservice.getUserFromLocalStorage();
      this.currentUser = this.sharedservice.user
      console.log('user wurde aud dem localStorage geladen', this.currentUser);
    }
  }


  ngOnDestroy(): void {
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
  }

  toggleChannelOverlay() {
    this.showChannel = !this.showChannel;
  }

 

  toggleProfile() {
    this.sharedservice.isReceiver = false;
    this.sharedservice.currentProfile = this.currentUser;
    this.sharedservice.isProfileOpen = !this.sharedservice.isProfileOpen
  }


  async createChannel() {
    if (!this.channelName) { return }
    const firstMember = this.getMember();
    const newChannel = new Channel(this.channelName, this.channelDescription, this.currentUser.name, this.currentUser.id, [firstMember], [], new Date().toISOString());
    await this.addChannelToFirestore(newChannel);
  }

  async addChannelToFirestore(newChannel: any) {
    try {
      const channelsCollection = collection(this.firestore, 'channels');
      const channelDocRef = await addDoc(channelsCollection, {
        name: newChannel.name,
        description: newChannel.description,
        creator: newChannel.creator,
        creatorID: newChannel.creatorID,
        timestamp: newChannel.timestamp,
        members: newChannel.members,
        messages: newChannel.messages
      });
      this.resetChannelWindowAndReload()
      this.reloadChannels(channelDocRef.id);
      console.log('Channel erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels: ', error);
    }
  }

  resetChannelWindowAndReload() {
    this.toggleChannelOverlay();
    this.channelName = '';
    this.channelDescription = '';

  }



  reloadChannels(newChannelID: any) {
    this.sharedservice.reloadChannelData(newChannelID);
  }

  getMember() {
    const member = {
      name: this.currentUser.name,
      email: this.currentUser.email,
      avatar: this.currentUser.avatar,
      online: this.currentUser.online,
      id: this.currentUser.id,
    }
    return member
  }

  async logoutUser() {

    await this.userservice.setOnlineStatus('logout');
    await signOut(this.auth);
    this.emptyLogalStorage();

  //  setTimeout(() => {
      this.sharedservice.navigateToPath('/login');
   // }, 1000);

  }




  emptyLogalStorage() {
    this.currentUser = null;
    this.currentReciever = null;
    this.threadIsOpen=false;
    localStorage.setItem('thread',JSON.stringify (this.threadIsOpen))
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    this.sharedservice.logoutUser();
    this.sharedservice.initializeThread('close');
  }



  closeThread(){
   this.threadIsOpen=false;
  }
}

