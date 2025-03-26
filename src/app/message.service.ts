import { inject, Injectable } from '@angular/core';
import { Firestore, doc, updateDoc, arrayUnion, onSnapshot } from '@angular/fire/firestore';
import { Message } from './models/message.class';
import { SharedService } from './shared.service';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { Observable, share } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class MessageService {
    firestore = inject(Firestore);
    sharedService = inject(SharedService);
    userService = inject(UserService);
    channelService = inject(ChannelService);
    constructor() { }

    // sendMessage
    async sendMessage(message: string, currentUser: any, currentReciever: any, currentChat: string) {
        let collection: string = '';

        if (message === '' || !currentReciever.id || !currentUser.id) {
            console.log('kein Sender oder Empfänger');
            return;
        }

        if (currentChat === 'channel') {
            collection = 'channels';
        }
        if (currentChat === 'user') {
            collection = 'users';
        }

        await this.saveMessages(collection, message, currentUser, currentReciever);
    }

    // saveMessages
    async saveMessages(collection: string, message: string, currentUser: any, currentReciever: any) {
        console.log(currentReciever);
        console.log(currentUser);
        console.log(collection);
        
        const msg = new Message(currentUser.name || '', currentUser.avatar || '', message, currentUser.id, currentReciever.id);
        const messageData = this.createMessageData(msg);
        const currentUserRef = doc(this.firestore, `${collection}/${currentUser.id}`);
        const currentReceiverRef = doc(this.firestore, `${collection}/${currentReciever.id}`);

        if (currentReciever.id !== currentUser.id) {
            await updateDoc(currentReceiverRef, {
                messages: arrayUnion(messageData),
            });
        }

        if (collection != 'channels') {
            await updateDoc(currentUserRef, {
                messages: arrayUnion(messageData),
            });
        }
    }

    // createMessageData
    createMessageData(message: Message) {
        return {
            name: message.name,
            photo: message.photo,
            content: message.content,
            time: message.time.toISOString(),
            from: message.from,
            to: message.to,
            thread: [],
            reactions:[],
        };
    }


    // loadMessages now returns an observable
  loadMessages(currentUser: any, currentReciever: any, currentChat: string): Observable<any[]> {
    if (currentChat === 'user') {
      return this.loadUserMessages(currentUser, currentReciever);
    }
    if (currentChat === 'channel') {
      return this.loadChannelMessages(currentReciever);
    }
    return new Observable<any[]>(); // Empty observable in case of invalid chat type
  }

  // loadChannelMessages now returns an observable
  loadChannelMessages(currentReciever: any): Observable<any[]> {
    const channelMessagesRef = doc(this.firestore, `channels/${currentReciever.id}`);
    return new Observable((observer) => {
      onSnapshot(channelMessagesRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const messageData = docSnapshot.data();
          const messages = messageData?.['messages'] || [];
          observer.next(messages);  // Return messages in the observer
        } else {
          console.log('Dokument existiert nicht');
          observer.next([]);  // Return an empty array if the document does not exist
        }
      }, (error) => {
        observer.error(error); // Handle errors from Firestore
      });
    });
  }

  // loadUserMessages now returns an observable
  loadUserMessages(currentUser: any, currentReciever: any): Observable<any[]> {
    const messagesRef = doc(this.firestore, `users/${currentUser.id}`);
    return new Observable((observer) => {
      onSnapshot(messagesRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const messageData = docSnapshot.data();
          const messages = messageData?.['messages'] || [];
          const currentMessages = this.buildCurrentMessages(messages, currentUser, currentReciever);
          observer.next(currentMessages); // Return filtered messages in the observer
        } else {
          console.log('Benutzerdokument existiert nicht.');
          observer.next([]); // Return an empty array if the document does not exist
        }
      }, (error) => {
        observer.error(error); // Handle errors from Firestore
      });
    });
  }

  // buildCurrentMessages method filters the messages
  buildCurrentMessages(messages: any[], currentUser: any, currentReciever: any): any[] {
    const currentMessages: any[] = [];
    messages.forEach((message: any) => {
      if (currentUser.id === currentReciever.id) {
        if (message['to'] === currentReciever.id && message['from'] === currentReciever.id) {
          currentMessages.push(message);
        }
      } else {
        if (message['to'] === currentReciever.id || message['from'] === currentReciever.id) {
          currentMessages.push(message);
        }
      }
    });
    return currentMessages;
  }

}