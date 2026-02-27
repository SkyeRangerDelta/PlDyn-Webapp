import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { ClientContributionResult, ClientSettingsResult } from '../customTypes';

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
    const headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

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

        // Note: 401 errors are handled by AuthInterceptor (logout + redirect)
        // This error handler is for other errors (500, network issues, etc.)
        return of({
          status: err.status || 500,
          message: err.message || 'Internal server error',
          settings: {},
          success: false
        } as ClientSettingsResult );
      })
    );
  }

  getContributions(): Observable<ClientContributionResult> {
    const headers: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return this.httpClient.post<any>(
      this.contributionsEndpoint,
      {},
      { headers: headers }
    ).pipe (
      map( (data: any) => {
        if ( data.status !== 200 || !data.data ) {
          return {
            message: data.message,
            data: {
              contributions: [],
              errorMessage: 'No contributions found.'
            }
          } as ClientContributionResult;
        }

        return {
          message: data.message,
          data: {
            contributions: data.contributions,
            errorMessage: ''
          }
        } as ClientContributionResult;
      }),
      catchError( (err: any) => {
        console.error( 'Error fetching contributions\n', err );

        // Note: 401 errors are handled by AuthInterceptor (logout + redirect)
        // This error handler is for other errors (500, network issues, etc.)
        return of({
          message: err.message || 'Internal server error',
          data: {
            contributions: [],
            errorMessage: err.message || 'Internal server error.'
          }
        } as ClientContributionResult );
      })
    );
  }
}
