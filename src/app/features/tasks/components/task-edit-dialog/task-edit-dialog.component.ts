import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { Task, UpdateTaskDto } from '../../../../shared/models/task.interface';

@Component({
  selector: 'app-task-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './task-edit-dialog.component.html',
  styleUrls: ['./task-edit-dialog.component.scss']
})
export class TaskEditDialogComponent {
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TaskEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task
  ) {
    // Convert array of tags to comma-separated string for the form
    const tagsString = data.tags ? data.tags.join(', ') : '';
    
    this.editForm = this.fb.group({
      title: [data.title, [Validators.required]],
      description: [data.description, [Validators.required]],
      priority: [data.priority || 'medium'],
      dueDate: [data.dueDate ? new Date(data.dueDate) : null],
      tags: [tagsString],
      completed: [data.completed]
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      return;
    }

    const formValues = this.editForm.value;
    
    // Parse tags from comma-separated string to array
    const tags = formValues.tags 
      ? formValues.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) 
      : undefined;
    
    const updatedTask: UpdateTaskDto = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      priority: formValues.priority,
      dueDate: formValues.dueDate,
      tags,
      completed: formValues.completed
    };

    this.dialogRef.close(updatedTask);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 