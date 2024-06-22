import { Component } from '@angular/core';

@Component( {
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PlDyn Dashboard';
  flagshipLogo = 'assets/logo.png';

  generateRandomLink() {
    const interestingSites = [
      'https://www.wikipedia.org/',
      'https://www.khanacademy.org/',
      'https://www.ted.com/',
      'https://archive.org/',
      'https://www.space.com/',
    ];
    const randomIndex = Math.floor(Math.random() * interestingSites.length);
    window.location.href = interestingSites[randomIndex];
  }
}
