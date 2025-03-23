import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../user.service';
import { SharedService } from '../shared.service';
import { user } from '@angular/fire/auth';
import { DevspaceComponent } from '../devspace/devspace.component';

@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-chat',
  imports: [CommonModule, DevspaceComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  userID: string = '';
  currentUser: any;
  userservice = inject(UserService);
  sharedservice = inject(SharedService);


  constructor() {
    this.sharedservice.getUserFromLocalStorage();
    this.userID = this.sharedservice.user.uid;

  }

  async ngOnInit() {
   await this.loadCurrenUser();
  }

  async loadCurrenUser() {
    this.currentUser = await this.userservice.getCurrentUser(this.userID);
  }

}