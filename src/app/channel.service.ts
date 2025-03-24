import { inject, Injectable } from "@angular/core";
import { Firestore, collection, getDocs } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root',
})
export class ChannelService{
    firestore=inject(Firestore)
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
      
}