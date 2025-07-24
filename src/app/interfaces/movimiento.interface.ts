export interface Movimiento {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  observacion?: string;
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
    unidadMedida: {
      id: number;
      nombre: string;
    };
  };
  bodega: {
    id: number;
    nombre: string;
    ubicacion?: string;
  };
  usuario: {
    id: number;
    nombre: string;
    email: string;
  };
  cliente?: {
    id: number;
    nombre: string;
    tipo: 'cliente' | 'proveedor' | 'ambos';
    email?: string;
    telefono?: string;
  };
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateEntradaDto {
  productoId: number;
  bodegaId: number;
  cantidad: number;
  clienteId?: number;
  observacion?: string;
}

export interface CreateSalidaDto {
  productoId: number;
  bodegaId: number;
  cantidad: number;
  clienteId?: number;
  observacion?: string;
}

export interface UpdateMovimientoDto {
  cantidad?: number;
  clienteId?: number;
  observacion?: string;
}

export interface MovimientosResponse {
  data: Movimiento[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MovimientosFilter {
  page: number;
  limit: number;
  tipo?: 'entrada' | 'salida';
  productoId?: number;
  productoCodigo?: string;
  bodegaId?: number;
  clienteId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: number;
  search?: string;
}

export interface InventarioItem {
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
    unidadMedida: string;
  };
  bodega: {
    id: number;
    nombre: string;
  };
  stock: number;
  ultimaEntrada?: string;
  ultimaSalida?: string;
  valorStock?: number;
}

export interface InventarioResponse {
  inventario: InventarioItem[];
  totalItems: number;
  resumen: {
    totalProductos: number;
    totalBodegas: number;
    valorTotalInventario: number;
    productosSinStock: number;
    productosStockBajo: number;
  };
}

export interface KardexItem {
  id: number;
  fecha: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  saldo: number;
  observacion?: string;
  bodega: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
  cliente?: {
    id: number;
    nombre: string;
    tipo: string;
  };
}

export interface ProductoKardex {
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
    unidadMedida: {
      id: number;
      nombre: string;
    };
  };
  stockActual: number;
  stockTotal: number;
  kardex: KardexItem[];
  estadisticas: {
    totalEntradas: number;
    totalSalidas: number;
    movimientosDelMes: number;
    ultimoMovimiento?: string;
    promedioMensual: number;
  };
}

export interface StockPorBodega {
  bodegaId: number;
  bodegaNombre: string;
  stock: number;
  ubicacion?: string;
}

export interface MovimientoTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'tag' | 'actions';
}

export interface MovimientoFormStep {
  label: string;
  completed: boolean;
  valid: boolean;
}

export interface MovimientoPreview {
  tipo: 'entrada' | 'salida';
  producto: string;
  bodega: string;
  cantidad: number;
  cliente?: string;
  observacion?: string;
  stockAnterior?: number;
  stockNuevo?: number;
}

export interface EstadisticasMovimientos {
  totalMovimientos: number;
  totalEntradas: number;
  totalSalidas: number;
  movimientosHoy: number;
  movimientosSemana: number;
  movimientosMes: number;
  topProductos: Array<{
    producto: string;
    cantidad: number;
  }>;
  actividadPorUsuario: Array<{
    usuario: string;
    movimientos: number;
  }>;
}

export interface AlertaStock {
  tipo: 'sin_stock' | 'stock_bajo' | 'stock_critico';
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
  };
  bodega: {
    id: number;
    nombre: string;
  };
  stockActual: number;
  stockMinimo: number;
  urgencia: 'alta' | 'media' | 'baja';
}

export interface MovimientoExportOptions {
  formato: 'excel' | 'pdf';
  incluirFiltros: boolean;
  columnas: string[];
  fechaDesde?: string;
  fechaHasta?: string;
  filtros?: MovimientosFilter;
}

export type MovimientoAction = 'view' | 'edit' | 'delete' | 'duplicate';

export interface MovimientoPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewInventario: boolean;
  canViewKardex: boolean;
}