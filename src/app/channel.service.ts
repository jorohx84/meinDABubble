import { inject, Injectable } from "@angular/core";
import { Firestore, collection, getDocs } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root',
})
export class ChannelService{
    firestore=inject(Firestore);
    channels:any[]=[];
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
      
      async setCurrentReciever(id:string){
        console.log(id);
        
        this.channels = await this.getChannels();
        const reciever=this.channels.find(reciever=> reciever.id===id);
        if(reciever){
           localStorage.setItem('reciever', JSON.stringify(reciever));
           console.log(reciever);
           
           return reciever
        }
    }
}