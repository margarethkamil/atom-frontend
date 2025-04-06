import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, take, takeUntil, tap, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CreateTaskDto, Task, TaskFilters, TaskState, UpdateTaskDto } from '../shared/interfaces/task.interface';
import { AuthService } from '../auth/auth.service';

/**
 * Service for managing tasks with backend integration
 * Includes state management, caching, and error handling
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/tasks`;
  
  // Initial state values
  private initialState: TaskState = {
    tasks: [],
    isLoading: false,
    error: null,
    selectedTask: null,
    filters: {}
  };
  
  // Task state with initial values
  private state: TaskState = { ...this.initialState };
  
  // State subject for reactive updates
  private stateSubject = new BehaviorSubject<TaskState>(this.state);
  
  // Public observable of the state
  readonly state$ = this.stateSubject.asObservable();
  
  // Filtered tasks based on state
  readonly filteredTasks$ = this.state$.pipe(
    map(state => this.applyFilters(state.tasks, state.filters))
  );
  
  // Flag to track if tasks were loaded
  private tasksLoaded = false;
  
  // Subject to handle unsubscription
  private destroy$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('TaskService initialized with API URL:', this.apiUrl);
    
    // Reset state when user logs out
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          console.log('User logged out, resetting task state');
          this.resetState();
        }
      });
  }
  
  /**
   * Reset state to initial values when user logs out
   */
  private resetState(): void {
    this.state = { ...this.initialState };
    this.stateSubject.next(this.state);
    this.tasksLoaded = false;
  }
  
  /**
   * Clean up on service destruction
   */
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  /**
   * Get the current state snapshot
   */
  getState(): TaskState {
    return this.stateSubject.getValue();
  }
  
  /**
   * Update the state and notify subscribers
   */
  private setState(newState: Partial<TaskState>): void {
    this.state = { ...this.state, ...newState };
    this.stateSubject.next(this.state);
  }

  /**
   * Load all tasks from the backend
   * If tasks are already loaded, it won't fetch again unless force=true
   */
  loadTasks(force: boolean = false): Observable<Task[]> {
    // If tasks are already loaded and force is false, return current tasks
    if (this.tasksLoaded && !force && this.state.tasks.length > 0) {
      console.log('Using cached tasks:', this.state.tasks.length);
      return of(this.state.tasks);
    }
    
    console.log('Fetching tasks from server, current state:', { 
      isLoading: this.state.isLoading,
      tasksLoaded: this.tasksLoaded,
      taskCount: this.state.tasks.length,
      userAuthenticated: this.authService.isAuthenticated()
    });
    
    this.setState({ isLoading: true, error: null });
    
    // Get auth token status for logging
    const hasToken = !!this.authService.getAuthToken();
    console.log('Auth token available:', hasToken);
    
    // The actual request - AuthInterceptor will add the token automatically
    return this.http.get<any>(this.apiUrl).pipe(
      // Add a timeout to avoid hanging requests
      timeout(10000),
      map(response => {
        console.log('Raw API response type:', typeof response);
        if (response) {
          console.log('API response structure:', Object.keys(response));
          
          if (response.status) {
            console.log('API response status:', response.status);
          }
        }
        
        return this.normalizeTasksResponse(response);
      }),
      tap(tasks => {
        console.log(`Received ${tasks.length} tasks from API`);
        // Debug - log first task if available
        if (tasks.length > 0) {
          console.log('First task sample:', JSON.stringify(tasks[0]));
        }
        
        this.setState({ 
          tasks,
          isLoading: false 
        });
        this.tasksLoaded = true;
      }),
      catchError(error => {
        console.error('Error in loadTasks():', error);
        console.error('Error details:', { 
          status: error.status, 
          message: error.message,
          url: error.url,
          name: error.name
        });
        // Reset the tasksLoaded flag so we can try again
        this.tasksLoaded = false;
        return this.handleError('Failed to load tasks', error);
      }),
      finalize(() => {
        this.setState({ isLoading: false });
      })
    );
  }

  /**
   * Get a specific task by ID
   */
  getTaskById(id: string): Observable<Task> {
    this.setState({ isLoading: true, error: null });
    
    // AuthInterceptor will handle the auth token
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.normalizeTaskResponse(response)),
      tap(task => {
        this.setState({ selectedTask: task, isLoading: false });
      }),
      catchError(error => this.handleError(`Failed to load task ${id}`, error)),
      finalize(() => {
        this.setState({ isLoading: false });
      })
    );
  }

  /**
   * Create a new task
   */
  createTask(taskDto: CreateTaskDto): Observable<Task> {
    this.setState({ isLoading: true, error: null });
    
    // AuthInterceptor will handle the auth token
    return this.http.post<any>(this.apiUrl, taskDto).pipe(
      map(response => this.normalizeTaskResponse(response)),
      tap(newTask => {
        // Update state with the new task
        const updatedTasks = [newTask, ...this.state.tasks];
        this.setState({ 
          tasks: updatedTasks,
          isLoading: false 
        });
      }),
      catchError(error => this.handleError('Failed to create task', error)),
      finalize(() => {
        this.setState({ isLoading: false });
      })
    );
  }

  /**
   * Update an existing task
   */
  updateTask(id: string, changes: UpdateTaskDto): Observable<Task> {
    this.setState({ isLoading: true, error: null });
    
    // AuthInterceptor will handle the auth token
    return this.http.put<any>(`${this.apiUrl}/${id}`, changes).pipe(
      map(response => this.normalizeTaskResponse(response)),
      tap(updatedTask => {
        // Update the task in the state
        const updatedTasks = this.state.tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        );
        this.setState({ 
          tasks: updatedTasks,
          selectedTask: this.state.selectedTask?.id === id ? updatedTask : this.state.selectedTask,
          isLoading: false 
        });
      }),
      catchError(error => this.handleError(`Failed to update task ${id}`, error)),
      finalize(() => {
        this.setState({ isLoading: false });
      })
    );
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<void> {
    this.setState({ isLoading: true, error: null });
    
    // AuthInterceptor will handle the auth token
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove the task from state
        const updatedTasks = this.state.tasks.filter(task => task.id !== id);
        this.setState({ 
          tasks: updatedTasks,
          selectedTask: this.state.selectedTask?.id === id ? null : this.state.selectedTask,
          isLoading: false
        });
      }),
      catchError(error => this.handleError(`Failed to delete task ${id}`, error)),
      finalize(() => {
        this.setState({ isLoading: false });
      })
    );
  }

  /**
   * Toggle task completion status
   */
  toggleTaskCompletion(id: string, completed: boolean): Observable<Task> {
    return this.updateTask(id, { completed: !completed });
  }
  
  /**
   * Set task filters
   */
  setFilters(filters: TaskFilters): void {
    this.setState({ filters });
  }
  
  /**
   * Select a task for viewing/editing
   */
  selectTask(task: Task | null): void {
    this.setState({ selectedTask: task });
  }
  
  /**
   * Force refresh all tasks from the server
   */
  refreshTasks(): Observable<Task[]> {
    return this.loadTasks(true);
  }

  /**
   * Apply filters to tasks array
   * Uses functional approach to improve readability and maintainability
   */
  private applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
    // If no filters are applied, just sort and return
    if (!filters || Object.keys(filters).length === 0) {
      return this.sortTasksByDate([...tasks]);
    }

    // Create a copy of tasks to avoid mutating the original array
    const filteredTasks = [...tasks].filter(task => {
      // If completion filter is active and doesn't match, exclude task
      const completionMatch = filters.completed === undefined || 
                             task.completed === filters.completed;
      
      // If search filter is active, check if task contains the search term
      const searchTerm = filters.searchTerm?.toLowerCase().trim() || '';
      const searchMatch = searchTerm === '' || 
                         task.title.toLowerCase().includes(searchTerm) || 
                         task.description.toLowerCase().includes(searchTerm);
      
      // Task must match all active filters
      return completionMatch && searchMatch;
    });
    
    // Sort the filtered results by date
    return this.sortTasksByDate(filteredTasks);
  }
  
  /**
   * Sort tasks by creation date (newest first)
   */
  sortTasksByDate(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Handle API errors
   */
  private handleError(message: string, error: any): Observable<never> {
    console.error(message, error);
    
    // Network or server errors
    if (error.status === 0) {
      this.setState({ 
        error: 'No se pudo conectar al servidor. Por favor, compruebe su conexión.' 
      });
    } 
    // Authentication errors
    else if (error.status === 401 || error.status === 403) {
      this.setState({
        error: 'Error de autenticación. Por favor, inicie sesión de nuevo.'
      });
    }
    // Other errors
    else {
      this.setState({
        error: error.error?.message || message
      });
    }
    
    return throwError(() => error);
  }
  
  /**
   * Normalize task response from different formats
   */
  private normalizeTaskResponse(response: any): Task {
    if (!response) {
      throw new Error('Invalid task response');
    }
    
    // Handle backend API response format
    if (response.status === 'success' && response.data && response.data.task) {
      console.log('Received standard API success response with task data');
      return this.convertTaskDates(response.data.task);
    } 
    // Handle direct task response from update/create operations
    else if (response.task) {
      console.log('Received response with task property');
      return this.convertTaskDates(response.task);
    } 
    // Handle direct task object (legacy format)
    else if (response.id) {
      console.log('Received direct task object');
      return this.convertTaskDates(response);
    }
    
    console.error('Unknown response format:', response);
    throw new Error('Unknown response format');
  }
  
  /**
   * Normalize tasks array response from different formats
   */
  private normalizeTasksResponse(response: any): Task[] {
    console.log('Normalizing API response');
    
    let tasks: Task[] = [];
    
    // Standard API response format
    if (response && response.status === 'success' && response.data && Array.isArray(response.data.tasks)) {
      console.log('Response matches standard API format with data.tasks array');
      tasks = response.data.tasks;
    }
    // Direct array response (legacy)
    else if (Array.isArray(response)) {
      console.log('Response is a direct array of tasks');
      tasks = response;
    }
    // Other possible response formats for backward compatibility
    else if (response && response.data && Array.isArray(response.data)) {
      console.log('Response has data array property');
      tasks = response.data;
    } 
    else if (response && Array.isArray(response.tasks)) {
      console.log('Response has tasks array property');
      tasks = response.tasks;
    } 
    else {
      console.warn('Unknown response format, cannot extract tasks:', response);
    }
    
    // Convert all date strings to Date objects
    tasks = tasks.map(task => this.convertTaskDates(task));
    
    console.log(`Extracted ${tasks.length} tasks from response`);
    return tasks;
  }

  /**
   * Convert date strings to Date objects
   */
  private convertTaskDates(task: any): Task {
    return {
      ...task,
      createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined
    };
  }
} 