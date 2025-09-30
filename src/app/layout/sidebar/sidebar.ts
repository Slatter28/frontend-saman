import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  menuItems: MenuItem[] = [];
  isCollapsed = false;
  
  @Output() sidebarToggle = new EventEmitter<boolean>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.menuItems = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        route: '/dashboard'
      },
      {
        label: 'Bodegas',
        icon: 'pi pi-warehouse',
        route: '/bodegas'
      },
      {
        label: 'Productos',
        icon: 'pi pi-box',
        route: '/productos'
      },
      {
        label: 'Clientes',
        icon: 'pi pi-users',
        route: '/clientes'
      },
      {
        label: 'Unidades de Medidas',
        icon: 'pi pi-bookmark',
        route: '/unidades-medida'
      },
      {
        label: 'Movimientos',
        icon: 'pi pi-arrow-right-arrow-left',
        route: '/movimientos'
      },
      // {
      //   label: 'Reportes',
      //   icon: 'pi pi-chart-bar',
      //   route: '/reportes'
      // },
      // {
      //   label: 'Configuración',
      //   icon: 'pi pi-cog',
      //   route: '/configuracion'
      // }
    ];
  }

  navigateTo(route: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
