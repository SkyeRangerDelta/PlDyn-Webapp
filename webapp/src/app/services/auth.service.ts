import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private backendHost = '/api/v1/jellyfin/authenticate';
  private authState = new BehaviorSubject<boolean>(this.isAuthenticated);
  authState$ = this.authState.asObservable();

  public get isAuthenticated(): boolean {
    return !!localStorage.getItem('jfAccessToken');
  }

  constructor( private httpClient: HttpClient ) {}

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

            console.log( data );

            localStorage.setItem('jfAccessToken', data.data.AccessToken);
            localStorage.setItem('jfUsername', data.data.User.Name);

            this.authState.next(true);

            return true;
          }
        ),
        catchError( (error: any) => {
            console.error( error );

            try {
              localStorage.removeItem('jfAccessToken');
              localStorage.removeItem('jfUsername');
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
    localStorage.removeItem('jfAccessToken');
    localStorage.removeItem('jfUsername');

    this.authState.next(false);
  }

  setAuthState( authed: boolean ) {
    this.authState.next( authed );
  }

  getUsername() {
    const uname = localStorage.getItem('jfUsername');

    if ( !uname ) {
      return this.logout();
    }

    return uname;
  }
}
