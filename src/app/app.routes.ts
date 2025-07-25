import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { UnidadesMedida } from './pages/unidades-medida/unidades-medida';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent, canActivate: [loginGuard] },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
       { path: 'dashboard', component: Dashboard },
       { path: 'unidades-medida', component: UnidadesMedida },
         {
    path: 'bodegas',
    loadComponent: () => import('./pages/bodegas/bodegas').then(m => m.Bodegas),
    title: 'Bodegas - SAMAN'
  },
  {
    path: 'clientes',
    loadComponent: () => import('./pages/clientes/clientes').then(m => m.Clientes),
    title: 'Clientes - SAMAN'
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos').then(m => m.Productos),
    title: 'Productos - SAMAN'
  },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
