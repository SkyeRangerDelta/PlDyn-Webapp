import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, of } from 'rxjs';
import { AuthResult } from '../customTypes';

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
    return localStorage.getItem('pldyn-session') === 'active';
  }

  public get getUsername(): string {
    return this.uname.value;
  }

  constructor( private httpClient: HttpClient ) {
    // If they refresh the page, we need to re-acquire the token username.
    // getTokenUsername() will handle logout if token is invalid
    this.getTokenUsername()
      .then( (username: string) => {
        if (username) {
          this.setUsername( username );
          this.authState.next(true);
        }
      })
      .catch( (error) => {
        console.error( 'Error getting token username on init:', error );
        // getTokenUsername() already called logout() in its error handlers
        // Ensure authState is synced
        this.authState.next(false);
      });
  }

  authenticateUser( user: string, pass: string ): Observable<AuthResult> {
    const payload = { "user": user, "pass": pass };

    return this.httpClient.post<any>( this.backendHost, payload )
      .pipe(
        map( (data: any) => {
          if ( data.status === 500 ) {
            console.log( 'Internal server error' );

            return {
              status: 500,
              message: 'Internal server error',
              success: false
            } as AuthResult;
          }

          if ( data.status !== 200 ) {
            console.log( 'Error authenticating user' );

            return {
              status: data.status,
              message: data.message,
              success: false
            } as AuthResult;
          }

          // Cookie is set automatically by the browser from the Set-Cookie header.
          // We only store a lightweight session flag (no token).
          localStorage.setItem( 'pldyn-session', 'active' );

          this.authState.next(true);

          // Username comes directly from the login response
          if ( data.username ) {
            this.setUsername( data.username );
          }

          return {
            status: 200,
            message: 'User authenticated',
            success: true
          } as AuthResult;
        }),
        catchError( (error: any) => {
            console.error( error );

            try {
              localStorage.removeItem('pldyn-session');
            }
            catch {
              console.error( 'Couldnt remove local storage session flag (if any).' );
            }

            this.authState.next( false );

            return of({
              status: 500,
              message: 'Internal server error',
              success: false
            } as AuthResult );
        })
      );
  }

  logout() {
    // Only call the backend if there's an active session (i.e. a cookie to clear).
    // Without a session the backend would reject the request with 401, which the
    // interceptor would catch and redirect to /login — causing a forced redirect
    // even on public pages.
    if (this.isAuthenticated) {
      this.httpClient.post('/api/v1/jellyfin/logout', {}).subscribe({
        error: () => { /* best-effort — cookie may already be expired */ }
      });
    }

    localStorage.removeItem('pldyn-session');

    this.authState.next(false);
    this.uname.next('Program');
  }

  setAuthState( authed: boolean ) {
    this.authState.next( authed );
  }

  setUsername( uname: string ) {
    this.uname.next( uname );
  }

  async getTokenUsername(): Promise<string> {
    if ( !this.isAuthenticated ) {
      this.logout();
      return '';
    }

    try {
      const data: any = await firstValueFrom(this.httpClient.post(
        '/api/v1/GetTokenData',
        { params: [ 'User' ] } ));

      const uname: string = data.data.User;
      if ( !data || !data.data || !uname ) {
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
