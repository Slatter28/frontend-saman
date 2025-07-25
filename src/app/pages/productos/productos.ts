import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
import { FileUpload } from 'primeng/fileupload';
import { Checkbox } from 'primeng/checkbox';

// Services and Interfaces
import { ProductosService } from '../../services/productos.service';
import { UnidadesMedidaService } from '../../services/unidades-medida.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  Producto, 
  ProductosResponse, 
  CreateProductoDto, 
  UpdateProductoDto,
  ProductosFilter,

  ProductoTableColumn
} from '../../interfaces/producto.interface';
import { ProductoKardex, KardexItem } from '../../interfaces/movimiento.interface';
import { UnidadMedida } from '../../interfaces/unidad-medida.interface';

interface ProductoFormulario {
  id?: number;
  codigo: string;
  descripcion: string;
  unidadMedidaId: number;
}

@Component({
  selector: 'app-productos',
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
    FileUpload,
    Checkbox
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
  providers: [MessageService, ConfirmationService]
})
export class Productos implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data
  productos: Producto[] = [];
  unidadesMedida: UnidadMedida[] = [];
  
  // State
  loading = false;
  totalRecords = 0;
  
  // Table
  first = 0;
  rows = 10;
  
  // Dialogs
  displayDialog = false;
  displayImportDialog = false;
  displayKardexDialog = false;
  
  // Forms
  productoForm!: FormGroup;
  isEditing = false;
  selectedProducto: Producto | null = null;
  
  // Kardex
  kardexData: ProductoKardex | null = null;
  loadingKardex = false;
  
  // Filters
  filtros: ProductosFilter = {
    page: 1,
    limit: 10
  };
  
  // Search
  globalFilter = '';
  
  // Table columns
  columns: ProductoTableColumn[] = [
    { field: 'codigo', header: 'Código', sortable: true, filterable: true, width: '150px' },
    { field: 'descripcion', header: 'Descripción', sortable: true, filterable: true },
    { field: 'unidadMedida.nombre', header: 'Unidad de Medida', sortable: true, width: '200px' },
    { field: 'creadoEn', header: 'Fecha Creación', sortable: true, width: '180px' }
  ];

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private unidadesMedidaService: UnidadesMedidaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUnidadesMedida();
    this.loadProductos();
    this.setupGlobalFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.productoForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', [Validators.required, Validators.maxLength(200)]],
      unidadMedidaId: [null, [Validators.required]]
    });
  }

  private setupGlobalFilterListener(): void {
    // Crear un Subject para el debounce del filtro
    this.searchSubject = new Subject<string>();
    
    this.searchSubject.pipe(
      debounceTime(300), // Esperar 300ms después del último input
      distinctUntilChanged(), // Solo procesar si el valor cambió
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.globalFilter = searchTerm;
      this.performSearch();
    });
  }

  loadProductos(): void {
    this.loading = true;
    
    this.productosService.getProductos(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductosResponse) => {
          this.productos = response.data;
          this.totalRecords = response.meta.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.showError('Error al cargar productos', error);
        }
      });
  }

  private loadUnidadesMedida(): void {
    // Usar el endpoint existente sin paginación para obtener todas las unidades
    this.unidadesMedidaService.getUnidadesMedida({ limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unidadesMedida = response.data;
        },
        error: (error) => {
          this.showError('Error al cargar unidades de medida', error);
        }
      });
  }

  // Table Events
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.filtros.page = Math.floor(event.first / event.rows) + 1;
    this.filtros.limit = event.rows;
    this.loadProductos();
  }

  onGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  private performSearch(): void {
    const filterValue = this.globalFilter.trim();
    
    // Limpiar todos los filtros de búsqueda
    this.filtros.descripcion = undefined;
    this.filtros.codigo = undefined;
    
    // Si hay texto de búsqueda, hacer búsquedas secuenciales
    if (filterValue) {
      this.searchWithBothFields(filterValue);
      return;
    }
    
    // Si no hay filtro, cargar todos los productos
    this.filtros.page = 1;
    this.first = 0;
    this.loadProductos();
  }

  private searchWithBothFields(searchTerm: string): void {
    // Primero intentar buscar por código
    this.filtros.codigo = searchTerm;
    this.filtros.descripcion = undefined;
    this.filtros.page = 1;
    this.first = 0;
    
    // Ejecutar búsqueda por código
    this.loading = true;
    this.productosService.getProductos(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductosResponse) => {
          if (response.data.length > 0) {
            // Encontró resultados por código
            this.productos = response.data;
            this.totalRecords = response.meta.total;
            this.loading = false;
            this.cdr.detectChanges();
          } else {
            // No encontró por código, buscar por descripción
            this.searchByDescription(searchTerm);
          }
        },
        error: (error) => {
          // Si falla la búsqueda por código, intentar por descripción
          this.searchByDescription(searchTerm);
        }
      });
  }

  private searchByDescription(searchTerm: string): void {
    this.filtros.codigo = undefined;
    this.filtros.descripcion = searchTerm;
    
    this.productosService.getProductos(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProductosResponse) => {
          this.productos = response.data;
          this.totalRecords = response.meta.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.showError('Error al buscar productos', error);
        }
      });
  }

  // CRUD Operations
  openNew(): void {
    this.selectedProducto = null;
    this.isEditing = false;
    this.productoForm.reset();
    this.displayDialog = true;
  }

  editProducto(producto: Producto): void {
    this.selectedProducto = producto;
    this.isEditing = true;
    
    this.productoForm.patchValue({
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      unidadMedidaId: producto.unidadMedida.id
    });
    
    this.displayDialog = true;
  }

  deleteProducto(producto: Producto): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el producto "${producto.descripcion}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.productosService.deleteProducto(producto.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showSuccess('Producto eliminado correctamente');
              this.loadProductos();
            },
            error: (error) => {
              this.showError('Error al eliminar producto', error);
            }
          });
      }
    });
  }

  viewKardex(producto: Producto): void {
    this.selectedProducto = producto;
    this.loadingKardex = true;
    this.displayKardexDialog = true;
    this.kardexData = null;

    // Usar MovimientosService en lugar de ProductosService
    this.productosService.getKardexProducto(producto.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kardex) => {
          console.log('Kardex data received:', kardex); // Debug
          this.kardexData = kardex;
          this.loadingKardex = false;
        },
        error: (error) => {
          console.error('Error loading kardex:', error); // Debug
          this.loadingKardex = false;
          this.showError('Error al cargar kardex del producto', error);
          // No cerrar el diálogo para mostrar el error
        }
      });
  }

  saveProducto(): void {
    if (this.productoForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.productoForm.value;
    const productoData: CreateProductoDto = {
      codigo: formValue.codigo.trim(),
      descripcion: formValue.descripcion.trim(),
      unidadMedidaId: formValue.unidadMedidaId
    };

    const operation = this.isEditing
      ? this.productosService.updateProducto(this.selectedProducto!.id, productoData)
      : this.productosService.createProducto(productoData);

    operation.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const message = this.isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente';
          this.showSuccess(message);
          this.displayDialog = false;
          this.loadProductos();
        },
        error: (error) => {
          this.showError('Error al guardar producto', error);
        }
      });
  }

  // Form Helpers
  private markFormGroupTouched(): void {
    Object.keys(this.productoForm.controls).forEach(key => {
      this.productoForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productoForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.productoForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['maxlength']) return `${fieldName} excede la longitud máxima`;
    }
    return '';
  }

  // Export/Import Operations
  exportExcel(): void {
    this.productosService.exportarExcel(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showSuccess('Archivo Excel descargado correctamente');
        },
        error: (error) => {
          this.showError('Error al exportar Excel', error);
        }
      });
  }

  exportPDF(): void {
    this.productosService.exportarPDF(this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `productos_${new Date().toISOString().split('T')[0]}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.showSuccess('Archivo PDF descargado correctamente');
        },
        error: (error) => {
          this.showError('Error al exportar PDF', error);
        }
      });
  }

  downloadTemplate(): void {
    this.productosService.descargarPlantilla()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'plantilla_productos.xlsx';
          link.click();
          window.URL.revokeObjectURL(url);
          this.showSuccess('Plantilla descargada correctamente');
        },
        error: (error) => {
          this.showError('Error al descargar plantilla', error);
        }
      });
  }

  onUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      this.productosService.importarExcel(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.showSuccess(`Importación completada: ${result.procesados} productos procesados`);
            if (result.errores.length > 0) {
              console.warn('Errores en importación:', result.errores);
            }
            this.displayImportDialog = false;
            this.loadProductos();
          },
          error: (error) => {
            this.showError('Error al importar archivo', error);
          }
        });
    }
  }

  // Utility Methods
  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message,
      life: 3000
    });
  }

  private showError(summary: string, error?: any): void {
    let detail = 'Ha ocurrido un error inesperado';
    
    if (error?.error?.message) {
      detail = error.error.message;
    } else if (typeof error === 'string') {
      detail = error;
    }

    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  private showInfo(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: message,
      life: 3000
    });
  }

  // Getters for template
  get dialogTitle(): string {
    return this.isEditing ? 'Editar Producto' : 'Nuevo Producto';
  }

  get saveButtonLabel(): string {
    return this.isEditing ? 'Actualizar' : 'Crear';
  }

  get saveButtonIcon(): string {
    return this.isEditing ? 'pi pi-check' : 'pi pi-plus';
  }

  // Kardex helpers
  getMovimientoIcon(tipo: 'entrada' | 'salida'): string {
    return tipo === 'entrada' ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  getMovimientoSeverity(tipo: 'entrada' | 'salida'): 'success' | 'danger' {
    return tipo === 'entrada' ? 'success' : 'danger';
  }

  getMovimientoLabel(tipo: 'entrada' | 'salida'): string {
    return tipo === 'entrada' ? 'Entrada' : 'Salida';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  closeKardexDialog(): void {
    this.displayKardexDialog = false;
    this.kardexData = null;
    this.selectedProducto = null;
    this.loadingKardex = false;
  }
}