import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { User } from '../models/user.class';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../user.service';
import { Router } from "@angular/router";
import { SharedService } from '../shared.service';
import { FooterComponent } from '../footer/footer.component';
@Component({
  selector: 'app-signin',
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',

})
export class SigninComponent {
  isChecked: boolean = false;
  user = new User();
  auth = inject(Auth)
  sharedservice=inject(SharedService)
  userservice = inject(UserService);
  router = inject(Router)

  routeToLogin(path:string){
    this.sharedservice.navigateToPath(path);
  }

  toggleCheckBox() {
    this.isChecked = !this.isChecked;
  }


  onSubmit(useraccount: NgForm) {
    if (this.isChecked)
    this.userservice.setUser(this.user)
    localStorage.setItem('user', JSON.stringify(this.user));
    this.router.navigate(['/avatar']);
  }


}

