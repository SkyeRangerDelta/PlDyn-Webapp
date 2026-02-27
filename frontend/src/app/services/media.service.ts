import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { catchError, map, Observable, of, Observer } from 'rxjs';
import { AudioUploadResponse, DeleteResponse, FinalizeUploadResponse, MediaResult, Song } from '../customTypes';

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
            message: error.error?.message || error.message || 'Internal server error',
            error: true
          } as AudioUploadResponse );
        })
      );
  }

  uploadSingleFile( file: File ): Observable<HttpEvent<AudioUploadResponse>> {
    const headers: HttpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${ localStorage.getItem('pldyn-jfToken') }`);

    const formData = new FormData();
    formData.append('files', file, file.name);

    return this.httpClient.post<AudioUploadResponse>(
      '/api/v1/jellyfin/upload',
      formData,
      {
        headers: headers,
        reportProgress: true,
        observe: 'events'
      }
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
            message: error.error?.message || error.message || 'Internal server error',
            error: true
          } as DeleteResponse );
        })
    );
  }

  finalizeUpload( songs: Song[] ): Observable<FinalizeUploadResponse> {
    const headers: HttpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${ localStorage.getItem('pldyn-jfToken') }`);
    const payload = { songs };

    return this.httpClient.post<any>(
      '/api/v1/jellyfin/finalize',
      payload,
      { headers: headers }
    ).pipe(
      map( ( data: any ) => {
        return {
          status: data.status,
          message: data.message,
          error: data.error,
          processedCount: data.processedCount,
          failedFiles: data.failedFiles
        } as FinalizeUploadResponse;
      }),
      catchError( ( error: any ) => {
        // Note: 401 errors are handled by AuthInterceptor (logout + redirect)
        // This error handler is for other errors (500, network issues, etc.)
        return of({
          status: error.status || 500,
          message: error.error?.message || error.message || 'Internal server error',
          error: true,
          processedCount: 0,
          failedFiles: []
        } as FinalizeUploadResponse );
      })
    );
  }

  watchTempFiles(): Observable<string> {
    return new Observable<string>((observer: Observer<string>) => {
      let eventSource: EventSource | null = null;

      // Fetch a short-lived ticket, then open SSE with it
      const openConnection = async () => {
        try {
          const res = await fetch('/api/v1/jellyfin/watch-ticket', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('pldyn-jfToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (!res.ok) {
            observer.complete();
            return;
          }

          const { ticket } = await res.json();
          eventSource = new EventSource(`/api/v1/jellyfin/watch?ticket=${encodeURIComponent(ticket)}`);

          eventSource.addEventListener('file-removed', (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            observer.next(data.fileName);
          });

          eventSource.onerror = () => {
            console.warn('[MediaService] SSE connection error');
          };
        } catch {
          observer.complete();
        }
      };

      openConnection();

      return () => {
        eventSource?.close();
      };
    });
  }
}
