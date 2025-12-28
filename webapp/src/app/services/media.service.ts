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

          // Note: 401 errors are handled by AuthInterceptor (logout + redirect)
          // This error handler is for other errors (500, network issues, etc.)
          return of({
            status: error.status || 500,
            message: error.message || 'Internal server error',
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
          // Note: 401 errors are handled by AuthInterceptor (logout + redirect)
          // This error handler is for other errors (500, network issues, etc.)
          return of({
            status: error.status || 500,
            message: error.message || 'Internal server error',
            error: true
          } as DeleteResponse );
        })
    );
  }
}
