import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component( {
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    standalone: false
})
export class HomeComponent implements OnInit {
  flagshipLogo = 'assets/logo.png';
  authed = false;
  username = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.authState$.subscribe(authed => {
      this.authed = authed;
    });
    this.authService.uname$.subscribe(uname => {
      this.username = uname;
    });
  }

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
