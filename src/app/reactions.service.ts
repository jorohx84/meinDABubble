import { inject, Injectable } from "@angular/core";
import { Firestore, updateDoc, doc, addDoc, setDoc, docSnapshots } from "@angular/fire/firestore";
import { ChannelService } from "./channel.service";
import { reload } from "firebase/auth";
import { UserService } from "./user.service";
import { collection, CollectionReference, DocumentData, getDocs } from "firebase/firestore";
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
    reactionIndex: number = 0;
    messageObject: any;
    currentReaction:any;
    async addReaction(icon: string, message: any, user: any, reciever: any, reactionType: string, chatKey: string) {


        this.sharedService.getDataFromLocalStorage('chat');
        this.messageObject = message;
        const currentChat = this.sharedService.data;

        const messageID = message.id;
        const reactor = user;
        const recieverID = reciever.id




        // const isDuplikate = this.checkDuplikate(reactions, reactor, reactionType);
        //if (isDuplikate) {
        //console.log('Du hast bereits auf diese Weise reagiert');

        //  return
        //}

        const reaction = this.getReactionObject(reactor, icon, reactionType);
       this.currentReaction=reaction;
        console.log(this.currentReaction);
        
        if (chatKey === 'thread') {
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

        } else {

            if (currentChat === 'user') {
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
            if (currentChat === 'channel') {
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

        }

        await this.getCurrentReciever(recieverID);
        localStorage.setItem('reciever', JSON.stringify(this.reciever));



    }

    async checkDuplikate(docRef: CollectionReference<DocumentData>, userID: string, type: string, recieverID: string, chatMessageID: string, threadID: string, currentChat: string, chatKey: string) {
        console.log(docRef);

        console.log(userID);
        if (docRef && userID) {
            const docSnap = await getDocs(docRef);
            const reactions = docSnap.docs.map((doc) => ({

                docID: doc.id,
                ...doc.data(),
            }));
            console.log(reactions);
            const duplicate = await this.isDuplikate(reactions, userID, type, recieverID, chatMessageID, threadID, currentChat, chatKey);
            console.log(duplicate);
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
        const duplicate = reactions.find(reaction => reaction.id === userID);
        if (duplicate) {
            console.log('Es wurde bereits reagiert', duplicate.docID);
            if (duplicate.type !== type) {
                console.log('type stimmt nicht überein', type);
                console.log(currentChat);
                console.log(chatKey);

                await this.updateReaction(recieverID, chatMessageID, threadID, currentChat, chatKey, userID, duplicate);
              
            }else{
         
                console.log('type stimmt überein', type);
            }
            return true
        }

        return false

    }

    async updateReaction(recieverID: string, chatMessageID: string, threadID: string, currentChat: string, chatKey: string, userID: string, duplicate: any) {
        if (chatKey === 'thread') {
            console.log('thread');

            const threadReactionRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}/reactions/${duplicate.docID}`);
            await updateDoc(threadReactionRef, this.currentReaction);
            const threadRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}`);
            await updateDoc(threadRef, {
                lastReaction: this.currentReaction.icon,
            });
        }
        if (chatKey==='chat') {
            if (currentChat==='user') {
                const recieverReactionDocRef=doc(this.firestore, `users/${recieverID}/messages/${chatMessageID}/reactions/${duplicate.docID}`);
                const recieverDocRef=doc(this.firestore, `users/${recieverID}/messages/${chatMessageID}`);
                await updateDoc(recieverReactionDocRef, this.currentReaction);
                await updateDoc(recieverDocRef, {
                    lastReaction: this.currentReaction.icon,
                });

                const userReactionDocRef=doc(this.firestore, `users/${userID}/messages/${chatMessageID}/reactions/${duplicate.docID}`);
                const userDocRef=doc(this.firestore, `users/${userID}/messages/${chatMessageID}`);
                await updateDoc(userReactionDocRef, this.currentReaction);
                await updateDoc(userDocRef, {
                    lastReaction: this.currentReaction.icon,
                });
            }
            if (currentChat==='channel') {
                const channelReactionDocRef=doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/reactions/${duplicate.docID}`);
                const channelDocRef=doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}`);
                await updateDoc(channelReactionDocRef, this.currentReaction);
                await updateDoc(channelDocRef, {
                    lastReaction: this.currentReaction.icon,
                }); 
            }
        }
    }

    updateChatReaction(recieverID: string, chatMessageID: string, threadID: string, currentChat: string, chatKey: string, userID: string, duplicate: any){
   

    }

    async saveChatReactions(ID: string, messageID: string, reaction: any, firestoreID: string, icon: string, chatKey: string, currentChat: string) {
        const userReactionDocRef = collection(this.firestore, `users/${ID}/messages/${messageID}/reactions`);
        const chatReactionRef = doc(this.firestore, `users/${ID}/messages/${messageID}/reactions/${firestoreID}`);
       
        await setDoc(chatReactionRef, reaction);
        await this.addReactionData(userReactionDocRef, messageID, '', icon, ID, chatKey, currentChat);
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
        const chat = this.sharedService.getDataFromLocalStorage('chat');
        console.log(chat);
        let docRef;
        if (type === 'thread') {
            this.sharedService.getDataFromLocalStorage('messageID')
            const messageID = this.sharedService.data;
            console.log(messageID);//thread
            const threadID = message.id;
            docRef = collection(this.firestore, `channels/${recieverID}/messages/${messageID}/thread/${threadID}/reactions`);
        }
        if (type === 'chat') {
            let collectionName = chat === 'channel' ? 'channels' : chat === 'user' ? 'users' : '';
            docRef = collection(this.firestore, `${collectionName}/${recieverID}/messages/${message.id}/reactions`);

        }
        if (docRef) {
            const docsnap = await getDocs(docRef)
            const reactions = docsnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            console.log(reactions);
            this.allReactions = reactions;
            console.log(docsnap);
        }
        this.reactionIndex = index;
        this.isReaction = true;
    }





    getReactionObject(reactor: any, icon: string, reactionType: string) {
        console.log(reactor);

        return {
            name: reactor.name,
            id: reactor.id,
            icon: icon,
            time: new Date().toISOString(),
            type: reactionType,
        }

    }
    /*
        async updateReactions() {
            console.log(this.reciever);
    
            const newMessages = this.reciever.messages;
            console.log(newMessages);
    
            const reactionDocRef = doc(this.firestore, `channels/${this.reciever.id}`);
            await updateDoc(reactionDocRef, {
                messages: newMessages,
            });
        }
    */

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



    isCheck(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'check') {

                isCheck = true
            }
        })
        return isCheck;
    }
    isThumb(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'thumb') {

                isCheck = true
            }
        })
        return isCheck;
    }

    isRocket(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'rocket') {

                isCheck = true
            }
        })
        return isCheck;
    }

    isNerd(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'nerd') {

                isCheck = true
            }
        })
        return isCheck;
    }




    reactionCount(message: any, reactionType: string) {
        const reactions = message.reactions;
        return reactions.filter((reaction: any) => reaction.type === reactionType).length;

    }

    toogleIconBar() {
        this.isIconBar = !this.isIconBar
    }

    toggleFooterIconBar() {
        this.isFooterIconBar = !this.isFooterIconBar;
    }

    loadReactions(message: any, reactionType: string) {

        const allReactions = message.reactions;
        const reactions: any[] = [];
        allReactions.forEach((reaction: any) => {

            if (reaction.type === reactionType) {
                reactions.push(reaction);
            }
        })


        return reactions

    }

    isUser(reaction: any, user: any) {

        return reaction.id === user.id
    }

    /*
        async showReactions(recieverID: string, threadID: string, chatKey: string) {
            this.sharedService.getDataFromLocalStorage('message');
            const chatMessageID = this.sharedService.data.id;
            console.log(recieverID);
            console.log(threadID);
            console.log(chatKey);
            console.log(chatMessageID);
    
    
    
            //    const reactioDocRef = collection(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}/reactions`);
            // const docSnapshot= await getDocs(reactioDocRef);
        }
    */



}