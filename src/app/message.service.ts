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
            this.sharedService.getDataFromLocalStorage('chat');
            this.chatOrChannel = this.sharedService.data;

            if (this.chatOrChannel === 'user') {
       

                //finde die message im user
                const userID = user.id;
                const currentUser = await this.userService.findCurrentUser(userID);
                const userMessages = currentUser.messages;
                const userMessageIndex = userMessages.findIndex((message: any) => message.id === this.message.id);
                if (userMessageIndex >= 0) {
                    const userMessage = userMessages[userMessageIndex];
                    userMessage.content = this.editInput;
                    const userDocRef = doc(this.firestore, `users/${currentUser.id}`);
                    await updateDoc(userDocRef, {
                        messages: userMessages,
                    });
                    localStorage.setItem('user', JSON.stringify(currentUser));
                } else {
                    console.log('Keine UserNachricht mit dieser ID gefunden');

                }

                //finde die message im reciever

                const recieverID = reciever.id;
                const currentReciever = await this.userService.findCurrentUser(recieverID);
                const recieverMessages = currentReciever.messages;
                const recieverMessageIndex = recieverMessages.findIndex((message: any) => message.id === this.message.id);
                if (recieverMessageIndex >= 0) {
                    const recieverMessage = recieverMessages[recieverMessageIndex];
                    recieverMessage.content = this.editInput;
                    const recieverDocRef = doc(this.firestore, `users/${currentReciever.id}`);
                    await updateDoc(recieverDocRef, {
                        messages: recieverMessages,
                    });

                    localStorage.setItem('reciever', JSON.stringify(currentReciever));

                } else {
                    console.log('Keine RecieverNachricht mit dieser ID gefunden');

                }
            }




            if (this.chatOrChannel === 'channel') {

                console.log(reciever);
                const messages = reciever.messages;
                console.log(messages);
                console.log(this.editIndex);

                const message = messages[this.editIndex];
                console.log(message);

                message.content = this.editInput;
                const channelDocRef = doc(this.firestore, `channels/${reciever.id}`);
                await updateDoc(channelDocRef, {
                    messages: messages,
                })
                this.channelService.reloadChannelData(reciever.id);
            }

            this.isEdit = false
            this.sharedService.isOverlay = false;
        }
    }


    async editThreadMessages(reciever: any) {
        console.log(reciever);

        const messages = reciever.messages
        this.sharedService.getDataFromLocalStorage('messageIndex');
        const chatIndex = this.sharedService.data;
        console.log(chatIndex);
        const thread = reciever.messages[chatIndex].thread
        const message = thread[this.editIndex];
        console.log(message);
        message.content = this.editInput;
        console.log(message);
        console.log(thread);
        console.log(messages);



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

