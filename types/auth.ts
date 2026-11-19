export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface AuthResponse {
  success: boolean;
  user: AdminUser;
}
