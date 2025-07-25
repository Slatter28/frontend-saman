import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { TextareaModule } from 'primeng/textarea';

// Services
import { MovimientosService } from '../../services/movimientos.service';
import { ProductosService } from '../../services/productos.service';
import { BodegasService } from '../../services/bodegas.service';
import { ClientesService } from '../../services/clientes.service';
import { MessageService, ConfirmationService } from 'primeng/api';

// Interfaces
import { 
  Movimiento, 
  MovimientosFilter,
  CreateEntradaDto,
  CreateSalidaDto,
  MovimientoTableColumn,
  MovimientosResponse
} from '../../interfaces/movimiento.interface';
import { Producto, ProductosResponse } from '../../interfaces/producto.interface';
import { Bodega, BodegasResponse } from '../../interfaces/bodega.interface';
import { Cliente, ClientesResponse } from '../../interfaces/cliente.interface';
import { DatePicker } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePicker,
    InputNumberModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    CardModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
CheckboxModule,
FormsModule,
    MenuModule,
    TextareaModule,TabsModule
  ],
  templateUrl: './movimientos.html',
  styleUrls: ['./movimientos.scss'],
  providers: [MessageService, ConfirmationService]
})
export class Movimientos implements OnInit, OnDestroy {
  
  // Data
  movimientos: Movimiento[] = [];
  productos: Producto[] = [];
  bodegas: Bodega[] = [];
  clientes: Cliente[] = [];
  
  // Table State
  totalRecords = 0;
  loading = false;
  first = 0;
  rows = 10;
  
  // Dialogs
  displayEntradaDialog = false;
  displaySalidaDialog = false;
  displayInventarioDialog = false;
  
  // Forms
  entradaForm!: FormGroup;
  salidaForm!: FormGroup;
  filtroForm!: FormGroup;
  
  // Selected items
  selectedMovimiento: Movimiento | null = null;
  
  // Filters
  filtros: MovimientosFilter = {
    page: 1,
    limit: 10
  };
  
  // Columns
  columns: MovimientoTableColumn[] = [
    { field: 'fecha', header: 'Fecha', sortable: true, width: '150px' },
    { field: 'tipo', header: 'Tipo', sortable: true, width: '100px' },
    { field: 'producto.codigo', header: 'Código', sortable: false, width: '120px' },
    { field: 'producto.descripcion', header: 'Producto', sortable: false, width: '200px' },
    { field: 'bodega.nombre', header: 'Bodega', sortable: false, width: '150px' },
    { field: 'cantidad', header: 'Cantidad', sortable: true, width: '100px' },
    { field: 'cliente.nombre', header: 'Cliente', sortable: false, width: '150px' },
    { field: 'usuario.nombre', header: 'Usuario', sortable: false, width: '120px' }
  ];
  
  // Options
  tipoOptions = [
    { label: 'Todos', value: null },
    { label: 'Entrada', value: 'entrada' },
    { label: 'Salida', value: 'salida' }
  ];
  
  private destroy$ = new Subject<void>();

  inventarioData: any = null;
  loadingInventario = false;
inventarioFiltros = {
    bodegaId: undefined,
    stockMinimo: undefined,
    soloStockBajo: false
};

  
  constructor(
    private movimientosService: MovimientosService,
    private productosService: ProductosService,
    private bodegasService: BodegasService,
    private clientesService: ClientesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.loadMovimientos();
    this.loadCombos();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForms(): void {
    // Formulario de entrada
    this.entradaForm = this.fb.group({
      productoId: [null, Validators.required],
      bodegaId: [null, Validators.required],
      cantidad: [null, [Validators.required, Validators.min(0.01)]],
      clienteId: [null],
      observacion: ['']
    });
    
    // Formulario de salida
    this.salidaForm = this.fb.group({
      productoId: [null, Validators.required],
      bodegaId: [null, Validators.required],
      cantidad: [null, [Validators.required, Validators.min(0.01)]],
      clienteId: [null],
      observacion: ['']
    });
    
    // Formulario de filtros
    this.filtroForm = this.fb.group({
      tipo: [null],
      productoId: [null],
      bodegaId: [null],
      clienteId: [null],
      fechaDesde: [null],
      fechaHasta: [null]
    });
  }
  
  // Data Loading
  loadMovimientos(): void {
    this.loading = true;
    
    this.movimientosService.getMovimientos(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MovimientosResponse) => {
          this.movimientos = response.data;
          this.totalRecords = response.meta.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.showError('Error al cargar movimientos', error);
        }
      });
  }
  
  loadCombos(): void {
    // Cargar productos para selects (usar límite alto para obtener todos)
    this.productosService.getProductos({ page: 1, limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductosResponse) => this.productos = response.data,
        error: (error) => console.error('Error cargando productos:', error)
      });
    
    // Cargar bodegas
    this.bodegasService.getBodegas({ page: 1, limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: BodegasResponse) => this.bodegas = response.data,
        error: (error) => console.error('Error cargando bodegas:', error)
      });
    
    // Cargar clientes  
    this.clientesService.getClientes({ page: 1, limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ClientesResponse) => this.clientes = response.data,
        error: (error) => console.error('Error cargando clientes:', error)
      });
  }
  
  // Dialog Management
  openEntradaDialog(): void {
    this.entradaForm.reset();
    this.displayEntradaDialog = true;
  }
  
  openSalidaDialog(): void {
    this.salidaForm.reset();
    this.displaySalidaDialog = true;
  }
  
  // CRUD Operations
  saveEntrada(): void {
    if (this.entradaForm.invalid) {
      this.markFormGroupTouched(this.entradaForm);
      return;
    }
    
    const entradaData: CreateEntradaDto = this.entradaForm.value;
    
    this.movimientosService.createEntrada(entradaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Entrada registrada correctamente');
          this.displayEntradaDialog = false;
          this.loadMovimientos();
        },
        error: (error) => {
          this.showError('Error al registrar entrada', error);
        }
      });
  }
  
  saveSalida(): void {
    if (this.salidaForm.invalid) {
      this.markFormGroupTouched(this.salidaForm);
      return;
    }
    
    const salidaData: CreateSalidaDto = this.salidaForm.value;
    
    this.movimientosService.createSalida(salidaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Salida registrada correctamente');
          this.displaySalidaDialog = false;
          this.loadMovimientos();
        },
        error: (error) => {
          this.showError('Error al registrar salida', error);
        }
      });
  }
  
  // Filters
  onFilter(): void {
    const formValue = this.filtroForm.value;
    this.filtros = { 
      ...this.filtros, 
      ...formValue, 
      page: 1,
      // Convertir fechas a strings si existen
      fechaDesde: formValue.fechaDesde ? this.formatDateForAPI(formValue.fechaDesde) : undefined,
      fechaHasta: formValue.fechaHasta ? this.formatDateForAPI(formValue.fechaHasta) : undefined
    };
    this.first = 0;
    this.loadMovimientos();
  }
  
  clearFilters(): void {
    this.filtroForm.reset();
    this.filtros = { page: 1, limit: this.rows };
    this.first = 0;
    this.loadMovimientos();
  }
  
  // Pagination
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.filtros.page = Math.floor(event.first / event.rows) + 1;
    this.filtros.limit = event.rows;
    this.loadMovimientos();
  }
  
  // Utilities
  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }
  
  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message
    });
  }
  
  private showError(message: string, error?: any): void {
    console.error(error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
  
  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  
  getSeverityForTipo(tipo: 'entrada' | 'salida'): "secondary" | "success" | "info" | "warn" | "danger" | "contrast" {
    return tipo === 'entrada' ? 'success' : 'info';
  }
  
  formatDate(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Additional utility methods
  getProductoDisplayText(producto: Producto): string {
    return `${producto.codigo} - ${producto.descripcion}`;
  }
  
  exportExcel(): void {
    // TODO: Implementar exportación
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad',
      detail: 'Exportación Excel próximamente disponible'
    });
  }
  
  exportPDF(): void {
    // TODO: Implementar exportación
    this.messageService.add({
      severity: 'info',
      summary: 'Funcionalidad',
      detail: 'Exportación PDF próximamente disponible'
    });
  }



  openInventarioDialog(): void {
  this.displayInventarioDialog = true;
  this.loadInventarioGeneral();
}

// Cargar inventario general
loadInventarioGeneral(): void {
  this.loadingInventario = true;
  
  this.movimientosService.getInventario(this.inventarioFiltros)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.inventarioData = response;
        this.loadingInventario = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loadingInventario = false;
        this.showError('Error al cargar inventario', error);
      }
    });
}

// Filtrar inventario
onFiltrarInventario(): void {
  this.loadInventarioGeneral();
}

// Limpiar filtros de inventario
clearInventarioFilters(): void {
  this.inventarioFiltros = {
    bodegaId: undefined,
    stockMinimo: undefined,
    soloStockBajo: false
  };
  this.loadInventarioGeneral();
}

// Cerrar diálogo
closeInventarioDialog(): void {
  this.displayInventarioDialog = false;
  this.inventarioData = null;
}

// Formatear número de forma segura para p-tag
formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toFixed(2);
}

// Formatear fecha de forma segura
formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) {
    return 'Sin fecha';
  }
  
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
}

// Obtener valor seguro para mostrar (evita null/undefined)
getSafeValue(value: any, defaultValue: string = '0'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value.toString();
}

// Método mejorado para el severity del stock
getStockSeverity(stock: number | null | undefined): "success" | "warning" | "danger" {
  const stockValue = stock || 0;
  if (stockValue > 20) return 'success';
  if (stockValue > 10) return 'warning';
  return 'danger';
}
  }