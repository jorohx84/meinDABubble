import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../user.service';
import { SharedService } from '../shared.service';
import { user } from '@angular/fire/auth';
import { DevspaceComponent } from '../devspace/devspace.component';
import { ChatwindowComponent } from '../chatwindow/chatwindow.component';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';
import { Firestore, collection, addDoc, updateDoc, doc, arrayUnion } from '@angular/fire/firestore';
import { ThreadComponent } from '../thread/thread.component';
@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chat',
  imports: [CommonModule, DevspaceComponent, ChatwindowComponent, ThreadComponent, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  userID: string = '';
  currentUser: any;
  currentReciever: any;
  channel!: Channel;
  firestore = inject(Firestore);
  userservice = inject(UserService);
  sharedservice = inject(SharedService);
  showChannel: boolean = false;
  private channelSubscription: Subscription | null = null;

  channelName: string = '';
  channelDescription: string = '';

  constructor() {
    this.sharedservice.getUserFromLocalStorage();
    this.sharedservice.getDataFromLocalStorage('reciever')
    this.currentUser = this.sharedservice.user
    this.currentReciever = this.sharedservice.data;
    console.log(this.currentReciever);

  }

  async ngOnInit() {

    this.channelSubscription = this.sharedservice.openChannelOverlay$.subscribe(() => {
      this.toggleChannelOverlay();
    })
  }


  ngOnDestroy(): void {
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
  }

  toggleChannelOverlay() {
    this.showChannel = !this.showChannel;
    console.log(this.showChannel);

  }



  async createChannel() {
    if (!this.channelName) {
      return; // Falls der Channel-Name leer ist, abbrechen
    }

    const firstMember = this.getMember();
    // Neues Channel-Objekt erstellen
    const newChannel = new Channel(
      this.channelName,
      this.channelDescription,
      this.currentUser.name,  // Setze den Creator des Channels als aktuellen Benutzer
      this.currentUser.id,

      [firstMember],  // Mitglieder, kann später hinzugefügt werden
      [],  // Nachrichten, anfangs leer
      new Date().toISOString()  // Timestamp setzen
    );

    try {
      // Channel-Objekt in Firestore speichern
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

      console.log('Channel erfolgreich erstellt!');
      this.toggleChannelOverlay();  // Overlay schließen
      this.channelName = '';  // Eingabefelder zurücksetzen
      this.channelDescription = '';
      this.reloadChannels(channelDocRef.id);
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels: ', error);
    }
  }
  reloadChannels(newChannelID: any) {
    console.log(newChannelID);

    this.sharedservice.reloadChannelData(newChannelID);
  }

  getMember() {
    const member = {
      name: this.currentUser.name,
      email: this.currentUser.email,
      avatar: this.currentUser.avatar,
      online: this.currentUser.online,
      id: this.currentUser.id,
      messages: this.currentUser.messages,
    }
    return member
  }
}
