import { Component, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    Sidebar
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements AfterViewInit {
  @ViewChild(Sidebar) sidebar!: Sidebar;
  
  isSidebarCollapsed = false;

  constructor(private authService: AuthService) {}

  ngAfterViewInit(): void {
    // Monitor sidebar collapse state if needed
  }

  onSidebarToggle(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  onHeaderSidebarToggle(): void {
    // Toggle the sidebar from header button
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }

  // Detectar actividad del usuario para mantener la sesión PWA
  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:scroll')
  onUserActivity(): void {
    this.authService.updateUserActivity();
  }
}
