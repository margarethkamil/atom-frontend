export interface User {
  id?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  authType?: 'email' | 'google';
  createdAt: Date;
} 