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

    /*
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
        */

    async saveMessages(collectionName: string, message: string, currentUser: any, currentReciever: any) {
        console.log(currentReciever);
        console.log(currentUser);
        const firestoreID = this.generateFirestoreID();

        const msg = new Message(currentUser.name || '', currentUser.avatar || '', message, currentUser.id, currentReciever.id);
        const messageData = this.createMessageData(msg);
        const currentUserRef = doc(this.firestore, `${collectionName}/${currentUser.id}/messages/${firestoreID}`);
        const currentReceiverRef = doc(this.firestore, `${collectionName}/${currentReciever.id}/messages/${firestoreID}`);
        console.log(messageData);

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

    /*
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
    */

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
    /*
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
*/
    loadChannelMessages(currentReciever: any): Observable<any[]> {
        // Referenz zur Channel-Nachrichten-Subcollection
        const channelMessagesRef = collection(this.firestore, `channels/${currentReciever.id}/messages`);

        return new Observable((observer) => {
            // Verwende onSnapshot, um die Nachrichten in Echtzeit zu beobachten
            onSnapshot(channelMessagesRef, (querySnapshot) => {
                // Hier iterieren wir über alle Dokumente der Subcollection
                const messages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                this.currentMessages = messages;
                observer.next(messages);  // Gib die gesammelten Nachrichten an den Observer zurück
            }, (error) => {
                observer.error(error);  // Fehlerbehandlung
            });

        });
    }



    // loadUserMessages now returns an observable
    /*
    loadUserMessages(currentUser: any, currentReciever: any): Observable<any[]> {
        const messagesRef = collection(this.firestore, `users/${currentUser.id}/messages`);
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
*/
    loadUserMessages(currentUser: any, currentReciever: any): Observable<any[]> {
        const messagesRef = collection(this.firestore, `users/${currentUser.id}/messages`);

        return new Observable((observer) => {
            // onSnapshot für QuerySnapshot verwenden, weil es eine Sammlung von Dokumenten abruft
            onSnapshot(messagesRef, (querySnapshot) => {
                // Nachrichtenarray initialisieren


                // Iteriere durch alle Dokumente in der Sammlung
                const messages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Optional: Die Nachrichten nach dem Empfänger und dem aktuellen Benutzer filtern
                const currentMessages = this.buildCurrentMessages(messages, currentUser, currentReciever);

                // Rückgabe der gefilterten Nachrichten an den Observer
                observer.next(currentMessages);
            }, (error) => {
                observer.error(error); // Fehlerbehandlung
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
        this.currentMessages = currentMessages;
        return currentMessages;
    }




    /*
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
    
        */

    async setMessage(message: any, index: number, reciever: any) {
        this.messageIndex = index;
        localStorage.setItem('messageIndex', JSON.stringify(index));
        console.log(this.messageIndex);
        this.message = message;
        this.messageID = message.id
        this.currentThreadMessages = await this.getThreadData(reciever);
        console.log(this.currentThreadMessages);
        localStorage.setItem('threadMessages', JSON.stringify(this.currentThreadMessages));
        localStorage.setItem('messageID', this.messageID);
        localStorage.setItem('message', JSON.stringify(this.message));
    }


    async getCurrentMessages(user: any, reciever: any, chat: string) {
        // this.currentUser=user;
        // this.currentReciever=reciever;
        //this.currentChat=chat;
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
        console.log(messages);

        if (chat === 'user') {
            const currentMessages = this.buildCurrentMessages(messages, user, reciever);
        } else {
            this.currentMessages = messages;
        }

    }

    async getThreadData(reciever: any) {
        console.log(reciever);
        console.log(this.messageID);
        const messagesCollectionRef = collection(this.firestore, `channels/${reciever.id}/messages/${this.messageID}/thread`);

        // Erstelle eine Abfrage, um die Nachrichten nach `time` aufsteigend zu sortieren
        const messagesQuery = query(messagesCollectionRef, orderBy('time', 'asc'));

        try {
            // Holen Sie sich die Dokumente aus Firestore
            const querySnapshot = await getDocs(messagesQuery);

            // Erstelle ein Array von Nachrichten mit ihren Daten
            const messages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Gib die Nachrichten zurück
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
            console.log('Dokument exisitert und wurde aktualisiert', docSnap);
        } else {
            console.log('Dokument nicht gefunden', docSnap);
        }

    }
    toggelIsEdit(index: number, message: any, type: string) {
        this.thisChat = type;
        // this.message = message;
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
            //await this.saveChannelEdit(reciever);
            await this.saveChatEdit(reciever.id, collectionName);
        }

    }

    /*
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
    */
    async saveChatEdit(ID: string, collectionName: string) {
        if (this.messageToEdit.id && ID) {
            const messageID = this.messageToEdit.id;
            console.log(messageID);
            //userID oder ReceiverID
            const dataID = ID;
            console.log(dataID);

            const dataDocRef = doc(this.firestore, `${collectionName}/${dataID}/messages/${messageID}`);
            console.log(dataDocRef);
            await updateDoc(dataDocRef, {
                content: this.editInput,
            })

            /*
                    const currentData = await this.userService.findCurrentUser(dataID,);
                    console.log(currentData);
            
                    const allMessages = currentData.messages;
                    const messageIndex = allMessages.findIndex((message: any) => message.id === this.message.id);
                    if (messageIndex >= 0) {
                        await this.saveEditedMessageInFirestore(allMessages, messageIndex, dataID)
                    } else {
                        console.log('Keine Nachricht mit dieser ID gefunden');
            
                    }
                        */
        }
    }

    /*
        async saveEditedMessageInFirestore(allMessages: any[], messageIndex: number, dataID: string) {
            const messageToEdit = allMessages[messageIndex];
            messageToEdit.content = this.editInput;
            const dataDocRef = doc(this.firestore, `users/${dataID}`);
    
            //  await updateDoc(dataDocRef, {
            //    messages: allMessages,
            //  })
    
        }
    */

    async editThreadMessages(reciever: any) {

        console.log(this.messageToEdit.id);
        console.log(reciever.id);

        if (!this.message) {
            this.sharedService.getDataFromLocalStorage('message');
            this.message = this.sharedService.data;

            console.log('message aus dem localStorage geladen', this.message);

        } else {
            console.log('message geladen', this.message);
        }
        const messageID = this.message.id;
        this.messageID = messageID;
        const threadID = this.messageToEdit.id;
        const docRef = doc(this.firestore, `channels/${reciever.id}/messages/${messageID}/thread/${threadID}`);
        console.log(docRef);
        await updateDoc(docRef, {
            content: this.editInput,
        });

        this.currentMessages = await this.getThreadData(reciever)
        /*
  const messages = reciever.messages
        this.sharedService.getDataFromLocalStorage('messageIndex');
        const chatIndex = this.sharedService.data;
        const thread = reciever.messages[chatIndex].thread
        const message = thread[this.editIndex];
        message.content = this.editInput;
        const channelDocRef = doc(this.firestore, `channels/${reciever.id}`);
        //await updateDoc(channelDocRef, {
        //  messages: messages,
        //})
        */
        this.closeEdit();
    }


    closeEdit() {
        this.isEdit = false;
        this.sharedService.isOverlay = false;
        this.editInput = '';
    }




}
