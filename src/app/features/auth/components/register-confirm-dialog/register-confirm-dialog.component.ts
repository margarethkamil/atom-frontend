import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/**
 * Interface for dialog input data
 */
interface RegistrationDialogData {
  email: string;
}

/**
 * Dialog component that confirms user registration
 * Displayed when a login attempt fails because the user doesn't exist
 */
@Component({
  selector: 'app-register-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './register-confirm-dialog.component.html',
  styleUrls: ['./register-confirm-dialog.component.scss']
})
export class RegisterConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RegisterConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegistrationDialogData
  ) {}

  /**
   * Confirm user registration
   * Closes the dialog with true result
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Cancel user registration
   * Closes the dialog with false result
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
} 