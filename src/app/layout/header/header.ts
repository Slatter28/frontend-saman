import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { User } from '../../interfaces/auth.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status.component';

@Component({
  selector: 'app-header',
  imports: [
     CommonModule,
    ButtonModule,
    AvatarModule,
    RippleModule,
    ConnectionStatusComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  @Output() sidebarToggle = new EventEmitter<void>();
  
  currentUser: User | null = null;
  isDarkTheme = false;
  isSidebarCollapsed = false;

  constructor(
    private authService: AuthService,

    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check if dark mode preference is saved in localStorage
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDarkTheme = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    // Save preference in localStorage
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  private applyTheme(): void {
    const element = document.querySelector('html');
    if (this.isDarkTheme) {
      element?.classList.add('my-app-dark');
    } else {
      element?.classList.remove('my-app-dark');
    }
  }


  isUserMenuOpen = false;

  toggleUserMenu(event: Event): void {
    console.log('Toggling user menu');
    this.isUserMenuOpen = !this.isUserMenuOpen;
    event.stopPropagation();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.sidebarToggle.emit();
  }

  navigateToProfile(): void {
    this.isUserMenuOpen = false;
    console.log('Navigate to profile');
  }

  navigateToSettings(): void {
    this.isUserMenuOpen = false;
    console.log('Navigate to settings');
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close user menu when clicking outside
    this.isUserMenuOpen = false;
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';

    const names = this.currentUser.nombre.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return this.currentUser.nombre.charAt(0).toUpperCase();
  }

  getBodegaName(): string {
    if (!this.currentUser?.bodegaId) return 'Bodega Fabrica';

    switch (this.currentUser.bodegaId) {
      case 'principal':
        return 'Bodega Fabrica';
      case 'sucursal':
        return 'Bodega Hacienda';
      default:
        return `Bodega ${this.currentUser.bodegaId}`;
    }
  }
}
