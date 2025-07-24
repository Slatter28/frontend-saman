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
    ]
  },
  { path: '**', redirectTo: '/login' }
];
