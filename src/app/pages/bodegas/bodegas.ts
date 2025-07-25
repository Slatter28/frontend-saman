import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

// PrimeNG Components
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Badge } from 'primeng/badge';
import { Tag } from 'primeng/tag';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Toolbar } from 'primeng/toolbar';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { Tooltip } from 'primeng/tooltip';
import { Textarea } from 'primeng/textarea';
import { Menu } from 'primeng/menu';
import { Divider } from 'primeng/divider';

// Services and Interfaces
import { BodegasService } from '../../services/bodegas.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  Bodega, 
  BodegaCreate, 
  BodegaUpdate, 
  BodegasResponse, 
  BodegaFilters,
  BodegaInventario,
  ProductoInventario
} from '../../interfaces/bodega.interface';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-bodegas',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Card,
    TableModule,
    Button,
    InputText,
    Select,
    Dialog,
    ToastModule,
    ConfirmDialog,
    Badge,
    Tag,
    ProgressSpinner,
    Toolbar,
    InputIcon,
    IconField,
    Tooltip,
    Textarea,
    Menu,
    Divider
  ],
  templateUrl: './bodegas.html',
  styleUrl: './bodegas.scss',
  providers: [MessageService, ConfirmationService]
})
export class Bodegas implements OnInit {
  // Data Properties
  bodegas: Bodega[] = [];
  selectedBodega: Bodega | null = null;
  inventarioData: BodegaInventario | null = null;
  
  // UI State
  loading = false;
  loadingInventario = false;
  totalRecords = 0;
  rows = 10;
  first = 0;
  
  // Dialog State
  displayDialog = false;
  displayInventario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  bodegaSeleccionada: Bodega | null = null;
  
  // Forms
  bodegaForm!: FormGroup;
  filtroForm!: FormGroup;
  
  // Menu items
  menuItems: MenuItem[] = [];
  
  // Stats
  statsData = {
    totalBodegas: 0,
    bodegasConInventario: 0,
    bodegasVacias: 0
  };

  constructor(
    private bodegasService: BodegasService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
    this.initializeMenuItems();
  }

  ngOnInit(): void {
    this.loadBodegas();
    this.loadStats();
  }

  private initializeForms(): void {
    // Formulario principal
    this.bodegaForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9\-_.]+$/)
      ]],
      ubicacion: ['', [Validators.maxLength(255)]]
    });

    // Formulario de filtros
    this.filtroForm = this.fb.group({
      nombre: [''],
      ubicacion: ['']
    });
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        label: 'Acciones',
        items: [
          {
            label: 'Ver Inventario General',
            icon: 'pi pi-box',
            command: () => this.showInventarioGeneral()
          },
          {
            label: 'Exportar Bodegas',
            icon: 'pi pi-download',
            command: () => this.exportData()
          },
          {
            label: 'Estadísticas',
            icon: 'pi pi-chart-bar',
            command: () => this.showStats()
          }
        ]
      }
    ];
  }

  // Data Loading Methods
  loadBodegas(): void {
    this.loading = true;
    const filters: BodegaFilters = {
      page: Math.floor(this.first / this.rows) + 1,
      limit: this.rows,
      nombre: this.filtroForm.get('nombre')?.value || undefined,
      ubicacion: this.filtroForm.get('ubicacion')?.value || undefined
    };

    this.bodegasService.getBodegas(filters).subscribe({
      next: (response: BodegasResponse) => {
        this.bodegas = response.data;
        this.totalRecords = response.meta.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las bodegas'
        });
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    // Simulación de estadísticas - podrías agregar un endpoint específico
    this.statsData = {
      totalBodegas: this.bodegas.length,
      bodegasConInventario: Math.floor(this.bodegas.length * 0.7),
      bodegasVacias: Math.floor(this.bodegas.length * 0.3)
    };
  }

  // CRUD Operations
  openNew(): void {
    this.modoFormulario = 'crear';
    this.bodegaSeleccionada = null;
    this.bodegaForm.reset();
    this.displayDialog = true;
  }

  editBodega(bodega: Bodega): void {
    this.modoFormulario = 'editar';
    this.bodegaSeleccionada = bodega;
    this.bodegaForm.patchValue({
      nombre: bodega.nombre,
      ubicacion: bodega.ubicacion
    });
    this.displayDialog = true;
  }

  saveBodega(): void {
    if (this.bodegaForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formData: BodegaCreate = this.bodegaForm.value;
    
    if (this.modoFormulario === 'crear') {
      this.createBodega(formData);
    } else {
      this.updateBodega(formData);
    }
  }

  private createBodega(data: BodegaCreate): void {
    this.bodegasService.createBodega(data).subscribe({
      next: (bodega) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Bodega creada correctamente'
        });
        this.displayDialog = false;
        this.loadBodegas();
        this.loadStats();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al crear la bodega'
        });
      }
    });
  }

  private updateBodega(data: BodegaUpdate): void {
    if (!this.bodegaSeleccionada) return;

    this.bodegasService.updateBodega(this.bodegaSeleccionada.id, data).subscribe({
      next: (bodega) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Bodega actualizada correctamente'
        });
        this.displayDialog = false;
        this.loadBodegas();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al actualizar la bodega'
        });
      }
    });
  }

  deleteBodega(bodega: Bodega): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar la bodega "${bodega.nombre}"?<br><br><small>Nota: No se puede eliminar si tiene movimientos asociados.</small>`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.bodegasService.deleteBodega(bodega.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Bodega eliminada correctamente'
            });
            this.loadBodegas();
            this.loadStats();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Error al eliminar la bodega'
            });
          }
        });
      }
    });
  }

  // Inventory Methods
  verInventario(bodega: Bodega): void {
    this.selectedBodega = bodega;
    this.loadingInventario = true;
    this.displayInventario = true;

    this.bodegasService.getBodegaInventario(bodega.id).subscribe({
      next: (inventario: BodegaInventario) => {
        this.inventarioData = inventario;
        this.loadingInventario = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar el inventario de la bodega'
        });
        this.loadingInventario = false;
        this.displayInventario = false;
      }
    });
  }

  // Filter and Pagination Methods
  onFilter(): void {
    this.first = 0;
    this.loadBodegas();
  }

  clearFilters(): void {
    this.filtroForm.reset();
    this.first = 0;
    this.loadBodegas();
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadBodegas();
  }

  // Utility Methods
  private markFormGroupTouched(): void {
    Object.keys(this.bodegaForm.controls).forEach(key => {
      this.bodegaForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.bodegaForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} es requerido`;
      if (control.errors['maxlength']) return `${fieldName} es muy largo`;
      if (control.errors['pattern']) return `${fieldName} contiene caracteres inválidos`;
    }
    return '';
  }

  getSeverityForStock(stock: number): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    if (stock === 0) return 'danger';
    if (stock < 5) return 'warn';
    if (stock < 20) return 'info';
    return 'success';
  }

  // Menu Actions
  showInventarioGeneral(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Función en desarrollo',
      detail: 'El inventario general estará disponible próximamente'
    });
  }

  exportData(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Función en desarrollo',
      detail: 'La exportación de datos estará disponible próximamente'
    });
  }

  showStats(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Estadísticas',
      detail: `Total: ${this.statsData.totalBodegas} | Con inventario: ${this.statsData.bodegasConInventario} | Vacías: ${this.statsData.bodegasVacias}`
    });
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.bodegaForm.reset();
    this.bodegaSeleccionada = null;
  }

  hideInventarioDialog(): void {
    this.displayInventario = false;
    this.inventarioData = null;
    this.selectedBodega = null;
  }

  // Helper methods for template
  getTotalInventarioValue(): number {
    if (!this.inventarioData?.inventario) return 0;
    return this.inventarioData.inventario.reduce((total, item) => total + item.stock, 0);
  }

  getUbicacionDisplay(ubicacion: string): string {
    return ubicacion || 'Sin ubicación especificada';
  }

  formatMovimientosCount(movimientos?: any[]): string {
    const count = movimientos?.length || 0;
    return count === 0 ? 'Sin movimientos' : `${count} movimiento${count > 1 ? 's' : ''}`;
  }
}