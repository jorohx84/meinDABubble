import { inject, Injectable } from '@angular/core';
import { Firestore, doc, updateDoc, arrayUnion, onSnapshot, getDoc } from '@angular/fire/firestore';
import { Message } from './models/message.class';
import { SharedService } from './shared.service';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { findIndex, Observable, share } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class MessageService {
    firestore = inject(Firestore);
    sharedService = inject(SharedService);
    userService = inject(UserService);
    channelService = inject(ChannelService);
    editInput: string = '';
    isEdit: boolean = false;
    editIndex: number = 0;
    messageContent: string = '';
    thisChat: string = '';
    message: any;
    chatOrChannel: string = '';
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
        console.log(messageData);

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
        console.log(collection);

        if (collection === 'channels') {
            this.channelService.reloadChannelData(currentReciever.id);
        }

        if (collection === 'users') {
            this.loadMessages(currentUser, currentReciever, 'user')

        }

    }


    createMessageData(message: Message) {
        const firestoreID = this.generateFirestoreId();
        return {
            name: message.name,
            photo: message.photo,
            content: message.content,
            time: message.time.toISOString(),
            from: message.from,
            to: message.to,
            thread: [],
            reactions: [],
            id: firestoreID,
        };
    }

    generateFirestoreId(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 28; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
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


    async updateThreadMessages(receiver: any) {
        const channelDocRef = doc(this.firestore, `channels/${receiver.id}`);
        const docSnap = await getDoc(channelDocRef);
        if (docSnap) {
            await updateDoc(channelDocRef, receiver)
            console.log('Dokument exisitert und wurde aktualisiert', docSnap);
        } else {
            console.log('Dokument nicht gefunden', docSnap);
        }

    }
    toggelIsEdit(index: number, message: any, type: string) {
        this.thisChat = type;
        this.message = message;
        this.isEdit = !this.isEdit
        this.editIndex = index;
        this.messageContent = message.content;
        this.sharedService.isOverlay = true;
    }


    async editMessage(reciever: any, user: any) {
        if (this.thisChat === 'thread') {
            await this.editThreadMessages(reciever);
        }
        if (this.thisChat === 'chat') {
            await this.chooseChat(reciever, user);
            this.isEdit = false
            this.sharedService.isOverlay = false;
        }
    }


    async chooseChat(reciever:any, user:any) {
        this.sharedService.getDataFromLocalStorage('chat');
        this.chatOrChannel = this.sharedService.data;
        if (this.chatOrChannel === 'user') {
            await this.saveChatEdit(reciever.id);
            await this.saveChatEdit(user.id);
        }
        if (this.chatOrChannel === 'channel') {
            await this.saveChannelEdit(reciever);
        }

    }


    async saveChannelEdit(reciever: any) {
        const messages = reciever.messages;
        const message = messages[this.editIndex];
        message.content = this.editInput;
        const channelDocRef = doc(this.firestore, `channels/${reciever.id}`);
        await updateDoc(channelDocRef, {
            messages: messages,
        })
        this.channelService.reloadChannelData(reciever.id);

    }

    async saveChatEdit(ID: string) {
        const dataID = ID;
        const currentData = await this.userService.findCurrentUser(dataID, );
        const allMessages = currentData.messages;
        const messageIndex = allMessages.findIndex((message: any) => message.id === this.message.id);
        if (messageIndex >= 0) {
            await this.saveEditedMessageInFirestore(allMessages, messageIndex, dataID)
        } else {
            console.log('Keine Nachricht mit dieser ID gefunden');

        }

    }


    async saveEditedMessageInFirestore(allMessages: any[], messageIndex: number, dataID: string) {
        const messageToEdit = allMessages[messageIndex];
        messageToEdit.content = this.editInput;
        const dataDocRef = doc(this.firestore, `users/${dataID}`);
        await updateDoc(dataDocRef, {
            messages: allMessages,
        })

    }


    async editThreadMessages(reciever: any) {
        const messages = reciever.messages
        this.sharedService.getDataFromLocalStorage('messageIndex');
        const chatIndex = this.sharedService.data;
        const thread = reciever.messages[chatIndex].thread
        const message = thread[this.editIndex];
        message.content = this.editInput;
        const channelDocRef = doc(this.firestore, `channels/${reciever.id}`);
        await updateDoc(channelDocRef, {
            messages: messages,
        })
        this.closeEdit();
    }


    closeEdit() {
        this.isEdit = false;
        this.sharedService.isOverlay = false;
        this.editInput = '';
    }

}

