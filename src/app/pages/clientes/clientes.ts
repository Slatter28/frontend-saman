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
import { ClientesService } from '../../services/clientes.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  Cliente, 
  ClienteDetalle,
  CreateClienteDto, 
  ClientesResponse, 
  ClienteFilters,
  ClienteStats,
  TipoCliente,
  TipoClienteLabels,
  TipoClienteIcons,
  ClienteMovimientosResponse
} from '../../interfaces/cliente.interface';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-clientes',
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
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  providers: [MessageService, ConfirmationService]
})
export class Clientes implements OnInit {
  // Data Properties
  clientes: Cliente[] = [];
  selectedCliente: Cliente | null = null;
  movimientosData: ClienteMovimientosResponse | null = null;
  stats: ClienteStats | null = null;
  
  // UI State
  loading = false;
  loadingMovimientos = false;
  totalRecords = 0;
  rows = 10;
  first = 0;
  
  // Dialog State
  displayDialog = false;
  displayMovimientos = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  clienteSeleccionado: Cliente | null = null;
  
  // Forms
  clienteForm!: FormGroup;
  filtroForm!: FormGroup;
  
  // Menu items
  menuItems: MenuItem[] = [];
  
  // Options
  tipoOptions = [
    { label: 'Todos', value: null },
    { label: 'Cliente', value: 'cliente' },
    { label: 'Proveedor', value: 'proveedor' },
    { label: 'Cliente y Proveedor', value: 'ambos' }
  ];

  tipoFormOptions = [
    { label: 'Cliente', value: 'cliente' },
    { label: 'Proveedor', value: 'proveedor' },
    { label: 'Cliente y Proveedor', value: 'ambos' }
  ];

  constructor(
    private clientesService: ClientesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
    this.initializeMenuItems();
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadStats();
  }

  private initializeForms(): void {
    // Formulario principal
    this.clienteForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9\-_.&()]+$/)
      ]],
      telefono: ['', [
        Validators.pattern(/^[\+]?[(]?[\d\s\-\(\)\.]{7,20}$/)
      ]],
      email: ['', [
        Validators.email,
        Validators.maxLength(100)
      ]],
      direccion: ['', [Validators.maxLength(255)]],
      tipo: ['cliente', [Validators.required]]
    });

    // Formulario de filtros
    this.filtroForm = this.fb.group({
      nombre: [''],
      email: [''],
      tipo: [null]
    });
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        label: 'Acciones',
        items: [
          {
            label: 'Exportar Clientes',
            icon: 'pi pi-download',
            command: () => this.exportData()
          },
          {
            label: 'Importar Clientes',
            icon: 'pi pi-upload',
            command: () => this.importData()
          },
          {
            label: 'Estadísticas Detalladas',
            icon: 'pi pi-chart-bar',
            command: () => this.showDetailedStats()
          }
        ]
      }
    ];
  }

  // Data Loading Methods
  loadClientes(): void {
    this.loading = true;
    const filters: ClienteFilters = {
      page: Math.floor(this.first / this.rows) + 1,
      limit: this.rows,
      nombre: this.filtroForm.get('nombre')?.value || undefined,
      email: this.filtroForm.get('email')?.value || undefined,
      tipo: this.filtroForm.get('tipo')?.value || undefined
    };

    this.clientesService.getClientes(filters).subscribe({
      next: (response: ClientesResponse) => {
        this.clientes = response.data;
        this.totalRecords = response.meta.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los clientes'
        });
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.clientesService.getClienteStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  // CRUD Operations
  openNew(): void {
    this.modoFormulario = 'crear';
    this.clienteSeleccionado = null;
    this.clienteForm.reset();
    this.clienteForm.patchValue({ tipo: 'cliente' }); // Default value
    this.displayDialog = true;
  }

  editCliente(cliente: Cliente): void {
    this.modoFormulario = 'editar';
    this.clienteSeleccionado = cliente;
    this.clienteForm.patchValue({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      tipo: cliente.tipo
    });
    this.displayDialog = true;
  }

  saveCliente(): void {
    if (this.clienteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formData: CreateClienteDto = this.clienteForm.value;
    
    if (this.modoFormulario === 'crear') {
      this.createCliente(formData);
    } else {
      // Para actualizar, usamos Partial<CreateClienteDto> ya que el ID se pasa por separado
      this.updateCliente(formData);
    }
  }

  private createCliente(data: CreateClienteDto): void {
    this.clientesService.createCliente(data).subscribe({
      next: (cliente) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente creado correctamente'
        });
        this.displayDialog = false;
        this.loadClientes();
        this.loadStats();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al crear el cliente'
        });
      }
    });
  }

  private updateCliente(data: Partial<CreateClienteDto>): void {
    if (!this.clienteSeleccionado) return;

    this.clientesService.updateCliente(this.clienteSeleccionado.id, data).subscribe({
      next: (cliente) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente actualizado correctamente'
        });
        this.displayDialog = false;
        this.loadClientes();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al actualizar el cliente'
        });
      }
    });
  }

  deleteCliente(cliente: Cliente): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el cliente "${cliente.nombre}"?<br><br><small>Nota: No se puede eliminar si tiene movimientos asociados.</small>`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.clientesService.deleteCliente(cliente.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Cliente eliminado correctamente'
            });
            this.loadClientes();
            this.loadStats();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Error al eliminar el cliente'
            });
          }
        });
      }
    });
  }

  // Movements Methods
  verMovimientos(cliente: Cliente): void {
    this.selectedCliente = cliente;
    this.loadingMovimientos = true;
    this.displayMovimientos = true;

    this.clientesService.getClienteMovimientos(cliente.id).subscribe({
      next: (movimientos: ClienteMovimientosResponse) => {
        this.movimientosData = movimientos;
        this.loadingMovimientos = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los movimientos del cliente'
        });
        this.loadingMovimientos = false;
        this.displayMovimientos = false;
      }
    });
  }

  // Filter and Pagination Methods
  onFilter(): void {
    this.first = 0;
    this.loadClientes();
  }

  clearFilters(): void {
    this.filtroForm.reset();
    this.filtroForm.patchValue({ tipo: null });
    this.first = 0;
    this.loadClientes();
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadClientes();
  }

  // Utility Methods
  private markFormGroupTouched(): void {
    Object.keys(this.clienteForm.controls).forEach(key => {
      this.clienteForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.clienteForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} es requerido`;
      if (control.errors['maxlength']) return `${fieldName} es muy largo`;
      if (control.errors['pattern']) {
        if (fieldName === 'telefono') return 'Formato de teléfono inválido';
        if (fieldName === 'nombre') return 'Nombre contiene caracteres inválidos';
        return `${fieldName} tiene formato inválido`;
      }
      if (control.errors['email']) return 'Email tiene formato inválido';
    }
    return '';
  }

  getSeverityForTipo(tipo: TipoCliente): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    const severities: Record<TipoCliente, "secondary" | "success" | "info" | "warn" | "danger" | "contrast"> = {
      'cliente': 'info',
      'proveedor': 'success',
      'ambos': 'secondary'
    };
    return severities[tipo] || 'secondary';
  }

  getSeverityForMovimiento(tipo: 'entrada' | 'salida'): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    return tipo === 'entrada' ? 'success' : 'info';
  }

  getIconForTipo(tipo: TipoCliente): string {
    return TipoClienteIcons[tipo] || 'pi-user';
  }

  getLabelForTipo(tipo: TipoCliente): string {
    return TipoClienteLabels[tipo] || tipo;
  }

  // Menu Actions
  exportData(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Función en desarrollo',
      detail: 'La exportación de datos estará disponible próximamente'
    });
  }

  importData(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Función en desarrollo',
      detail: 'La importación de datos estará disponible próximamente'
    });
  }

  showDetailedStats(): void {
    if (this.stats) {
      this.messageService.add({
        severity: 'info',
        summary: 'Estadísticas Detalladas',
        detail: `Total: ${this.stats.total} | Clientes: ${this.stats.totalClientes} | Proveedores: ${this.stats.totalProveedores} | Ambos: ${this.stats.totalAmbos}`,
        life: 8000
      });
    }
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.clienteForm.reset();
    this.clienteSeleccionado = null;
  }

  hideMovimientosDialog(): void {
    this.displayMovimientos = false;
    this.movimientosData = null;
    this.selectedCliente = null;
  }

  // Helper methods for template
  getContactInfo(cliente: Cliente): string {
    const info: string[] = [];
    if (cliente.telefono) info.push(cliente.telefono);
    if (cliente.email) info.push(cliente.email);
    return info.length > 0 ? info.join(' • ') : 'Sin información de contacto';
  }

  getDireccionDisplay(direccion: string): string {
    return direccion || 'Sin dirección especificada';
  }

  getTotalMovimientosValue(): number {
    if (!this.movimientosData?.movimientos) return 0;
    return this.movimientosData.movimientos.reduce((total, mov) => total + mov.precio_total, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}