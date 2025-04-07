import { inject, Injectable } from "@angular/core";
import { Firestore, collection, getDocs } from "@angular/fire/firestore";
import { Subject } from "rxjs";
@Injectable({
    providedIn: 'root',
})
export class ChannelService {
    firestore = inject(Firestore);
    channels: any[] = [];
    channelID: string = '';
    private reloadChannel = new Subject<void>();
    reloadChannel$ = this.reloadChannel.asObservable();
    private loadEmptyChannel = new Subject<void>();
    loadEmptyChannel$ = this.loadEmptyChannel.asObservable();
    async getChannels() {
        try {
            const channelCollection = collection(this.firestore, 'channels');
            const channelSnapshot = await getDocs(channelCollection);
            return channelSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error loading channels:', error);
            throw error;
        }
    }

    async setCurrentReciever(id: string) {
        console.log(id);

        this.channels = await this.getChannels();
        const reciever = this.channels.find(reciever => reciever.id === id);
        if (reciever) {
            localStorage.setItem('reciever', JSON.stringify(reciever));
            console.log(reciever);

            return reciever
        }
    }

    findChannels(channel: any[], user: any) {
        if (user) {
            this.channels = [];
            channel.forEach((object: any) => {
                if (object.creatorID === user.id) {
                    this.channels.push(object);
                } else {
                    object.members.forEach((member: any) => {

                        if (member.id === user.id) {
                            this.channels.push(object);
                        }
                    })
                }
            })
        }
    }

    reloadChannelData(newChannelID: any) {
        this.channelID = newChannelID;
        this.reloadChannel.next();
    }

    loadWhenChannelEmpty() {
        this.loadEmptyChannel.next();

    }

    
}