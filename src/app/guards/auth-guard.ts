import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of, delay } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  
  console.log('🛡️ AuthGuard: Verificando acceso', {
    hasToken: !!token,
    isAuthenticated: authService.isAuthenticated(),
    isOnline: navigator.onLine
  });
  
  if (!token) {
    console.log('🛡️ AuthGuard: No hay token, redirigiendo a login');
    router.navigate(['/login']);
    return false;
  }

  // Verificar si ya estamos autenticados (sesión válida)
  if (authService.isAuthenticated()) {
    console.log('🛡️ AuthGuard: Usuario ya autenticado, permitiendo acceso');
    // Actualizar actividad del usuario
    authService.updateUserActivity();
    return true;
  }

  // Solo validar token con servidor si hay conexión
  if (!navigator.onLine) {
    console.log('🛡️ AuthGuard: Sin conexión, verificando sesión PWA offline');
    
    // Verificar sesión PWA offline
    const sessionInfo = authService.getPWASessionInfo();
    if (sessionInfo.isValidSession) {
      console.log('🛡️ AuthGuard: Sesión PWA válida offline, permitiendo acceso');
      return true;
    } else {
      console.log('🛡️ AuthGuard: Sesión PWA inválida offline, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    }
  }

  // Si hay conexión, validar con servidor
  console.log('🛡️ AuthGuard: Hay conexión, validando token con servidor');
  return authService.validateToken().pipe(
    map(response => {
      if (response.valid) {
        console.log('🛡️ AuthGuard: Token válido, permitiendo acceso');
        return true;
      } else {
        console.log('🛡️ AuthGuard: Token inválido, redirigiendo a login');
        router.navigate(['/login']);
        return false;
      }
    }),
    catchError(error => {
      console.log('🛡️ AuthGuard: Error validando token', error);
      
      // En caso de error, verificar sesión PWA como fallback
      const sessionInfo = authService.getPWASessionInfo();
      if (sessionInfo.isValidSession) {
        console.log('🛡️ AuthGuard: Error del servidor pero sesión PWA válida, permitiendo acceso');
        return of(true);
      } else {
        console.log('🛡️ AuthGuard: Error del servidor y sesión PWA inválida, redirigiendo a login');
        router.navigate(['/login']);
        return of(false);
      }
    })
  );
};
