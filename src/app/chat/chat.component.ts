import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../user.service';
import { SharedService } from '../shared.service';
import { user } from '@angular/fire/auth';
import { DevspaceComponent } from '../devspace/devspace.component';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; 

@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chat',
  imports: [CommonModule, DevspaceComponent, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  userID: string = '';
  currentUser: any;
  channel!: Channel;
  firestore=inject(Firestore);
  userservice = inject(UserService);
  sharedservice = inject(SharedService);
  showChannel: boolean = false;
  private channelSubscription: Subscription | null = null;

  channelName: string = '';
  channelDescription: string = '';

  constructor() {
    this.sharedservice.getUserFromLocalStorage();
    this.userID = this.sharedservice.user.uid;

  }

  async ngOnInit() {
    await this.loadCurrenUser();
    this.channelSubscription = this.sharedservice.openChannelOverlay$.subscribe(() => {
      this.toggleChannelOverlay();
    })
  }


  ngOnDestroy(): void {
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
  }

  async loadCurrenUser() {
    this.currentUser = await this.userservice.getCurrentUser(this.userID);
  }


  toggleChannelOverlay() {
    this.showChannel = !this.showChannel;
    console.log(this.showChannel);

  }



  async createChannel() {
    if (!this.channelName) {
      return; // Falls der Channel-Name leer ist, abbrechen
    }

    // Neues Channel-Objekt erstellen
    const newChannel = new Channel(
      this.channelName,
      this.channelDescription,
      this.currentUser.name,  // Setze den Creator des Channels als aktuellen Benutzer
      [],  // Mitglieder, kann später hinzugefügt werden
      [],  // Nachrichten, anfangs leer
      new Date().toISOString()  // Timestamp setzen
    );

    try {
      // Channel-Objekt in Firestore speichern
      const channelsCollection = collection(this.firestore, 'channels');
      await addDoc(channelsCollection, {
        name: newChannel.name,
        description: newChannel.description,
        creator: newChannel.creator,
        timestamp: newChannel.timestamp,
        members: newChannel.members,
        messages: newChannel.messages
      });

      console.log('Channel erfolgreich erstellt!');
      this.toggleChannelOverlay();  // Overlay schließen
      this.channelName = '';  // Eingabefelder zurücksetzen
      this.channelDescription = '';
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels: ', error);
    }
  }
}
