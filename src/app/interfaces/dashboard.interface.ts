export interface DashboardEstadisticas {
  totalProductos: number;
  totalClientes: number;
  totalBodegas: number;
  movimientosHoy: number;
  movimientosEsteMes: number;
}

export interface MovimientoReciente {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  producto: {
    id: number;
    descripcion: string;
  };
  bodega: {
    id: number;
    nombre: string;
  };
  cliente: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
}

export interface ProductoStockBajo {
  id: number;
  codigo: string;
  descripcion: string;
  stock_actual: number;
  precio_promedio: number;
}

export interface DashboardGraficos {
  movimientosPorDia: Array<{
    fecha: string;
    cantidad: number;
  }>;
  entradasVsSalidas: Array<{
    fecha: string;
    tipo: 'entrada' | 'salida';
    cantidad: number;
  }>;
  topProductosMasMovidos: Array<{
    descripcion: string;
    total_movimientos: number;
    cantidad_total: number;
  }>;
  movimientosPorBodega: Array<{
    nombre: string;
    total_movimientos: number;
    entradas: number;
    salidas: number;
  }>;
}

export interface InventarioResumen {
  bodega_id: number;
  bodega_nombre: string;
  total_productos: number;
  stock_total: number;
  productos: Array<{
    producto_id: number;
    producto_descripcion: string;
    stock_actual: number;
  }>;
}