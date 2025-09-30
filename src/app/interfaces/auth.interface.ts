export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  creadoEn: string;
  bodegaId?: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
  bodegaId?: string;
}

export interface BodegaOption {
  id: string;
  nombre: string;
}

export interface LoginResponse {
  usuario: User;
  access_token: string;
}

export interface ValidateResponse {
  valid: boolean;
  user: User | null;
}