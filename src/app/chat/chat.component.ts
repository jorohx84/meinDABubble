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
  private overlaySubscription: Subscription | null = null;
  private profileSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  isLogout: boolean = false;
  isProfileOpen: boolean = false;
  isReceiver: boolean = false;
  userObserver = this.userservice.user$;
  constructor() {
    this.sharedservice.getDataFromLocalStorage('reciever')
    this.currentReciever = this.sharedservice.data;
    console.log(this.currentReciever);


  }

  async ngOnInit() {
    this.loadCurrentUser();
    this.channelSubscription = this.sharedservice.openChannelOverlay$.subscribe(() => {
      this.toggleChannelOverlay();
    })

    this.overlaySubscription = this.sharedservice.openGeneralOverlay$.subscribe(() => {
      this.isOverlay = !this.isOverlay;
    })

    this.profileSubscription = this.sharedservice.profileObserver$.subscribe((key) => {
      this.loadProfile(key);
    })

    this.userSubscription = this.sharedservice.userObserver$.subscribe(() => {
      this.currentUser = this.sharedservice.currenProfile;
      console.log(this.currentUser);

    });


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

      console.log(this.currentUser);
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

  toggleLogout() {
    this.isLogout = !this.isLogout;
    this.sharedservice.openOverlay();
  }

  toggleProfile() {
    this.sharedservice.isReceiver = false;
    this.sharedservice.currenProfile = this.currentUser;
    this.isProfileOpen = !this.isProfileOpen;
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

    setTimeout(() => {
      this.sharedservice.navigateToPath('/login');
    }, 1000);

  }




  emptyLogalStorage() {
    this.currentUser = null;
    this.currentReciever = null;
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    this.sharedservice.logoutUser();
  }

  closeOverlay() {
    console.log('CLOSE');
    this.isOverlay = false;
    this.isProfileOpen = false;
    this.isLogout = false;
  }
}

