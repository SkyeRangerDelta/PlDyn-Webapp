import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { ClientSettingsResult } from '../customTypes';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private settingsEndpoint = '/api/v1/GetSettings';
  private updateSettingsEndpoint = '/api/v1/UpdateSettings';
  private contributionsEndpoint = '/api/v1/GetRecentContributions';
  private updateContributionsEndpoint = '/api/v1/UpdateContributions';

  constructor( private httpClient: HttpClient ) { }

  getSettings(): Observable<ClientSettingsResult> {
    // fetch settings
    const headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${ localStorage.getItem('pldyn-jfToken') }`);

    return this.httpClient.post<any>(
      this.settingsEndpoint,
      {},
      { headers: headers }
    ).pipe (
      map( (data: any) => {
        if ( data.status !== 200 || !data.data ) {
          console.error( 'Error fetching settings' );

          return {
            status: data.status,
            message: data.message,
            settings: {},
            success: false
          } as ClientSettingsResult;
        }

        return {
          status: data.status,
          message: data.message,
          settings: data.settings,
          success: true
        } as ClientSettingsResult;
      }),
      catchError( (err: any) => {
        console.error( 'Error fetching settings\n', err );

        return of({
          status: 500,
          message: 'Internal server error',
          settings: {},
          success: false
        } as ClientSettingsResult );
      })
    );
  }

  getContributions(): Observable<ClientSettingsResult> {
    // fetch settings
    const headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${ localStorage.getItem('pldyn-jfToken') }`);

    return this.httpClient.post<any>(
      this.contributionsEndpoint,
      {},
      { headers: headers }
    ).pipe (
      map( (data: any) => {
        if ( data.status !== 200 || !data.data ) {
          console.error( 'Error fetching settings' );

          return {
            status: data.status,
            message: data.message,
            settings: {},
            success: false
          } as ClientSettingsResult;
        }

        return {
          status: data.status,
          message: data.message,
          settings: data.settings,
          success: true
        } as ClientSettingsResult;
      }),
      catchError( (err: any) => {
        console.error( 'Error fetching settings\n', err );

        return of({
          status: 500,
          message: 'Internal server error',
          settings: {},
          success: false
        } as ClientSettingsResult );
      })
    );
  }
}
