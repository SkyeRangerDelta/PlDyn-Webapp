import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of } from 'rxjs';
import jwt from 'jsonwebtoken';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private backendHost = '/api/v1/jellyfin/authenticate';
  private authState = new BehaviorSubject<boolean>(this.isAuthenticated);
  authState$ = this.authState.asObservable();

  private uname = new BehaviorSubject<string>( 'Program' );
  uname$ = this.uname.asObservable();

  public get isAuthenticated(): boolean {
    return !!localStorage.getItem('pldyn-jfToken');
  }

  public get getUsername(): string {
    return this.uname.value;
  }

  constructor( private httpClient: HttpClient ) {
    // If they refresh the page, we need to re-acquire the token username.
    try {
      this.getTokenUsername().then( (username: string) => {
        this.setUsername( username );
      });
    }
    catch {
      console.error( 'Couldnt get token username (if any).' );
    }
  }

  authenticateUser( user: string, pass: string ) {
    const payload = { "user": user, "pass": pass };
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.httpClient.post<any>( this.backendHost, payload, { headers: headers } )
      .pipe(
        map( (data: any) => {
            if ( data.status !== 200 || !data.data ) {
              console.log( 'Error authenticating user' );
              return false;
            }

            localStorage.setItem( 'pldyn-jfToken', data.data );

            this.authState.next(true);

            this.getTokenUsername().then( (username: string) => {
              this.setUsername( username );
            });

            return true;
          }
        ),
        catchError( (error: any) => {
            console.error( error );

            try {
              localStorage.removeItem('pldyn-jfToken');
            }
            catch {
              console.error( 'Couldnt remove local storage token (if any).' );
            }

            this.authState.next(false);

            return of(false);
        })
      );
  }

  logout() {
    localStorage.removeItem('pldyn-jfToken');

    this.authState.next(false);
  }

  setAuthState( authed: boolean ) {
    this.authState.next( authed );
  }

  setUsername( uname: string ) {
    this.uname.next( uname );
  }

  async getTokenUsername(): Promise<string> {
    const clientToken = localStorage.getItem('pldyn-jfToken');

    if ( !this.isAuthenticated ) {
      this.logout();
      return '';
    }

    if ( !clientToken ) {
      this.logout();
      return '';
    }

    try {
      const data: any = await this.httpClient.post(
        '/api/v1/gettokendata',
        { params: [ 'User' ] },
        { headers: new HttpHeaders().set( 'Authorization', `Bearer ${ clientToken }` ) } )
        .toPromise();

      const uname: string = data.data.User;
      if ( !uname ) {
        this.logout();
        return '';
      }

      return uname;
    }
    catch {
      this.logout();
      return '';
    }
  }
}
