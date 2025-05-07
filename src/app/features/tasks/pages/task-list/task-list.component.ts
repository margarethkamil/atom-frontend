import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../shared/models/user.interface';
import { CreateTaskDto, Task, TaskFilters, TaskState } from '../../../../shared/models/task.interface';
import { TaskService } from '../../services/task.service';
import { TaskEditDialogComponent } from '../../components/task-edit-dialog/task-edit-dialog.component';
import { SeoService } from '../../../../core/services/seo.service';
import { GAnalyticsService } from '../../../../core/services/ganalytics.service';

/**
 * Task List Component
 * 
 * Displays and manages the user's task list, allowing to:
 * - View tasks with filtering options
 * - Create new tasks
 * - Edit existing tasks
 * - Mark tasks as complete/incomplete
 * - Delete tasks
 */
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit, OnDestroy {
  // State observables
  taskState$: Observable<TaskState>;
  filteredTasks$: Observable<Task[]>;
  
  // Form for creating new tasks
  taskForm: FormGroup;
  
  // User info
  currentUser: User | null = null;
  
  // Task filters
  filters: TaskFilters = {};
  
  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private seoService: SeoService,
    private analyticsService: GAnalyticsService
  ) {
    // console.log('TaskListComponent initialized');
    
    // Initialize form with validators
    this.taskForm = this.createTaskForm();
    
    // Get state observables from the service
    this.taskState$ = this.taskService.state$;
    this.filteredTasks$ = this.taskService.filteredTasks$;
  }

  /**
   * Initialize form with validators
   */
  private createTaskForm(): FormGroup {
    return this.fb.group({
      title: ['', [
        Validators.required, 
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.required, 
        Validators.maxLength(500)
      ]],
      priority: ['medium'], // Default to medium priority
      dueDate: [null],     // Optional due date
      tags: ['']           // Optional tags as comma-separated string
    });
  }

  /**
   * Initialize component and subscribe to auth state
   */
  ngOnInit(): void {
    // console.log('TaskListComponent initialized');
    
    // Subscribe to user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        // console.log('Current user updated in component:', user);
        this.currentUser = user;
        
        // Load tasks if user is authenticated
        if (user) {
          // console.log('User is authenticated, loading tasks for:', user.email);
          this.loadTasks();
        } else {
          // console.log('No authenticated user, skipping task loading');
        }
      });
      
    // Subscribe to state changes to debug task display issues
    this.taskState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // console.log('Task state updated:', {
        //   tasksCount: state.tasks.length,
        //   isLoading: state.isLoading,
        //   error: state.error
        // });
      });
    
    // Set SEO metadata
    this.seoService.updateSeoMetadata({
      title: 'Task Manager Dashboard',
      description: 'Manage your tasks efficiently with ATOM Task Manager. Create, edit, and track your tasks in one place.',
      url: window.location.href
    });
    
    // Track page view for tasks page
    this.analyticsService.sendPageView('/tasks', 'Tasks Page');
  }
  
  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    // console.log('TaskListComponent being destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Log out the current user
   */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  /**
   * Load tasks from the server
   */
  loadTasks(): void {
    // console.log('Starting task loading process');
    this.taskService.loadTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          // console.log(`Successfully loaded ${tasks.length} tasks in component`);
          // Verify that tasks were actually loaded
          if (tasks.length === 0) {
            // console.warn('API returned zero tasks - this might be expected for new users');
          } else {
            // console.log('First task sample:', tasks[0]);
          }
        },
        error: (error) => {
          // console.error('Error loading tasks in component:', error);
          this.showSnackBar('Error al cargar las tareas');
        }
      });
  }

  /**
   * Force reload tasks from server
   */
  refreshTasks(): void {
    // console.log('Force refreshing tasks');
    this.showSnackBar('Actualizando tareas...', 'Cerrar', 1000);
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // console.warn('No authenticated user when trying to refresh tasks');
      this.showSnackBar('Error: No se encontró usuario autenticado');
      this.router.navigate(['/login']);
      return;
    }
    
    // With JWT tokens, no need to refresh the token as it's managed by the interceptor
    this.taskService.refreshTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          // console.log(`Successfully refreshed ${tasks.length} tasks`);
          this.showSnackBar('Tareas actualizadas correctamente');
        },
        error: (error) => {
          console.error('Error refreshing tasks:', error);
          this.showSnackBar('Error al actualizar las tareas');
          
          // If we get 401 (Unauthorized), redirect to login
          if (error.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      });
  }

  /**
   * Submit the form to create a new task
   */
  onSubmit(): void {
    if (this.taskForm.invalid) {
      // Mark fields as touched to show validation errors
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Get form values
    const formValues = this.taskForm.value;
    
    // Parse tags if provided
    const tags = formValues.tags 
      ? formValues.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
      : undefined;
    
    // Create task DTO with all fields
    const newTask: CreateTaskDto = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      priority: formValues.priority,
      dueDate: formValues.dueDate,
      tags
    };
    
    this.taskService.createTask(newTask)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.snackBar.open('Tarea creada con éxito', 'Cerrar', { 
            duration: 3000 
          });
          
          // Completely recreate the form to ensure a clean state
          this.taskForm = this.createTaskForm();
        },
        error: (error) => {
          this.snackBar.open('Error al crear la tarea', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  /**
   * Toggle task completion status
   */
  toggleComplete(task: Task): void {
    // console.log('Toggling task completion:', task.id);
    
    this.taskService.toggleTaskCompletion(task.id!, task.completed)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTask) => {
          // console.log('Task updated successfully:', updatedTask);
        },
        error: (error) => {
          // console.error('Error updating task:', error);
          this.showSnackBar('Error al actualizar la tarea');
        }
      });
  }

  /**
   * Open dialog to edit a task
   */
  editTask(task: Task): void {
    // console.log('Opening edit dialog for task:', task);
    
    const dialogRef = this.dialog.open(TaskEditDialogComponent, {
      width: '500px',
      data: { ...task }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (!result) {
          // console.log('Edit dialog closed without saving');
          return;
        }
        
        // console.log('Updating task with new data:', result);
        
        this.taskService.updateTask(task.id!, result)
          .subscribe({
            next: (updatedTask) => {
              // console.log('Task updated successfully:', updatedTask);
              this.snackBar.open('Tarea actualizada con éxito', 'Cerrar', { 
                duration: 3000 
              });
            },
            error: (error) => {
              // console.error('Error updating task:', error);
              this.snackBar.open('Error al actualizar la tarea', 'Cerrar', { 
                duration: 3000 
              });
            }
          });
      });
  }

  /**
   * Delete a task with confirmation
   */
  deleteTask(task: Task): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      // console.log('Deleting task:', task.id);
      
      this.taskService.deleteTask(task.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // console.log('Task deleted successfully');
            this.showSnackBar('Tarea eliminada con éxito');
          },
          error: (error) => {
            // console.error('Error deleting task:', error);
            this.showSnackBar('Error al eliminar la tarea');
          }
        });
    }
  }

  /**
   * Update search term in filters
   */
  updateSearchTerm(term: string): void {
    this.filters = {
      ...this.filters,
      searchTerm: term
    };
    this.taskService.setFilters(this.filters);
  }

  /**
   * Show all tasks (clear completed filter)
   */
  showAllTasks(): void {
    this.filters = {
      ...this.filters,
      completed: undefined
    };
    this.taskService.setFilters(this.filters);
  }

  /**
   * Show only pending tasks
   */
  showPendingTasks(): void {
    this.filters = {
      ...this.filters,
      completed: false
    };
    this.taskService.setFilters(this.filters);
  }

  /**
   * Show only completed tasks
   */
  showCompletedTasks(): void {
    this.filters = {
      ...this.filters,
      completed: true
    };
    this.taskService.setFilters(this.filters);
  }

  /**
   * Check if showing all tasks (completed filter is undefined)
   */
  isShowingAllTasks(): boolean {
    return this.filters.completed === undefined;
  }

  /**
   * Check if showing only pending tasks
   */
  isShowingPendingTasks(): boolean {
    return this.filters.completed === false;
  }

  /**
   * Check if showing only completed tasks
   */
  isShowingCompletedTasks(): boolean {
    return this.filters.completed === true;
  }

  /**
   * Check if any filters are applied
   */
  hasFiltersApplied(): boolean {
    return this.filters.searchTerm !== undefined || this.filters.completed !== undefined;
  }

  /**
   * Display a snackbar message
   */
  private showSnackBar(message: string, action: string = 'Cerrar', duration: number = 3000): void {
    this.snackBar.open(message, action, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | null): string {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    // Format as DD/MM/YYYY
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Check if a date is within 3 days from now
   */
  isDateSoon(date: Date | string): boolean {
    if (!date) return false;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    
    // Reset hours to compare just dates
    now.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = compareDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return true if date is in the past or within 3 days
    return diffDays <= 3 && diffDays >= 0;
  }

  handleImageError(event: any): void {
    console.error('Error loading profile image:', event);
    // Set default image or hide the img element
    event.target.style.display = 'none';
  }
} 