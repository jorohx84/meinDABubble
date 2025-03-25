import { Router } from "@angular/router";
import { Injectable, inject } from "@angular/core";
import { Subject, subscribeOn } from "rxjs";
@Injectable({
    providedIn: 'root',
})
export class SharedService {
    router = inject(Router)
    user: any;
    data: any;
    private openChannelOverlay = new Subject<void>();
    openChannelOverlay$ = this.openChannelOverlay.asObservable();
    private reloadChannel = new Subject<void>();
    reloadChannel$ = this.reloadChannel.asObservable();
    private loadChatWindow = new Subject<void>();
    loadChatWindow$ = this.loadChatWindow.asObservable();
    private openThread = new Subject<void>();
    openThread$ = this.openThread.asObservable();
    reciever: any;
    chat: string = '';
    message: any;

    navigateToPath(path: string) {
        this.router.navigate([path]);
    }

    getUserFromLocalStorage() {
        const storedData = localStorage.getItem('user');
        if (storedData) {
            this.user = JSON.parse(storedData);
            console.log('Benutzer aus localStorage wiederhergestellt:', this.user);

        } else {
            console.log('Kein Benutzer im localStorage gefunden');
        }

    }

    getDataFromLocalStorage(data: any) {
        const storedData = localStorage.getItem(data);

        if (storedData) {
            try {

                this.data = JSON.parse(storedData);
                console.log('Daten aus localStorage wiederhergestellt (als JSON):', this.data);
            } catch (e) {

                this.data = storedData;
                console.log('Daten aus localStorage wiederhergestellt (als String):', this.data);
            }
        } else {
            console.log('Keine Daten im localStorage gefunden');
        }
    }

    openOverlayChannel() {
        this.openChannelOverlay.next();
    }

    reloadChannelData() {
        
        this.reloadChannel.next();
    }

    loadChat() {
        this.loadChatWindow.next();
    }

    getReciever(reciever: any, user: any, chat: string) {
        localStorage.setItem('reciever', JSON.stringify(reciever));
        localStorage.setItem('chat', chat);
        this.chat = chat;
        this.reciever = reciever;
        this.user = user;

    }

    setMessage(message: any) {
        console.log(message);
        this.message = message;
    }

    initializeThread() {
        console.log('initialisieren');
        console.log(this.message);
        
        this.openThread.next();
    }


    
}