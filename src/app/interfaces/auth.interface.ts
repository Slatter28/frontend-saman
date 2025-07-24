export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  creadoEn: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  usuario: User;
  access_token: string;
}

export interface ValidateResponse {
  valid: boolean;
  user: User;
}