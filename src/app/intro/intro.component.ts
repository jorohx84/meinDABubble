import { CommonModule } from '@angular/common';
import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-intro',
  imports: [CommonModule],
  templateUrl: './intro.component.html',
  styleUrl: './intro.component.scss'
})
export class IntroComponent {

  ngAfterViewInit(){
    this.logoAnimation();
  }


  logoAnimation() {
    const logoContainer = document.getElementById('logoContainer');
    setTimeout(() => {
      console.log('hallo');

      logoContainer?.classList.add('moveLeft');
    }, 1000);

  }
}
