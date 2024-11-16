import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [
    MatFormFieldModule
  ]
})
export class LoginComponent {
  jwtAuthToken: string = "";
}
