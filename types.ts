export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be hashed
  bio: string;
  createdAt: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: Omit<User, 'id' | 'createdAt' | 'role'>) => Promise<void>;
  logout: () => void;
  users: User[]; // Exposed to visualize the "Database"
}
