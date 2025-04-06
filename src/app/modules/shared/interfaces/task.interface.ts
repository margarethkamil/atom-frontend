/**
 * Represents a Task entity in the system
 */
export interface Task {
  id?: string;          // Unique ID assigned by backend
  title: string;        // Task title
  description: string;  // Detailed description
  completed: boolean;   // Completion status
  priority?: string;    // Priority level (low, medium, high)
  dueDate?: Date;       // Due date for the task
  createdAt: Date;      // Creation date
  updatedAt?: Date;     // Last update date
  userId: string;       // Owner user ID
  tags?: string[];      // Tags for categorizing the task
}

/**
 * Data Transfer Object for creating a new task
 */
export interface CreateTaskDto {
  title: string;
  description: string;
  priority?: string;
  dueDate?: Date | string;
  completed?: boolean;
  tags?: string[];
}

/**
 * Data Transfer Object for updating an existing task
 */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  dueDate?: Date | string;
  tags?: string[];
}

/**
 * Interface for task filtering options
 */
export interface TaskFilters {
  completed?: boolean;
  searchTerm?: string;
}

/**
 * Interface for task state management
 */
export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  selectedTask: Task | null;
  filters: TaskFilters;
} 