import { inject, Injectable } from "@angular/core";
import { Firestore, updateDoc, doc, addDoc, setDoc, docSnapshots } from "@angular/fire/firestore";
import { ChannelService } from "./channel.service";
import { reload } from "firebase/auth";
import { UserService } from "./user.service";
import { collection, CollectionReference, DocumentData, DocumentReference, getDocs } from "firebase/firestore";
import { MessageService } from "./message.service";
import { share } from "rxjs";
import { SharedService } from "./shared.service";


@Injectable({
    providedIn: 'root',
})

export class ReactionService {
    firestore = inject(Firestore);
    channelService = inject(ChannelService);
    userService = inject(UserService);
    messageService = inject(MessageService);
    sharedService = inject(SharedService);
    reciever: any;
    thumbs: any[] = [];
    checks: any[] = [];
    isIconBar: boolean = false;
    isFooterIconBar: boolean = false;
    check: any[] = [];
    thumb: any[] = [];
    rocket: any[] = [];
    nerd: any[] = [];
    allReactions: any[] = [];
    isReaction: boolean = false;
    isThreadReaction: boolean = false;
    reactionIndex: number = 0;
    messageObject: any;
    currentReaction: any;
    async addReaction(icon: string, message: any, user: any, reciever: any, reactionType: string, chatKey: string) {
        const messageID = message.id;
        const reactor = user;
        const recieverID = reciever.id
        const reaction = this.getReactionObject(reactor, icon, reactionType);
        this.setData(message, reaction);
        const currentChat = this.setData(message, reaction);
        await this.chooseChat(icon, message, user, messageID, recieverID, currentChat, reaction, reactionType, chatKey);
        await this.getCurrentReciever(recieverID);
        localStorage.setItem('reciever', JSON.stringify(this.reciever));
    }

    setData(message: any, reaction: any) {
        this.messageObject = message;
        this.currentReaction = reaction;
        this.sharedService.getDataFromLocalStorage('chat');
        const currentChat = this.sharedService.data;
        return currentChat
    }

    async chooseChat(icon: string, message: any, user: any, messageID: string, recieverID: string, currentChat: string, reaction: any, reactionType: string, chatKey: string) {
        if (chatKey === 'thread') {
            await this.addThreadReaction(icon, message, user, recieverID, reactionType, chatKey, currentChat, reaction);
        } else {
            if (currentChat === 'user') {
                await this.addUserReaction(icon, message, user, messageID, recieverID, currentChat, reaction, reactionType, chatKey);
            }
            if (currentChat === 'channel') {
                await this.addChannelReaction(icon, message, user, messageID, recieverID, currentChat, reaction, reactionType, chatKey);
            }
        }


    }


    async addChannelReaction(icon: string, message: any, user: any, messageID: string, recieverID: string, currentChat: string, reaction: any, reactionType: string, chatKey: string) {
        const channelReactionDocRef = collection(this.firestore, `channels/${recieverID}/messages/${messageID}/reactions`);
        const duplicate = await this.checkDuplikate(channelReactionDocRef, user.id, reactionType, recieverID, message.id, '', currentChat, chatKey);
        if (duplicate) {
            console.log('Duplikat');
            return
        }
        await addDoc(channelReactionDocRef, reaction);
        await this.addReactionData(channelReactionDocRef, messageID, '', icon, recieverID, chatKey, currentChat);
        this.channelService.reloadChannelData(recieverID);
    }


    async addUserReaction(icon: string, message: any, user: any, messageID: string, recieverID: string, currentChat: string, reaction: any, reactionType: string, chatKey: string) {
        const firestoreID = this.messageService.generateFirestoreID();
        console.log(firestoreID);
        const channelReactionDocRef = collection(this.firestore, `users/${user.id}/messages/${messageID}/reactions`);
        const duplicate = await this.checkDuplikate(channelReactionDocRef, user.id, reactionType, recieverID, message.id, '', currentChat, chatKey);
        if (duplicate) {
            console.log('Duplikat');
            return
        }
        await this.saveChatReactions(user.id, messageID, reaction, firestoreID, icon, chatKey, currentChat);
        await this.saveChatReactions(recieverID, messageID, reaction, firestoreID, icon, chatKey, currentChat);
    }


    async addThreadReaction(icon: string, message: any, user: any, recieverID: any, reactionType: string, chatKey: string, currentChat: string, reaction: any) {
        this.sharedService.getDataFromLocalStorage('message');
        const chatMessage = this.sharedService.data;
        const chatMessageID = chatMessage.id
        const threadMessage = message;
        const threadID = threadMessage.id;
        const threadReactionDocRef = collection(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}/reactions`);
        const duplicate = await this.checkDuplikate(threadReactionDocRef, user.id, reactionType, recieverID, chatMessageID, threadID, currentChat, chatKey);
        if (duplicate) {
            console.log('Duplikat');
            return
        }
        await addDoc(threadReactionDocRef, reaction);
        await this.addReactionData(threadReactionDocRef, chatMessageID, threadID, icon, recieverID, chatKey, currentChat);
    }

    async saveChatReactions(ID: string, messageID: string, reaction: any, firestoreID: string, icon: string, chatKey: string, currentChat: string) {
        const userReactionDocRef = collection(this.firestore, `users/${ID}/messages/${messageID}/reactions`);
        const chatReactionRef = doc(this.firestore, `users/${ID}/messages/${messageID}/reactions/${firestoreID}`);
        await setDoc(chatReactionRef, reaction);
        await this.addReactionData(userReactionDocRef, messageID, '', icon, ID, chatKey, currentChat);
    }

    getReactionObject(reactor: any, icon: string, reactionType: string) {
        console.log(reactor);
        return {
            name: reactor.name,
            reactorID: reactor.id,
            icon: icon,
            time: new Date().toISOString(),
            type: reactionType,
        }
    }

    async checkDuplikate(docRef: CollectionReference<DocumentData>, userID: string, type: string, recieverID: string, chatMessageID: string, threadID: string, currentChat: string, chatKey: string) {
        if (docRef && userID) {
            const reactions = await this.mapDocs(docRef);
            const duplicate = await this.isDuplikate(reactions, userID, type, recieverID, chatMessageID, threadID, currentChat, chatKey);
            if (duplicate) {
                console.log('Duplikat', duplicate);
                return true
            }
            console.log('kein Duplikat', duplicate);
            return false;
        }
        console.log('kein User oder DocRef ');
        return true
    }



    async isDuplikate(reactions: any[], userID: string, type: string, recieverID: string, chatMessageID: string, threadID: string, currentChat: string, chatKey: string) {
        const duplicate = reactions.find(reaction => reaction.reactorID === userID);
        if (duplicate) {
            console.log('Es wurde bereits reagiert', duplicate.docID);
            if (duplicate.type !== type) {
                console.log('type stimmt nicht überein', type);
                await this.updateReaction(recieverID, chatMessageID, threadID, currentChat, chatKey, userID, duplicate);
            } else {
                console.log('type stimmt überein', type);
            }
            return true
        }
        return false
    }


    async updateReaction(recieverID: string, chatMessageID: string, threadID: string, currentChat: string, chatKey: string, userID: string, duplicate: any) {
        if (chatKey === 'thread') {
            await this.updateThreadReaction(recieverID, chatMessageID, threadID, duplicate);
        }
        if (chatKey === 'chat') {
            if (currentChat === 'user') {
                await this.updateUserReaktion(recieverID, chatMessageID, userID, duplicate);
            }
            if (currentChat === 'channel') {
                await this.updateChannelReaction(recieverID, chatMessageID, duplicate);
            }
        }
    }

    async updateThreadReaction(recieverID: string, chatMessageID: string, threadID: string, duplicate: any) {
        const threadReactionRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}/reactions/${duplicate.docID}`);
        const threadRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}`);
        await this.updateDuplikateReaction(threadReactionRef, threadRef);

    }

    async updateUserReaktion(recieverID: string, chatMessageID: string, userID: string, duplicate: any) {
        const recieverReactionDocRef = doc(this.firestore, `users/${recieverID}/messages/${chatMessageID}/reactions/${duplicate.docID}`);
        const recieverDocRef = doc(this.firestore, `users/${recieverID}/messages/${chatMessageID}`);
        await this.updateDuplikateReaction(recieverReactionDocRef, recieverDocRef);
        const userReactionDocRef = doc(this.firestore, `users/${userID}/messages/${chatMessageID}/reactions/${duplicate.docID}`);
        const userDocRef = doc(this.firestore, `users/${userID}/messages/${chatMessageID}`);
        await this.updateDuplikateReaction(userReactionDocRef, userDocRef);

    }

    async updateChannelReaction(recieverID: string, chatMessageID: string, duplicate: any) {
        const channelReactionDocRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/reactions/${duplicate.docID}`);
        const channelDocRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}`);
        await this.updateDuplikateReaction(channelReactionDocRef, channelDocRef);
    }

    async updateDuplikateReaction(reactionRef: DocumentReference<DocumentData>, docRef: DocumentReference<DocumentData>) {
        await updateDoc(reactionRef, this.currentReaction);
        await updateDoc(docRef, {
            lastReaction: this.currentReaction.icon,
        });

    }


    async addReactionData(docRef: any, chatMessageID: string, threadID: string, icon: string, recieverID: string, chatKey: string, currentChat: string) {
        let messageDocRef: any;
        if (chatKey === 'thread') {
            messageDocRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}`)
        }
        if (chatKey === 'chat') {
            if (currentChat === 'channel') {
                messageDocRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}`)
            }
            if (currentChat === 'user') {
                messageDocRef = doc(this.firestore, `users/${recieverID}/messages/${chatMessageID}`)
            }
        }
        await updateDoc(messageDocRef, {
            reactionLength: await this.getReactionCount(docRef),
            lastReaction: icon,
        })
    }



    async getReactionCount(docRef: any) {
        try {
            const querySnapshot = await getDocs(docRef);
            const reactionCount = querySnapshot.size;
            console.log('Anzahl der Reaktionen:', reactionCount);
            return reactionCount
        } catch (error) {
            console.error('Fehler beim Abrufen der Reaktionen:', error);
            return 0;
        }

    }

    async findAllReactions(message: any, recieverID: string, userID: string, type: string, index: number) {
        const docRef = type === 'thread' ? this.getThreadDocRef(message, recieverID) : type === 'chat' ? this.getChatDocRef(message, recieverID) : null
        if (docRef) {
            const reactions = await this.mapDocs(docRef);
            this.allReactions = reactions;
        }
        this.reactionIndex = index;
        if (type === 'thread') {
            this.isThreadReaction = !this.isThreadReaction
        } else {
            this.isReaction = !this.isReaction
        }

    }

    getThreadDocRef(message: any, recieverID: string) {
        this.sharedService.getDataFromLocalStorage('messageID')
        const messageID = this.sharedService.data;
        const threadID = message.id;
        const docRef = collection(this.firestore, `channels/${recieverID}/messages/${messageID}/thread/${threadID}/reactions`);
        return docRef;
    }

    getChatDocRef(message: any, recieverID: string) {
        const chat = this.sharedService.getDataFromLocalStorage('chat');
        let collectionName = chat === 'channel' ? 'channels' : chat === 'user' ? 'users' : '';
        const docRef = collection(this.firestore, `${collectionName}/${recieverID}/messages/${message.id}/reactions`);
        return docRef
    }


    async mapDocs(docRef: CollectionReference<DocumentData>) {
        const docSnap = await getDocs(docRef);
        const mapData = docSnap.docs.map((doc) => ({
            docID: doc.id,
            ...doc.data(),
        }));
        return mapData
    }


    async getCurrentReciever(recieverID: string) {
        const channelData = await this.channelService.getChannels();
        console.log(channelData);
        channelData.forEach(channel => {
            if (channel.id === recieverID) {
                this.reciever = channel;
                console.log(this.reciever);

            }
        })
    }

    toogleIconBar(event: Event) {
        this.isIconBar = !this.isIconBar
        event.stopPropagation();
    }

    toggleFooterIconBar() {
        this.isFooterIconBar = !this.isFooterIconBar;
    }


    isUser(reaction: any, user: any) {

        return reaction.id === user.id
    }



}