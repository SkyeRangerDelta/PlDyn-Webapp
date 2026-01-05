import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private excludedUrls = [
    '/api/v1/jellyfin/authenticate',
    '/api/v1/jellyfin/status',
    '/api/v1/status'
  ];

  private authService: AuthService | null = null;

  constructor(
    private router: Router,
    private injector: Injector
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if this is a protected endpoint
    const isProtectedEndpoint = !this.excludedUrls.some(url => request.url.includes(url));

    if (isProtectedEndpoint) {
      // Verify token exists before making the request
      const token = localStorage.getItem('pldyn-jfToken');

      if (!token) {
        console.warn('No token found - logging out user');
        this.getAuthService().logout();
        this.router.navigate(['/login']);

        // Return an error observable to prevent the request
        return throwError(() => new HttpErrorResponse({
          error: 'No authentication token',
          status: 401,
          statusText: 'Unauthorized'
        }));
      }

      // Add Authorization header if not already present
      if (!request.headers.has('Authorization')) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token is invalid or expired - logout and redirect
          console.warn('401 Unauthorized - logging out user');
          this.getAuthService().logout();
          this.router.navigate(['/login']);
        }

        // Re-throw the error so services can still handle it if needed
        return throwError(() => error);
      })
    );
  }

  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }
}
