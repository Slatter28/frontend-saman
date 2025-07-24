import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

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
}
