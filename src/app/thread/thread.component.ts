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
  sharedService = inject(SharedService);
  message: any;
constructor(){
  this.sharedService.getDataFromLocalStorage('message');
  this.message=this.sharedService.data;
console.log(this.message);

}
  ngOnInit() {

    this.threadSubscription = this.sharedService.openThread$.subscribe(() => {
      console.log('openThread ausgelöst!');

      this.openThreadContent();
    })
  }
  ngOnDestroy() {
    if (this.threadSubscription) {
      this.threadSubscription.unsubscribe();
    }
  }
  openThreadContent() {
    this.message = this.sharedService.message;
    console.log(this.message);
    localStorage.setItem('message', JSON.stringify(this.message));
  }
}