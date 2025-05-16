import { inject, Injectable } from '@angular/core';
import { Firestore, doc, collection, updateDoc, setDoc, onSnapshot, getDoc, getDocs, query, orderBy } from '@angular/fire/firestore';
import { Message } from './models/message.class';
import { SharedService } from './shared.service';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { BehaviorSubject, findIndex, Observable, share } from 'rxjs';
import { addDoc } from 'firebase/firestore';

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
    messageIndex: number = 0;
    currentThreadMessages: any[] = [];
    currentMessages: any[] = [];
    messageID: string = '';
    currentUser: any;
    currentReciever: any;
    currentChat: string = '';
    messageToEdit: any;
    constructor() { }


    async sendMessage(message: string, currentUser: any, currentReciever: any, currentChat: string) {

        let collection: string = '';

        if (message === '' || !currentReciever.id || !currentUser.id) {
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


    async saveMessages(collectionName: string, message: string, currentUser: any, currentReciever: any) {
        const firestoreID = this.generateFirestoreID();
        const msg = new Message(currentUser.name || '', currentUser.avatar || '', message, currentUser.id, currentReciever.id);
        const messageData = this.createMessageData(msg);
        const currentUserRef = doc(this.firestore, `${collectionName}/${currentUser.id}/messages/${firestoreID}`);
        const currentReceiverRef = doc(this.firestore, `${collectionName}/${currentReciever.id}/messages/${firestoreID}`);

        if (currentReciever.id !== currentUser.id) {
            await setDoc(currentReceiverRef, messageData);
        }
        if (collectionName != 'channels') {
            await setDoc(currentUserRef, messageData);
        }
        if (collectionName === 'channels') {
            this.channelService.reloadChannelData(currentReciever.id);
        }
        if (collectionName === 'users') {
            this.loadMessages(currentUser, currentReciever, 'user')
        }
    }


    createMessageData(message: Message) {
        return {
            name: message.name,
            photo: message.photo,
            content: message.content,
            time: message.time.toISOString(),
            from: message.from,
            to: message.to,
            thread: [],
            reactions: [],
            threadLength: 0,
        };
    }



    generateFirestoreID(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 28; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


    loadMessages(currentUser: any, currentReciever: any, currentChat: string): Observable<any[]> {
        if (currentChat === 'user') {
            return this.loadUserMessages(currentUser, currentReciever);
        }
        if (currentChat === 'channel') {
            return this.loadChannelMessages(currentReciever);

        }

        return new Observable<any[]>(); 
    }


    loadChannelMessages(currentReciever: any): Observable<any[]> {
        const channelMessagesRef = collection(this.firestore, `channels/${currentReciever.id}/messages`);
        return new Observable((observer) => {
            onSnapshot(channelMessagesRef, (querySnapshot) => {
                const messages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                this.currentMessages = messages;
                observer.next(messages);  
            }, (error) => {
                observer.error(error);  
            });

        });
    }


    loadUserMessages(currentUser: any, currentReciever: any): Observable<any[]> {
        const messagesRef = collection(this.firestore, `users/${currentUser.id}/messages`);

        return new Observable((observer) => {
            onSnapshot(messagesRef, (querySnapshot) => {
                const messages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                const currentMessages = this.buildCurrentMessages(messages, currentUser, currentReciever);
                observer.next(currentMessages);
            }, (error) => {
                observer.error(error); 
            });
        });
    }


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
        this.currentMessages = currentMessages;
        return currentMessages;
    }


    async setMessage(message: any, index: number, reciever: any) {
        this.messageIndex = index;
        localStorage.setItem('messageIndex', JSON.stringify(index));
        this.message = message;
        this.messageID = message.id
        this.currentThreadMessages = await this.getThreadData(reciever);
        localStorage.setItem('threadMessages', JSON.stringify(this.currentThreadMessages));
        localStorage.setItem('messageID', this.messageID);
        localStorage.setItem('message', JSON.stringify(this.message));
    }


    async getCurrentMessages(user: any, reciever: any, chat: string) {
        let collectionName: string = '';
        if (chat === 'user') {
            collectionName = 'users'
        }
        if (chat === 'channel') {
            collectionName = 'channels'
        }
        const docRef = collection(this.firestore, `${collectionName}/${reciever.id}/messages`);
        const docSnapshot = await getDocs(docRef);
        const messages = docSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        if (chat === 'user') {
            const currentMessages = this.buildCurrentMessages(messages, user, reciever);
        } else {
            this.currentMessages = messages;
        }

    }

    async getThreadData(reciever: any) {
        const messagesCollectionRef = collection(this.firestore, `channels/${reciever.id}/messages/${this.messageID}/thread`);
        const messagesQuery = query(messagesCollectionRef, orderBy('time', 'asc'));
        try {
            const querySnapshot = await getDocs(messagesQuery);
            const messages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            return messages;

        } catch (error) {
            console.error('Fehler beim Laden der Nachrichten:', error);
            throw error;
        }
    }


    async updateThreadMessages(receiver: any) {
        const channelDocRef = doc(this.firestore, `channels/${receiver.id}/messages`);
        const docSnap = await getDoc(channelDocRef);
        if (docSnap) {
            await updateDoc(channelDocRef, receiver)
        } 
    }


    toggelIsEdit(index: number, message: any, type: string) {
        this.thisChat = type;
        this.messageToEdit = message;
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


    async chooseChat(reciever: any, user: any) {
        this.sharedService.getDataFromLocalStorage('chat');
        this.chatOrChannel = this.sharedService.data;
        let collectionName = '';
        if (this.chatOrChannel === 'user') {
            collectionName = 'users';
            await this.saveChatEdit(reciever.id, collectionName);
            await this.saveChatEdit(user.id, collectionName);

        }
        if (this.chatOrChannel === 'channel') {
            collectionName = 'channels';
            await this.saveChatEdit(reciever.id, collectionName);
        }

    }


    async saveChatEdit(ID: string, collectionName: string) {
        if (this.messageToEdit.id && ID) {
            const messageID = this.messageToEdit.id;
            const dataID = ID;
            const dataDocRef = doc(this.firestore, `${collectionName}/${dataID}/messages/${messageID}`);
            await updateDoc(dataDocRef, {
                content: this.editInput,
            })
        }
    }

    async editThreadMessages(reciever: any) {
        if (!this.message) {
            this.sharedService.getDataFromLocalStorage('message');
            this.message = this.sharedService.data;
        } 
        const messageID = this.message.id;
        this.messageID = messageID;
        const threadID = this.messageToEdit.id;
        const docRef = doc(this.firestore, `channels/${reciever.id}/messages/${messageID}/thread/${threadID}`);
        await updateDoc(docRef, {
            content: this.editInput,
        });
        this.currentMessages = await this.getThreadData(reciever)
        this.closeEdit();
    }


    closeEdit() {
        this.isEdit = false;
        this.sharedService.isOverlay = false;
        this.editInput = '';
    }
}
