import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AuthResult } from '../customTypes';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [
    MatFormFieldModule
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  isSuccess: boolean = true;
  submitText: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      user: [ '', Validators.required ],
      pass: [ '', Validators.required ],
    });
  }

  onSubmit() {
    if ( this.loginForm.valid ) {
      this.submitText = 'Submitting...';

      const { user, pass } = this.loginForm.value;

      this.authUser(user, pass);
    }
    else {
      console.log( 'Invalid form submission');
    }
  }

  authUser( user: string, pass: string ) {
    // Authenticate user here
    this.authService.authenticateUser(user, pass).subscribe( (resObject: AuthResult) => {
      if ( resObject.success ) {
        this.submitText = 'User authenticated';
        this.isSuccess = true;

        this.handleAuthSuccess();
      }
      else {
        this.submitText = resObject.message;
        this.isSuccess = false;

        this.loginForm.reset();
      }
    });
  }

  getSubmitResultStyle() {
    return {
      'padding': '10px',
      'color': this.isSuccess ? 'green' : 'red'
    };
  }

  handleAuthSuccess() {
    this.typeTextAnimation(
      'Loading session...',
      50,
      () => {
        setTimeout(() => {
          this.authService.setAuthState(true);
          this.router.navigate(['/dashboard']);
        }, 1500);
      }
    )
  }

  typeTextAnimation( text: string, delay: number, callback: () => void ) {
    let index = 0;
    this.submitText = '';

    const interval = setInterval(() => {
      this.submitText += text[index];
      index++;

      if ( index === text.length ) {
        clearInterval( interval );
        callback();
      }
    }, delay);
  }
}
