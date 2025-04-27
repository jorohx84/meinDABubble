import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, Injectable, ViewChild } from '@angular/core';
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
import { ChannelService } from '../channel.service';
import { ReactionService } from '../reactions.service';
import { SearchService } from '../search.service';



@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, DevspaceComponent, ChatwindowComponent, ThreadComponent, FormsModule, ProfileComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  auth = inject(Auth);
  channelService = inject(ChannelService);
  reactionService = inject(ReactionService);
  userService = inject(UserService);
  searchService = inject(SearchService);
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
  screenWidth: number = window.innerWidth;
  users: any[] = [];
  channels: any[] = [];
  @ViewChild(DevspaceComponent)
  devspaceComponent!: DevspaceComponent;
  // @HostListener('window:scroll', [])
  // onScroll() {
  //   this.setViewportHeight();
  // }

  @HostListener('window:resize', [])
  onRezise() {
    console.log(this.screenWidth);
    this.screenWidth = window.innerWidth
    if (this.screenWidth <= 720) {
      this.sharedservice.resize720 = true;

    } else {
      this.sharedservice.resize720 = false;
    }
    if (this.screenWidth <= 407) {
      this.sharedservice.resize407 = true;

    } else {
      this.sharedservice.resize407 = false;
    }

    localStorage.setItem('resize720', JSON.stringify(this.sharedservice.resize720));
    this.setViewportHeight();
  }

  constructor() {
    this.sharedservice.getDataFromLocalStorage('reciever')
    this.currentReciever = this.sharedservice.data;
    this.sharedservice.getDataFromLocalStorage('thread')
    this.threadIsOpen = this.sharedservice.data;
    this.sharedservice.getDataFromLocalStorage('devSlide');
    this.sharedservice.devSlide = this.sharedservice.data

  }



  async ngOnInit() {
    this.setViewportHeight();
    window.addEventListener('focusin', this.handleFocus);
    // window.addEventListener('scroll', this.setViewportHeight);
    this.loadChannels();
    this.loadUsers();
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
    this.threadSubscription = this.sharedservice.openThread$.subscribe((key: string) => {
      if (key === 'close') {
        this.threadIsOpen = false;
      } else {
        this.threadIsOpen = true;
      }
      localStorage.setItem('thread', JSON.stringify(this.threadIsOpen));
    })

  }
  handleFocus = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) {
      this.setViewportHeight
    }
  }
  setViewportHeight(): void {
    const vh = window.innerHeight;
    console.log(vh);
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }

  checkWidth() {
    console.log('Emmiter läuft');

    this.setViewportHeight();
    if (window.innerWidth <= 720) {
      this.sharedservice.resize720 = true;
      console.log(this.sharedservice.resize720);

    }

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
    console.log(this.channelName);

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
    this.channelService.reloadChannelData(newChannelID);
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
    this.sharedservice.toggleLogout();
    //  setTimeout(() => {
    this.sharedservice.navigateToPath('/login');
    // }, 1000);

  }




  emptyLogalStorage() {
    this.currentUser = null;
    this.currentReciever = null;
    this.threadIsOpen = false;
    localStorage.setItem('thread', JSON.stringify(this.threadIsOpen))
    localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    this.sharedservice.logoutUser();
    this.sharedservice.initializeThread('close');
  }

  closeThread() {
    this.threadIsOpen = false;
  }

  loadChatWindow(index: number) {
    const searchedObject = this.searchService.currentList[index];
    console.log(searchedObject);
    const searchID = searchedObject.id;
    console.log(searchID);
    if (this.searchService.isChannel === true) {
      const currentIndex = this.channels.findIndex((object: any) => object.id === searchID);
      console.log(currentIndex);
      this.devspaceComponent.openChannel(currentIndex);
    } else {

      const currentIndex = this.users.findIndex((object: any) => object.id === searchID);
      console.log(currentIndex);
      this.devspaceComponent.openPersonalChat(currentIndex);
    }
    this.searchService.isChatSearch = false
  }
}



