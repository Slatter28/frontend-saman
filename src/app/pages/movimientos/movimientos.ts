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
import { SplitButtonModule } from 'primeng/splitbutton';

// Services
import { MovimientosService } from '../../services/movimientos.service';
import { ProductosService } from '../../services/productos.service';
import { BodegasService } from '../../services/bodegas.service';
import { ClientesService } from '../../services/clientes.service';
import { AuthService } from '../../services/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';

// Interfaces
import { 
  Movimiento, 
  MovimientosFilter,
  CreateEntradaDto,
  CreateSalidaDto,
  UpdateMovimientoDto,
  MovimientoTableColumn,
  MovimientosResponse
} from '../../interfaces/movimiento.interface';
import { Producto, ProductosResponse } from '../../interfaces/producto.interface';
import { Bodega, BodegasResponse } from '../../interfaces/bodega.interface';
import { Cliente, ClientesResponse } from '../../interfaces/cliente.interface';
import { DatePicker } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';

// Interfaces para división de productos
interface ProductoDestino {
  productoId: number | null;
  cantidad: number | null;
}

interface DivisionProductoDto {
  productoOrigenId: number;
  bodegaId: number;
  cantidadTotal: number;
  productosDestino: {
    productoId: number;
    cantidad: number;
  }[];
  observacion?: string;
}

interface ProductoIngrediente {
  productoId: number | null;
  cantidad: number | null;
}

interface CombinacionProductoDto {
  bodegaId: number;
  productoComboId: number;
  ingredientes: {
    productoId: number;
    cantidad: number;
  }[];
  observacion?: string;
}
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
    TextareaModule,
    TabsModule,
    SplitButtonModule
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
  displayEditDialog = false;
  displayDivisionDialog = false;
  displayCombinacionDialog = false;
  
  // Forms
  entradaForm!: FormGroup;
  salidaForm!: FormGroup;
  filtroForm!: FormGroup;
  editForm!: FormGroup;
  divisionForm!: FormGroup;
  combinacionForm!: FormGroup;
  
  // Selected items
  selectedMovimiento: Movimiento | null = null;
  movimientoToEdit: Movimiento | null = null;
  
  // División de productos
  productosDestino: ProductoDestino[] = [];
  
  // Combinación de productos
  ingredientes: ProductoIngrediente[] = [];
  
  // User permissions
  isAdmin = false;
  currentUser: any = null;
  
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
  
  // Menu Items para SplitButtons
  movimientosMenuItems = [
    {
      label: 'Nueva Entrada',
      icon: 'pi pi-arrow-up',
      command: () => this.openEntradaDialog()
    },
    {
      label: 'Nueva Salida',
      icon: 'pi pi-arrow-down',
      command: () => this.openSalidaDialog()
    }
  ];
  
  operacionesMenuItems = [
    {
      label: 'División de Producto',
      icon: 'pi pi-share-alt',
      command: () => this.openDivisionDialog()
    },
    {
      label: 'Combinación de Productos',
      icon: 'pi pi-sitemap',
      command: () => this.openCombinacionDialog()
    }
  ];
  
  reportesMenuItems = [
    {
      label: 'Excel Movimientos',
      icon: 'pi pi-file-excel',
      command: () => this.exportExcel()
    },
    {
      label: 'Excel Inventario',
      icon: 'pi pi-chart-bar',
      command: () => this.exportInventarioExcel()
    }
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
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
    this.initializeUserPermissions();
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
      precio: [null, [Validators.min(0)]],
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
    
    // Formulario de división
    this.divisionForm = this.fb.group({
      productoOrigenId: [null, Validators.required],
      bodegaId: [null, Validators.required],
      cantidadTotal: [null, [Validators.required, Validators.min(0.01)]],
      observacion: ['']
    });
    
    // Formulario de combinación
    this.combinacionForm = this.fb.group({
      productoComboId: [null, Validators.required],
      bodegaId: [null, Validators.required],
      observacion: ['']
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
    console.log('Iniciando descarga de Excel...');
    const filtrosActuales = { ...this.filtros };
    console.log('Filtros actuales:', filtrosActuales);
    
    this.movimientosService.downloadExcel(filtrosActuales)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          console.log('Blob recibido:', blob);
          this.downloadFile(blob, this.generateFileName());
          this.showSuccess('Excel descargado correctamente');
        },
        error: (error) => {
          console.error('Error en exportExcel:', error);
          
          let errorMessage = 'Error al descargar Excel';
          if (error.status === 400) {
            errorMessage = 'Solicitud inválida - Verifique los filtros aplicados';
          } else if (error.status === 401) {
            errorMessage = 'No autorizado - Verifique su sesión';
          } else if (error.status === 403) {
            errorMessage = 'Acceso denegado - Sin permisos suficientes';
          } else if (error.status === 500) {
            errorMessage = 'Error del servidor al generar Excel';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error al descargar Excel',
            detail: `${errorMessage} (${error.status})`,
            life: 5000
          });
        }
      });
  }

  private downloadFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private generateFileName(): string {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    return `movimientos_${dateStr}.xlsx`;
  }

  private generateInventarioFileName(): string {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    return `inventario_${dateStr}.xlsx`;
  }

  exportInventarioExcel(): void {
    console.log('Iniciando descarga de inventario Excel...');
    
    // Usar bodegaId si hay filtro de bodega aplicado en inventario
    const bodegaId = this.inventarioFiltros?.bodegaId;
    
    this.movimientosService.downloadInventarioExcel(bodegaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          console.log('Inventario Excel blob recibido:', blob);
          this.downloadFile(blob, this.generateInventarioFileName());
          this.showSuccess('Reporte de inventario descargado correctamente');
        },
        error: (error) => {
          console.error('Error en exportInventarioExcel:', error);
          
          let errorMessage = 'Error al descargar reporte de inventario';
          if (error.status === 400) {
            errorMessage = 'Solicitud inválida - Verifique los parámetros';
          } else if (error.status === 401) {
            errorMessage = 'No autorizado - Verifique su sesión';
          } else if (error.status === 403) {
            errorMessage = 'Acceso denegado - Sin permisos suficientes';
          } else if (error.status === 500) {
            errorMessage = 'Error del servidor al generar reporte';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error al descargar inventario',
            detail: `${errorMessage} (${error.status})`,
            life: 5000
          });
        }
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

// ============= NUEVOS MÉTODOS PARA EDICIÓN Y CONTROL DE ROLES =============

/**
 * Inicializar permisos del usuario
 */
initializeUserPermissions(): void {
  this.currentUser = this.authService.getCurrentUser();
  this.isAdmin = this.currentUser?.rol === 'admin';
  console.log('Permisos de usuario:', { isAdmin: this.isAdmin, rol: this.currentUser?.rol });
}

/**
 * Verificar si el usuario puede editar movimientos
 */
canEditMovimientos(): boolean {
  return this.isAdmin;
}

/**
 * Verificar si el usuario puede eliminar movimientos
 */
canDeleteMovimientos(): boolean {
  return this.isAdmin;
}

/**
 * Abrir dialog de edición de movimiento
 */
openEditDialog(movimiento: Movimiento): void {
  if (!this.canEditMovimientos()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Acceso denegado',
      detail: 'Solo los administradores pueden editar movimientos'
    });
    return;
  }

  this.movimientoToEdit = { ...movimiento };
  this.initializeEditForm();
  this.displayEditDialog = true;
}

/**
 * Inicializar formulario de edición
 */
initializeEditForm(): void {
  if (!this.movimientoToEdit) return;

  this.editForm = this.fb.group({
    cantidad: [this.movimientoToEdit.cantidad, [Validators.required, Validators.min(0.01)]],
    observacion: [this.movimientoToEdit.observacion || '']
  });
}

/**
 * Guardar cambios del movimiento editado
 */
saveEditedMovimiento(): void {
  if (!this.editForm.valid || !this.movimientoToEdit) return;

  const updateData: UpdateMovimientoDto = {
    cantidad: this.editForm.value.cantidad,
    observacion: this.editForm.value.observacion
  };

  this.movimientosService.updateMovimiento(this.movimientoToEdit.id, updateData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedMovimiento) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Movimiento actualizado',
          detail: 'Los cambios se han guardado correctamente'
        });
        
        this.displayEditDialog = false;
        this.loadMovimientos(); // Recargar la tabla
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al actualizar el movimiento'
        });
      }
    });
}

/**
 * Cancelar edición
 */
cancelEdit(): void {
  this.displayEditDialog = false;
  this.movimientoToEdit = null;
  this.editForm?.reset();
}

/**
 * Confirmar eliminación de movimiento
 */
confirmDelete(movimiento: Movimiento): void {
  if (!this.canDeleteMovimientos()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Acceso denegado',
      detail: 'Solo los administradores pueden eliminar movimientos'
    });
    return;
  }

  this.confirmationService.confirm({
    message: `¿Está seguro de eliminar este movimiento?<br><br>
              <strong>Tipo:</strong> ${movimiento.tipo}<br>
              <strong>Producto:</strong> ${movimiento.producto.descripcion}<br>
              <strong>Cantidad:</strong> ${movimiento.cantidad}<br><br>
              <em>Esta acción no se puede deshacer y afectará el inventario.</em>`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptButtonStyleClass: 'p-button-danger',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: () => {
      this.deleteMovimiento(movimiento);
    }
  });
}

/**
 * Eliminar movimiento
 */
deleteMovimiento(movimiento: Movimiento): void {
  this.movimientosService.deleteMovimiento(movimiento.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Movimiento eliminado',
          detail: 'El movimiento ha sido eliminado correctamente'
        });
        
        this.loadMovimientos(); // Recargar la tabla
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Error al eliminar el movimiento'
        });
      }
    });
}

/**
 * Verificar si el formulario de edición es válido
 */
isEditFormValid(): boolean {
  return this.editForm?.valid || false;
}

/**
 * Verificar si un campo del formulario de edición tiene errores
 */
isEditFieldInvalid(fieldName: string): boolean {
  const field = this.editForm?.get(fieldName);
  return !!(field && field.invalid && field.touched);
}

/**
 * Obtener mensaje de error para un campo del formulario de edición
 */
getEditFieldError(fieldName: string): string {
  const field = this.editForm?.get(fieldName);
  if (field?.errors?.['required']) {
    return `${fieldName === 'cantidad' ? 'Cantidad' : 'Campo'} es requerido`;
  }
  if (field?.errors?.['min']) {
    return 'La cantidad debe ser mayor a 0';
  }
  return '';
}

// ============= MÉTODOS PARA DIVISIÓN DE PRODUCTOS =============

/**
 * Abrir dialog de división de productos
 */
openDivisionDialog(): void {
  this.divisionForm.reset();
  this.productosDestino = [];
  this.displayDivisionDialog = true;
}

/**
 * Cancelar división
 */
cancelDivision(): void {
  this.displayDivisionDialog = false;
  this.divisionForm.reset();
  this.productosDestino = [];
}

/**
 * Agregar producto destino
 */
agregarProductoDestino(): void {
  this.productosDestino.push({
    productoId: null,
    cantidad: null
  });
}

/**
 * Remover producto destino
 */
removerProductoDestino(index: number): void {
  this.productosDestino.splice(index, 1);
}

/**
 * TrackBy function para *ngFor
 */
trackByIndex(index: number, item: any): number {
  return index;
}

/**
 * Cambio en producto origen
 */
onProductoOrigenChange(): void {
  // Aquí podrías cargar información adicional del producto si es necesario
  console.log('Producto origen seleccionado:', this.divisionForm.get('productoOrigenId')?.value);
}

/**
 * Cambio en cantidad total
 */
onCantidadTotalChange(): void {
  // Podrías implementar lógica para distribuir automáticamente la cantidad
  console.log('Cantidad total cambiada:', this.divisionForm.get('cantidadTotal')?.value);
}

/**
 * Cambio en cantidad de producto destino
 */
onCantidadDestinoChange(): void {
  // Recalcular resumen
  console.log('Cantidad destino cambiada, recalculando resumen...');
}

/**
 * Obtener cantidad total del formulario
 */
getCantidadTotal(): number {
  return this.divisionForm.get('cantidadTotal')?.value || 0;
}

/**
 * Obtener cantidad total asignada a productos destino
 */
getCantidadAsignada(): number {
  return this.productosDestino.reduce((total, item) => {
    return total + (item.cantidad || 0);
  }, 0);
}

/**
 * Obtener diferencia entre cantidad total y asignada
 */
getDiferencia(): number {
  return this.getCantidadTotal() - this.getCantidadAsignada();
}

/**
 * Obtener clase CSS para mostrar diferencia
 */
getDiferenciaClass(): string {
  const diferencia = this.getDiferencia();
  if (diferencia === 0) return 'diferencia-ok';
  if (diferencia > 0) return 'diferencia-falta';
  return 'diferencia-sobra';
}

/**
 * Verificar si el formulario de división es válido
 */
isDivisionFormValid(): boolean {
  // Validar formulario básico
  if (!this.divisionForm.valid) return false;
  
  // Validar que haya al menos un producto destino
  if (this.productosDestino.length === 0) return false;
  
  // Validar que todos los productos destino tengan datos válidos
  for (let item of this.productosDestino) {
    if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
      return false;
    }
  }
  
  // Validar que las cantidades coincidan exactamente
  if (this.getDiferencia() !== 0) return false;
  
  return true;
}

/**
 * Verificar si un campo del formulario de división tiene errores
 */
isDivisionFieldInvalid(fieldName: string): boolean {
  const field = this.divisionForm?.get(fieldName);
  return !!(field && field.invalid && field.touched);
}

/**
 * Procesar división de producto
 */
procesarDivision(): void {
  if (!this.isDivisionFormValid()) {
    this.markFormGroupTouched(this.divisionForm);
    this.messageService.add({
      severity: 'warn',
      summary: 'Formulario incompleto',
      detail: 'Por favor complete todos los campos requeridos y verifique que las cantidades coincidan'
    });
    return;
  }

  // Preparar datos para enviar
  const divisionData: DivisionProductoDto = {
    productoOrigenId: this.divisionForm.get('productoOrigenId')?.value,
    bodegaId: this.divisionForm.get('bodegaId')?.value,
    cantidadTotal: this.divisionForm.get('cantidadTotal')?.value,
    productosDestino: this.productosDestino.map(item => ({
      productoId: item.productoId!,
      cantidad: item.cantidad!
    })),
    observacion: this.divisionForm.get('observacion')?.value || undefined
  };

  console.log('=== DATOS DE DIVISIÓN A ENVIAR AL BACKEND ===');
  console.log(JSON.stringify(divisionData, null, 2));
  console.log('=== FIN DE DATOS DE DIVISIÓN ===');

  // Aquí llamarías al servicio para enviar al backend
  // Por ahora solo mostramos los datos en consola como solicitaste
  this.messageService.add({
    severity: 'info',
    summary: 'División preparada',
    detail: 'Los datos de la división se muestran en la consola del navegador. Implementar endpoint en backend.'
  });

  // Opcional: cerrar el diálogo después de mostrar los datos
  // this.displayDivisionDialog = false;
  // this.divisionForm.reset();
  // this.productosDestino = [];
}

// Método auxiliar Math.abs para el template
Math = Math;

// ============= MÉTODOS PARA COMBINACIÓN DE PRODUCTOS =============

/**
 * Abrir dialog de combinación de productos
 */
openCombinacionDialog(): void {
  this.combinacionForm.reset();
  this.ingredientes = [];
  this.displayCombinacionDialog = true;
}

/**
 * Cancelar combinación
 */
cancelCombinacion(): void {
  this.displayCombinacionDialog = false;
  this.combinacionForm.reset();
  this.ingredientes = [];
}

/**
 * Agregar ingrediente
 */
agregarIngrediente(): void {
  this.ingredientes.push({
    productoId: null,
    cantidad: null
  });
}

/**
 * Remover ingrediente
 */
removerIngrediente(index: number): void {
  this.ingredientes.splice(index, 1);
}

/**
 * Cambio en ingrediente (recalcular totales)
 */
onIngredienteChange(): void {
  // Recalcular totales automáticamente
  console.log('Ingrediente cambiado, total:', this.getCantidadTotalIngredientes());
}

/**
 * Obtener cantidad total de todos los ingredientes
 */
getCantidadTotalIngredientes(): number {
  return this.ingredientes.reduce((total, item) => {
    return total + (item.cantidad || 0);
  }, 0);
}

/**
 * Obtener nombre de producto por ID
 */
getProductoNombre(productoId: number | null): string {
  if (!productoId) return '';
  const producto = this.productos.find(p => p.id === productoId);
  return producto ? `${producto.codigo} - ${producto.descripcion}` : 'Producto no encontrado';
}

/**
 * Verificar si el formulario de combinación es válido
 */
isCombinacionFormValid(): boolean {
  // Validar formulario básico
  if (!this.combinacionForm.valid) return false;
  
  // Validar que haya al menos un ingrediente
  if (this.ingredientes.length === 0) return false;
  
  // Validar que todos los ingredientes tengan datos válidos
  for (let item of this.ingredientes) {
    if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
      return false;
    }
  }
  
  // Validar que la cantidad total sea mayor a 0
  if (this.getCantidadTotalIngredientes() <= 0) return false;
  
  return true;
}

/**
 * Verificar si un campo del formulario de combinación tiene errores
 */
isCombinacionFieldInvalid(fieldName: string): boolean {
  const field = this.combinacionForm?.get(fieldName);
  return !!(field && field.invalid && field.touched);
}

/**
 * Procesar combinación de productos
 */
procesarCombinacion(): void {
  if (!this.isCombinacionFormValid()) {
    this.markFormGroupTouched(this.combinacionForm);
    this.messageService.add({
      severity: 'warn',
      summary: 'Formulario incompleto',
      detail: 'Por favor complete todos los campos requeridos y agregue al menos un ingrediente válido'
    });
    return;
  }

  // Preparar datos para enviar
  const combinacionData: CombinacionProductoDto = {
    bodegaId: this.combinacionForm.get('bodegaId')?.value,
    productoComboId: this.combinacionForm.get('productoComboId')?.value,
    ingredientes: this.ingredientes.map(item => ({
      productoId: item.productoId!,
      cantidad: item.cantidad!
    })),
    observacion: this.combinacionForm.get('observacion')?.value || undefined
  };

  console.log('=== DATOS DE COMBINACIÓN A ENVIAR AL BACKEND ===');
  console.log(JSON.stringify(combinacionData, null, 2));
  console.log(`=== RESUMEN DE MOVIMIENTOS ===`);
  console.log(`EGRESOS (Salidas):`);
  this.ingredientes.forEach((item, index) => {
    const producto = this.getProductoNombre(item.productoId);
    console.log(`  ${index + 1}. ${producto}: -${item.cantidad} unidades`);
  });
  console.log(`INGRESO (Entrada):`);
  console.log(`  Combo ${this.getProductoNombre(combinacionData.productoComboId)}: +${this.getCantidadTotalIngredientes()} unidades`);
  console.log('=== FIN DE DATOS DE COMBINACIÓN ===');

  // Aquí llamarías al servicio para enviar al backend
  // Por ahora solo mostramos los datos en consola como solicitaste
  this.messageService.add({
    severity: 'info',
    summary: 'Combinación preparada',
    detail: 'Los datos de la combinación se muestran en la consola del navegador. Implementar endpoint en backend.'
  });

  // Opcional: cerrar el diálogo después de mostrar los datos
  // this.displayCombinacionDialog = false;
  // this.combinacionForm.reset();
  // this.ingredientes = [];
}

  }