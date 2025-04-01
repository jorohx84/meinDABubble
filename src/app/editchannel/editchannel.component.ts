import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SharedService } from '../shared.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { ChannelService } from '../channel.service';
import { deleteDoc } from 'firebase/firestore';
@Component({
  selector: 'app-editchannel',
  imports: [CommonModule, FormsModule],
  templateUrl: './editchannel.component.html',
  styleUrl: './editchannel.component.scss'
})
export class EditchannelComponent {
  firestore = inject(Firestore);
  channelService = inject(ChannelService);
  currentUser: any;
  currentReciever: any;
  sharedService = inject(SharedService);
  editSubscription: Subscription | null = null;
  isEditName: boolean = false;
  isEditDescription: boolean = false;
  inputName: string = '';
  inputDescription: string = '';
  channels: any[] = [];
  constructor() {
    this.sharedService.getDataFromLocalStorage('reciever');
    this.currentReciever = this.sharedService.data;
    this.sharedService.getDataFromLocalStorage('user');
    this.currentUser = this.sharedService.data
    console.log(this.currentReciever);
    console.log(this.currentUser);


  }


  ngOnInit() {
    this.editSubscription = this.sharedService.editObserver$.subscribe((reciever: any) => {
      this.currentReciever = reciever;
      console.log(this.currentReciever);
    })
  }

  editChannel(key: string) {
    if (key === 'name') {
      this.isEditName = true;
    }
    if (key === 'description') {
      this.isEditDescription = true
    }

  }

  async saveEdit(key: string, input: string) {
    const channelDocRef = doc(this.firestore, `channels/${this.currentReciever.id}`);
    if (key === 'name') {
      this.isEditName = false;
      await this.saveChannelName(input, channelDocRef);
    }
    if (key === 'description') {
      this.isEditDescription = false;
      await this.saveChannelDescription(input, channelDocRef);
    }
    this.channelService.reloadChannelData(this.currentReciever.id);

  }

  async saveChannelName(input: string, ref: any) {
    console.log(input);
    await updateDoc(ref, {
      name: input,
    })
  }
  async saveChannelDescription(input: string, ref: any) {
    console.log(input);
    await updateDoc(ref, {
      description: input,
    })
  }



  closeEdit() {
    this.sharedService.isEdit = false;
    this.sharedService.isOverlay = false;
  }


  async leaveChannel() {
    const channelDocRef = doc(this.firestore, `channels/${this.currentReciever.id}`);
    const members = this.currentReciever.members;
    const currentMember = members.find((user: any) => user.id === this.currentUser.id);
    const currentMemberIndex = members.findIndex((user: any) => user.id === this.currentUser.id);
    if (currentMember) {
      members.splice(currentMemberIndex, 1);
      await this.updateData(members, channelDocRef, currentMember);
    }
  }

  async updateData(members: any[], ref: any, member: any) {

    if (members.length === 0) {
      await this.deleteChannel(ref);
    } else {
      if (member.id === this.currentReciever.creatorID) {
        await this.changeCreator(members, ref);
      }
      await this.updateMembers(members, ref);
    }

    await this.reloadChannelData();
  }


  async deleteChannel(ref: any) {
    try {
      await deleteDoc(ref);
      console.log('Channel erfolgreich gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen des Channels:', error);
    }

  }


  async reloadChannelData() {
    await this.loadChannels();
    console.log(this.channels.length);

    if (this.channels.length > 0) {
      const newChannel = this.channels[0];
      this.channelService.reloadChannelData(newChannel.id);
      localStorage.setItem('reciever', JSON.stringify(newChannel));
    } else {
      this.currentReciever=null;
      localStorage.setItem('reciever', JSON.stringify(this.currentReciever));
     this.channelService.loadWhenChannelEmpty();
    }
    this.sharedService.isEdit = false;
    this.sharedService.isOverlay = false;

  }

  async changeCreator(members: any[], ref: any,) {
    const newCreator = members[0];
    const newCreatorName = newCreator.name
    const newCreatorID = newCreator.id
    await this.updateCreator(newCreatorName, newCreatorID, ref);

  }


  async updateCreator(newCreatorName: any, newCreatorID: string, ref: any) {
    await updateDoc(ref, {
      creator: newCreatorName,
      creatorID: newCreatorID,
    })
  }

  async updateMembers(members: any[], ref: any) {
    await updateDoc(ref, {
      members: members,
    })
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

}