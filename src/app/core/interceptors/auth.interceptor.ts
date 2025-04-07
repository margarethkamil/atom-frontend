import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Auth interceptor to add the authentication token to requests
 * and handle authentication errors
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Intercept HTTP requests to add auth token and handle errors
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token for login/register endpoints
    if (request.url.includes('/auth/login') || 
        request.url.includes('/auth/register') ||
        request.url.includes('/auth/google')) {
      return next.handle(request).pipe(
        catchError(error => this.handleAuthError(error))
      );
    }

    // For non-GET and non-DELETE requests, ensure content type is set
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Get the auth token
    const token = this.authService.getAuthToken();
    
    // If token exists, add it to the request
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      // Handle 401 Unauthorized - log the user out
      if (error.status === 401) {
       // console.log('Auth interceptor: Unauthorized request, logging out');
        this.authService.logout();
        this.router.navigate(['/login']);
      }
      
      // Handle 403 Forbidden - user doesn't have permission
      if (error.status === 403) {
        // console.log('Auth interceptor: Forbidden resource access');
      }
    }
    
    return throwError(() => error);
  }
} 