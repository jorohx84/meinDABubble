import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../shared.service';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.class';


@Component({
  selector: 'app-thread',
  imports: [CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  threadSubscription: Subscription | null = null;
  logoutSubscription: Subscription | null = null;
  sharedService = inject(SharedService);
  message: any;
  currentReciever: any;
  currentUser: any;
  constructor() {

    this.openThreadContent();
  }
  ngOnInit() {

    this.threadSubscription = this.sharedService.openThread$.subscribe(() => {
      console.log('openThread ausgelöst!');
      this.openThreadContent();
    })

    this.logoutSubscription = this.sharedService.logoutObserver$.subscribe(() => {
      this.message = null;
      localStorage.setItem('message', JSON.stringify(this.message));
    });

  }
  ngOnDestroy() {
    if (this.threadSubscription) {
      this.threadSubscription.unsubscribe();
    }
  }
  openThreadContent() {
    this.message = this.sharedService.message;
    if (this.sharedService.user && this.sharedService.reciever && this.sharedService.message) {
      this.currentUser = this.sharedService.user;
      this.currentReciever = this.sharedService.reciever;
      console.log('Daten direkt geladen', this.currentReciever, this.currentUser);
    } else {
      console.log('hallo');
      
      this.sharedService.getDataFromLocalStorage('user');
      this.currentUser = this.sharedService.data;
      this.sharedService.getDataFromLocalStorage('reciever');
      this.currentReciever = this.sharedService.data;
      this.sharedService.getDataFromLocalStorage('message');
      this.message = this.sharedService.data;
      console.log('Daten aus localStorage geladen', this.currentReciever, this.currentUser);
    }


    this.currentUser = this.sharedService.user;


    console.log(this.message);
    localStorage.setItem('message', JSON.stringify(this.message));
  }
}