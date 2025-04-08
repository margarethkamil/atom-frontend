import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { 
  EMPTY, 
  Observable, 
  Subject, 
  catchError, 
  finalize, 
  take,
  takeUntil, 
  tap
} from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../shared/models/user.interface';
import { RegisterConfirmDialogComponent } from '../../components/register-confirm-dialog/register-confirm-dialog.component';
import { SeoService } from '../../../../core/services/seo.service';
import { GAnalyticsService } from '../../../../core/services/ganalytics.service';

/**
 * Login component that handles the authentication flow:
 * 1. User attempts to login with email
 * 2. If user exists, they are logged in and redirected
 * 3. If user doesn't exist, a registration confirmation dialog is shown
 * 4. If confirmed, a new account is created
 * 5. Alternatively, user can login with Google
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  // Form setup
  loginForm: FormGroup = this.createForm();
  
  // UI state
  isLoading = false;
  isGoogleLoading = false;
  errorMessage = '';
  userAlreadyAuthenticated = false;
  currentUser: User | null = null;
  
  // Subscription management
  private destroy$ = new Subject<void>();
  
  // Flag to prevent navigation loops
  private isNavigating = false;
  
  // Store the last login response to check if user was already created
  private lastLoginResponse: any = null;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private seoService: SeoService,
    private analyticsService: GAnalyticsService
  ) {
    console.log('LoginComponent initialized');
  }

  /**
   * Check if user is already logged in and redirect if necessary
   */
  ngOnInit(): void {
    // console.log('Checking authentication status');
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(user => {
        //console.log('Current user from auth service:', user);
        if (user) {
          // console.log('User is already authenticated:', user.email);
          // console.log('User details:', {
           // displayName: user.displayName,
           // photoURL: user.photoURL,
           // authType: user.authType
          //});
          this.currentUser = user;
          this.userAlreadyAuthenticated = true;
        } else {
          // console.log('No authenticated user found');
          this.userAlreadyAuthenticated = false;
          this.currentUser = null;
        }
      });
    
    // Set SEO metadata
    this.seoService.updateSeoMetadata({
      title: 'Login',
      description: 'Login to ATOM Task Manager to manage your tasks efficiently.',
      url: window.location.href
    });
    
    // Track page view for login page
    this.analyticsService.sendPageView('/login', 'Login Page');
  }

  /**
   * Navigate to tasks page from already authenticated state
   */
  continueToTasks(): void {
    if (this.isNavigating) {
      return; // Prevent multiple navigations
    }
    
    this.isNavigating = true;
    // console.log('Navigating to tasks page');
    this.router.navigate(['/tasks'])
      .finally(() => {
        this.isNavigating = false;
      });
  }

  /**
   * Log out the current user
   */
  logout(): void {
    this.isLoading = true;
    this.authService.logout();
    this.userAlreadyAuthenticated = false;
    this.currentUser = null;
    this.snackBar.open('Sesión cerrada exitosamente', 'Cerrar', { duration: 3000 });
    this.isLoading = false;
  }

  /**
   * Initialize the login form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.maxLength(100)
      ]]
    });
  }

  /**
   * Handle the form submission and authentication flow
   */
  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading || this.isNavigating) {
      // console.log('Form invalid, loading, or navigation in progress - stopping submission');
      return;
    }

    // If user is already authenticated, just navigate to tasks
    if (this.userAlreadyAuthenticated) {
      // console.log('User already authenticated, navigating to tasks');
      this.continueToTasks();
      return;
    }

    const email = this.loginForm.get('email')?.value?.trim();
    if (!email) {
      // console.log('No email provided');
      return;
    }

    // console.log('Form submitted with email:', email);
    this.startAuthFlow(email);
  }

  /**
   * Start the authentication flow by attempting login
   * @param email The email to authenticate
   */
  private startAuthFlow(email: string): void {
    // Double-check authentication status
    if (this.userAlreadyAuthenticated || this.authService.isAuthenticated()) {
      // console.log('User already authenticated, skipping login flow');
      this.continueToTasks();
      return;
    }
    
    // console.log('Starting auth flow for email:', email);
    this.updateUIState(true);
    
    this.authService.login(email).pipe(
      take(1), // Ensure we only take one emission
      tap(response => {
        // console.log('Login response in component:', response);
        // console.log('User exists status:', response.userExists);
        // Store the response for later use
        this.lastLoginResponse = response;
      }),
      catchError(error => this.handleLoginError(error, email)),
      finalize(() => {
        // console.log('Login flow completed');
        this.updateUIState(false);
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      // Check if user became authenticated
      if (this.authService.isAuthenticated()) {
        // console.log('User authenticated during login flow');
        this.continueToTasks();
        return;
      }

      // Check for successful login even if userExists isn't explicitly set
      const isLoginSuccessful = response.status === 'success' && 
                               (response.message === 'Login successful' || 
                                response.message?.includes('logged in'));
      const hasValidUserData = response.data?.user && response.data?.token;
      
      if (response.userExists || (isLoginSuccessful && hasValidUserData)) {
        // console.log('User authenticated successfully, navigating to tasks page');
        // If we have valid user data but aren't authenticated yet, store the data
        if (hasValidUserData && !this.authService.isAuthenticated()) {
          // console.log('Storing auth data from login response');
          this.authService.storeAuthData(response.data);
        }
        this.handleSuccessfulAuth('¡Inicio de sesión exitoso!');
      } else {
        // console.log('User does not exist, showing registration dialog for:', email);
        this.showRegistrationDialog(email);
      }
    });
  }

  /**
   * Handle errors during login attempt
   * @param error The HTTP error response
   * @param email The email being authenticated
   * @returns Observable with empty or error
   */
  private handleLoginError(error: HttpErrorResponse, email: string): Observable<never> {
    // console.error('Login error occurred:', error);
    
    try {
      // Extract useful info from the error response if available
      const serverError = error.error?.message || error.error?.error || error.message;
      const errorDetails = {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        serverMessage: serverError,
        timestamp: new Date().toISOString()
      };
      // console.error('Login error details:', errorDetails);
      
      if (error.status === 0) {
        // Network error
        this.errorMessage = 'Network error. Please check your connection.';
      } else if (error.status === 404) {
        // User not found - show registration dialog
        // console.log('User not found (404), showing registration dialog');
        setTimeout(() => this.showRegistrationDialog(email), 0);
        return EMPTY;
      } else if (error.status === 401) {
        // Unauthorized
        this.errorMessage = 'Invalid credentials. Please try again.';
      } else if (error.status === 500) {
        // Check if it's a "user doesn't exist" type error
        if (serverError === 'Failed to create user account' || 
            errorDetails.serverMessage === 'Failed to create user account' ||
            error.error?.serverMessage === 'Failed to create user account') {
          // console.log('User does not exist (500), showing registration dialog');
          setTimeout(() => this.showRegistrationDialog(email), 0);
          return EMPTY;
        }
        // Other server errors
        this.errorMessage = 'Server error. Please try again later.';
      } else {
        // Other errors
        this.errorMessage = 'Authentication error. Please try again.';
      }
    } catch (parseError) {
      // console.error('Error while parsing error:', parseError);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
    
    return EMPTY;
  }

  /**
   * Show a dialog to confirm new user registration
   * @param email The email to register
   */
  private showRegistrationDialog(email: string): void {
    // If user is somehow already authenticated, don't show dialog
    if (this.userAlreadyAuthenticated || this.authService.isAuthenticated()) {
      // console.log('User already authenticated, not showing registration dialog');
      this.continueToTasks();
      return;
    }
    
    // console.log('Showing registration dialog for email:', email);
    const dialogRef = this.dialog.open(RegisterConfirmDialogComponent, {
      width: '400px',
      data: { email },
      disableClose: true
    });

    dialogRef.afterClosed().pipe(
      take(1), // Ensure we only take one emission
      tap(confirmed => console.log('Registration dialog closed with result:', confirmed)),
      takeUntil(this.destroy$)
    ).subscribe((confirmed: boolean) => {
      // Check again if user became authenticated while dialog was open
      if (this.userAlreadyAuthenticated || this.authService.isAuthenticated()) {
        // console.log('User became authenticated, skipping registration');
        this.continueToTasks();
        return;
      }
      
      if (confirmed) {
        // console.log('User confirmed registration, navigating directly to tasks page');
        // Show success message
        this.snackBar.open('¡Bienvenido! Creando tu cuenta...', 'Cerrar', {
          duration: 3000
        });
        
        // Navigate to tasks immediately without waiting for registration
        this.continueToTasks();
        
        // Attempt registration in the background
        this.registerInBackground(email);
      } else {
        // console.log('User canceled registration');
      }
    });
  }

  /**
   * Attempt to register user in the background without blocking navigation
   * @param email The email to register
   */
  private registerInBackground(email: string): void {
    // Use display name from email (before the @)
    const displayName = email.split('@')[0];
    
    // Attempt registration without blocking UI
    this.authService.register(email, displayName).pipe(
      take(1),
      catchError(error => {
        // console.log('Background registration error (ignored):', error);
        return EMPTY;
      })
    ).subscribe({
      next: (response) => {
        // console.log('Background registration completed:', response);
      }
    });
  }

  /**
   * Handle successful authentication
   * @param message Success message to display
   */
  private handleSuccessfulAuth(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000
    });
    this.continueToTasks();
  }

  /**
   * Login with Google
   */
  loginWithGoogle(): void {
    if (this.isGoogleLoading || this.isNavigating) {
      // console.log('Google loading or navigation in progress - stopping submission');
      return;
    }
    
    // console.log('Starting Google login flow');
    this.isGoogleLoading = true;
    this.errorMessage = '';
    
    this.authService.loginWithGoogle().pipe(
      take(1),
      catchError(error => {
        // console.error('Google login error:', error);
        if (error.status === 501) {
          this.errorMessage = 'Google login no está completamente implementado en esta versión.';
        } else {
          this.errorMessage = 'Error de inicio de sesión con Google. Por favor, intenta otra vez.';
        }
        return EMPTY;
      }),
      finalize(() => {
        this.isGoogleLoading = false;
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      if (response && response.data?.user) {
        this.handleSuccessfulAuth('Inicio de sesión con Google exitoso!');
      }
    });
  }

  /**
   * Update UI loading state
   * @param isLoading Loading state to set
   * @param clearError Whether to clear error message
   */
  private updateUIState(isLoading: boolean, clearError: boolean = true): void {
    // console.log(`Updating UI state: isLoading=${isLoading}, clearError=${clearError}`);
    this.isLoading = isLoading;
    if (clearError) {
      this.errorMessage = '';
    }
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // console.log('LoginComponent being destroyed, cleaning up subscriptions');
    this.destroy$.next();
    this.destroy$.complete();
  }
} 