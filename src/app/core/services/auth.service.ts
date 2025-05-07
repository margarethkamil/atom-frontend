import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user.interface';

// Inicializa Firebase al cargar este servicio
const firebaseApp = initializeApp(environment.firebase);
const auth = getAuth(firebaseApp);

/**
 * Auth response interface for API responses
 */
export interface AuthResponse {
  status: string;
  message: string;
  userExists: boolean;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Authentication service that handles user login, registration, and session management
 * Uses backend-managed authentication
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Current user state as an observable
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  /**
   * Keys used to store auth data in localStorage
   */
  private readonly userKey = 'auth_user';
  private readonly tokenKey = 'auth_token';
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // console.log('Auth Service initialized with API URL:', environment.apiUrl);
    
    // Check if user data exists in localStorage
    this.loadUserFromStorage();
  }

  /**
   * Load user from localStorage if available
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        // console.log('User loaded from storage:', user.email);
      } catch (e) {
        // console.error('Failed to parse stored user data', e);
        this.clearStoredAuth();
      }
    }
  }

  /**
   * Attempt to login with the provided email
   * @param email User's email address
   * @param displayName Optional display name
   * @returns Observable with AuthResponse indicating if user exists
   */
  login(email: string, displayName?: string): Observable<AuthResponse> {
    // console.log('Attempting login with email:', email);
    const apiUrl = `${environment.apiUrl}/auth/login`;
    
    const payload = {
      email,
      displayName: displayName || email.split('@')[0]
    };
    
    return this.http.post<AuthResponse>(apiUrl, payload).pipe(
      tap(response => {
       // console.log('Login response received from server:', response);
        
        // Check if user exists based on multiple criteria:
        // 1. Explicit userExists flag
        // 2. Success status with valid user data
        // 3. Success message indicating login (not registration)
        const userExistsExplicit = response.userExists === true;
        const hasValidUserData = !!response.data?.user && !!response.data?.token;
        const isSuccessfulLogin = response.status === 'success' && 
                                 (response.message === 'Login successful' || 
                                  response.message?.includes('logged in'));
        
        // Set the userExists flag based on our determination
        if (!response.hasOwnProperty('userExists')) {
          response.userExists = userExistsExplicit || (isSuccessfulLogin && hasValidUserData);
        }
        
        // console.log(`User exists determination: ${response.userExists} (explicit: ${userExistsExplicit}, data: ${hasValidUserData}, success: ${isSuccessfulLogin})`);
        
        if (response.userExists && response.data?.user) {
          this.setAuthData(response.data.user, response.data.token);
        } else {
          // console.log('User does not exist in the backend');
        }
      }),
      catchError(error => {
        // If we get a 404, it means the user doesn't exist
        if (error.status === 404) {
          //console.log('User not found (404), treating as non-existent user');
          
          // Return a structured response for non-existent users
          const fakeResponse: AuthResponse = {
            status: 'error',
            message: 'User not found',
            userExists: false,
            data: { user: null as any, token: '' }
          };
          return of(fakeResponse);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Register a new user with the provided email
   * @param email User's email address
   * @param displayName Optional display name
   * @param photoURL Optional photo URL
   * @returns Observable with AuthResponse
   */
  register(email: string, displayName?: string, photoURL?: string): Observable<AuthResponse> {
    //console.log('Attempting registration for', email);
    const apiUrl = `${environment.apiUrl}/auth/register`;
    
    const userData = {
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || undefined
    };
    
    //console.log('Sending registration data:', JSON.stringify(userData));
    
    return this.http.post<AuthResponse>(apiUrl, userData).pipe(
      tap(response => {
        //console.log('Registration response:', response);
        
        if (response.data?.user) {
          this.setAuthData(response.data.user, response.data.token);
        }
      }),
      catchError(error => {
        // console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Login with Google using Firebase Authentication
   * @returns Observable with AuthResponse
   */
  loginWithGoogle(): Observable<AuthResponse> {
    //console.log('Iniciando login con Google');
    
    const apiUrl = `${environment.apiUrl}/auth/google`;
    
    // Usamos las instancias de Firebase ya inicializadas
    return new Observable<AuthResponse>(observer => {
      // Importar GoogleAuthProvider dinámicamente
      import('firebase/auth').then(({ GoogleAuthProvider, signInWithPopup }) => {
        const provider = new GoogleAuthProvider();
        
        // Abrimos popup de Google para login usando la instancia auth global
        signInWithPopup(auth, provider)
          .then(result => {
            // Obtenemos el ID token de Google
            return result.user.getIdToken();
          })
          .then(idToken => {
            //console.log('Token de Google obtenido, enviando al backend');
            
            // Enviamos el token al backend
            this.http.post<AuthResponse>(apiUrl, { idToken })
              .subscribe({
                next: (response) => {
                 // console.log('Respuesta del backend recibida:', response);
                  
                  if (response.data?.user && response.data?.token) {
                    // Guardamos los datos de autenticación
                    this.setAuthData(response.data.user, response.data.token);
                    observer.next(response);
                    observer.complete();
                  } else {
                    observer.error(new Error('Respuesta del servidor incompleta'));
                  }
                },
                error: (error) => {
                  //console.error('Error en la autenticación con el backend:', error);
                  observer.error(error);
                }
              });
          })
          .catch(error => {
            // console.error('Error en el popup de Google:', error);
            observer.error(error);
          });
      }).catch(error => {
        // console.error('Error al cargar GoogleAuthProvider:', error);
        observer.error(new Error('No se pudo cargar el módulo de autenticación'));
      });
    });
  }

  /**
   * Store authentication data and update user state
   * @param user The user object
   * @param token The JWT token
   */
  private setAuthData(user: User, token: string): void {
    // Store in memory
    this.currentUserSubject.next(user);
    
    // Store in localStorage
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.tokenKey, token);
    
    // console.log('Authentication data stored for user:', user.email);
  }

  /**
   * Public method to store authentication data
   * @param authData Object containing user and token
   */
  public storeAuthData(authData: {user: User, token: string}): void {
    if (!authData || !authData.user || !authData.token) {
      //console.error('Invalid auth data:', authData);
      return;
    }
    this.setAuthData(authData.user, authData.token);
  }

  /**
   * Clear authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  /**
   * Logout the current user
   */
  logout(): Observable<void> {
    // console.log('Logging out user');
    
    // Clear authentication data
    this.clearStoredAuth();
    
    // Sign out from Firebase
    auth.signOut().catch(error => {
      //console.error('Error cerrando sesión en Firebase:', error);
    });
    
    return of(void 0);
  }

  /**
   * Get the current authentication token
   * @returns The JWT token or null if not authenticated
   */
  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Check if the user is currently authenticated
   * @returns boolean true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    const hasToken = !!this.getAuthToken();
    const hasUser = !!this.currentUserSubject.getValue();
    const isAuth = hasToken && hasUser;
    
    // console.log('Auth check:', { hasToken, hasUser, isAuth });
    return isAuth;
  }
} 