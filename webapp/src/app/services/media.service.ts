import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { AudioUploadResponse, DeleteResponse, MediaResult } from '../customTypes';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  constructor(
    private httpClient: HttpClient
  ) { }

  uploadMedia( formData: FormData ): Observable<AudioUploadResponse> {
    const headers: HttpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${ localStorage.getItem('pldyn-jfToken') }`);

    return this.httpClient.post<any>(
      '/api/v1/jellyfin/upload',
      formData,
      { headers: headers }
    ).pipe (
        map( ( data: any ) => {
          return {
            status: data.status,
            message: data.message,
            error: false,
            uploadData: data.uploadData
          } as AudioUploadResponse;
        }),
        catchError( error => {
          console.error( 'Error uploading media:', error );

          if ( error.status === 401 ) {
            return of({
              status: 401,
              message: 'Unauthorized',
              error: true
            } as AudioUploadResponse );
          }

          return of({
            status: 500,
            message: 'Internal server error',
            error: true
          } as AudioUploadResponse );
        })
      );
  }

  clearMedia( mediaName: string ): Observable<DeleteResponse> {
    const headers: HttpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${ localStorage.getItem('pldyn-jfToken') }`);
    const payload = { 'fileName': mediaName };

    return this.httpClient.post<any>(
      `/api/v1/jellyfin/clear`,
      payload,
      { headers: headers }
    ).pipe(
        map( ( data: any ) => {
          return {
            status: data.status,
            message: data.message,
            error: false
          } as DeleteResponse;
        }),
        catchError( ( error: any ) => {
          if ( error.status === 401 ) {
            return of({
              status: 401,
              message: 'Unauthorized',
              error: true
            } as AudioUploadResponse );
          }

          return of({
            status: 500,
            message: 'Internal server error',
            error: true
          } as DeleteResponse );
        })
    );
  }
}
