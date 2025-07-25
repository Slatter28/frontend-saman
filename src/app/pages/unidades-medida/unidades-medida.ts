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
import { UnidadesMedidaService } from '../../services/unidades-medida.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  UnidadMedida, 
  UnidadesMedidaResponse, 
  CreateUnidadMedidaDto, 
  UpdateUnidadMedidaDto,
  UnidadPredefinida,
  VistaUnidades,
  ModoFormulario,
  UnidadesMedidaStats
} from '../../interfaces/unidad-medida.interface';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-unidades-medida',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Card,
    TableModule,
    Button,
    InputText,
    Dialog,
    ToastModule,
    ConfirmDialog,
    Badge,
    InputIcon,
    IconField,
    Tooltip,
    Textarea,
    Menu,
    Divider
  ],
  templateUrl: './unidades-medida.html',
  styleUrl: './unidades-medida.scss',
  providers: [MessageService, ConfirmationService]
})
export class UnidadesMedida implements OnInit {
  // Data Properties
  unidades: UnidadMedida[] = [];
  unidadesPredefinidas: UnidadPredefinida[] = [];
  stats: UnidadesMedidaStats | null = null;
  
  // UI State
  loading = false;
  totalRecords = 0;
  rows = 10;
  first = 0;
  
  // Dialog State
  displayDialog = false;
  displayPredefinidas = false;
  modoFormulario: ModoFormulario = 'crear';
  unidadSeleccionada: UnidadMedida | null = null;
  
  // Forms
  unidadForm!: FormGroup;
  filtroForm!: FormGroup;
  
  // Menu items
  menuItems: MenuItem[] = [];
  
  // Options
  categoriaOptions = [
    { label: 'Todas', value: '' },
    { label: 'General', value: 'general' },
    { label: 'Peso', value: 'peso' },
    { label: 'Volumen', value: 'volumen' },
    { label: 'Longitud', value: 'longitud' },
    { label: 'Empaque', value: 'empaque' }
  ];

  constructor(
    private unidadesMedidaService: UnidadesMedidaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
    this.initializeMenuItems();
  }

  ngOnInit(): void {
    this.loadUnidades();
    // this.loadStats();
    this.loadUnidadesPredefinidas();
  }

  private initializeForms(): void {
    // Formulario principal
    this.unidadForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9]+[a-zA-Z0-9\-_.]*$/)
      ]],
      descripcion: ['', [Validators.maxLength(255)]]
    });

    // Formulario de filtros
    this.filtroForm = this.fb.group({
      nombre: [''],
      categoria: ['']
    });
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        label: 'Acciones',
        items: [
          {
            label: 'Unidades Predefinidas',
            icon: 'pi pi-list',
            command: () => this.showPredefinidas()
          },
          {
            label: 'Exportar Datos',
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
  loadUnidades(): void {
    this.loading = true;
    const filters = {
      page: Math.floor(this.first / this.rows) + 1,
      limit: this.rows,
      nombre: this.filtroForm.get('nombre')?.value || undefined
    };

    this.unidadesMedidaService.getUnidadesMedida(filters).subscribe({
      next: (response: UnidadesMedidaResponse) => {
        this.unidades = response.data;
        this.totalRecords = response.meta.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las unidades de medida'
        });
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.unidadesMedidaService.getUnidadesMedidaStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  loadUnidadesPredefinidas(): void {
    this.unidadesPredefinidas = this.unidadesMedidaService.getUnidadesPredefinidas();
  }

  // CRUD Operations
  openNew(): void {
    this.modoFormulario = 'crear';
    this.unidadSeleccionada = null;
    this.unidadForm.reset();
    this.displayDialog = true;
  }

  editUnidad(unidad: UnidadMedida): void {
    this.modoFormulario = 'editar';
    this.unidadSeleccionada = unidad;
    this.unidadForm.patchValue({
      nombre: unidad.nombre,
      descripcion: unidad.descripcion
    });
    this.displayDialog = true;
  }

  saveUnidad(): void {
    if (this.unidadForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formData: CreateUnidadMedidaDto = this.unidadForm.value;
    
    if (this.modoFormulario === 'crear') {
      this.createUnidad(formData);
    } else {
      this.updateUnidad(formData);
    }
  }

  private createUnidad(data: CreateUnidadMedidaDto): void {
    this.unidadesMedidaService.createUnidadMedida(data).subscribe({
      next: (unidad) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Unidad de medida creada correctamente'
        });
        this.displayDialog = false;
        this.loadUnidades();
        this.loadStats();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al crear la unidad de medida'
        });
      }
    });
  }

  private updateUnidad(data: UpdateUnidadMedidaDto): void {
    if (!this.unidadSeleccionada) return;

    this.unidadesMedidaService.updateUnidadMedida(this.unidadSeleccionada.id, data).subscribe({
      next: (unidad) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Unidad de medida actualizada correctamente'
        });
        this.displayDialog = false;
        this.loadUnidades();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al actualizar la unidad de medida'
        });
      }
    });
  }

  deleteUnidad(unidad: UnidadMedida): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar la unidad "${unidad.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.unidadesMedidaService.deleteUnidadMedida(unidad.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Unidad de medida eliminada correctamente'
            });
            this.loadUnidades();
            this.loadStats();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Error al eliminar la unidad de medida'
            });
          }
        });
      }
    });
  }

  // Predefined Units Methods
  showPredefinidas(): void {
    this.displayPredefinidas = true;
  }

  createFromPredefinida(predefinida: UnidadPredefinida): void {
    const data: CreateUnidadMedidaDto = {
      nombre: predefinida.nombre,
      descripcion: predefinida.descripcion
    };

    this.unidadesMedidaService.createUnidadMedida(data).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Unidad "${predefinida.nombre}" creada desde predefinida`
        });
        this.loadUnidades();
        this.loadStats();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || `Error al crear la unidad "${predefinida.nombre}"`
        });
      }
    });
  }

  createMultiplePredefinidas(categoria: string): void {
    const unidadesCategoria = this.unidadesPredefinidas
      .filter(u => u.categoria === categoria)
      .map(u => ({ nombre: u.nombre, descripcion: u.descripcion }));

    this.unidadesMedidaService.createUnidadesPredefinidas(unidadesCategoria).subscribe({
      next: (unidades) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `${unidades.length} unidades de ${categoria} creadas correctamente`
        });
        this.loadUnidades();
        this.loadStats();
        this.displayPredefinidas = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al crear unidades de ${categoria}`
        });
      }
    });
  }

  // Filter and Pagination Methods
  onFilter(): void {
    this.first = 0;
    this.loadUnidades();
  }

  clearFilters(): void {
    this.filtroForm.reset();
    this.first = 0;
    this.loadUnidades();
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.loadUnidades();
  }

  // Utility Methods
  private markFormGroupTouched(): void {
    Object.keys(this.unidadForm.controls).forEach(key => {
      this.unidadForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.unidadForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} es requerido`;
      if (control.errors['maxlength']) return `${fieldName} es muy largo`;
      if (control.errors['pattern']) return `${fieldName} tiene formato inválido`;
    }
    return '';
  }

  getPredefinadasByCategoria(categoria: string): UnidadPredefinida[] {
    return this.unidadesPredefinidas.filter(u => u.categoria === categoria);
  }

  getSeverityForCategoria(categoria: string): "primary" | "secondary" | "success" | "info" | "help" | "danger" {
    const severities: Record<string, "primary" | "secondary" | "success" | "info" | "help" | "danger"> = {
      'general': 'secondary',
      'peso': 'success',
      'volumen': 'info',
      'longitud': 'help',
      'empaque': 'danger'
    };
    return severities[categoria] || 'secondary';
  }

  exportData(): void {
    // Implementation for data export
    this.messageService.add({
      severity: 'info',
      summary: 'Función en desarrollo',
      detail: 'La exportación de datos estará disponible próximamente'
    });
  }

  showStats(): void {
    if (this.stats) {
      this.messageService.add({
        severity: 'info',
        summary: 'Estadísticas',
        detail: `Total: ${this.stats.totalUnidades} | Sin uso: ${this.stats.unidadesSinUso}`
      });
    }
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.unidadForm.reset();
    this.unidadSeleccionada = null;
  }
}