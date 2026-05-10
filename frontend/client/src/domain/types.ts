export type AppSection =
  | 'dashboard'
  | 'inventory'
  | 'products'
  | 'categories'
  | 'brands'
  | 'subcategories'
  | 'users'
  | 'sales'
  | 'sales-history'
  | 'deliveries'
  | 'my-deliveries'
  | 'deliveries-history';

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  active: boolean;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    position: string | null;
  } | null;
};

export type SessionData = {
  token: string;
  user: SessionUser;
};

export type Overview = {
  totalProducts: number;
  totalStock: number;
  inventoryValue: number;
  totalSalesToday: number;
  revenueToday: number;
  itemsSoldToday: number;
};

export type MetricPoint = {
  date: string;
  label: string;
  value: number;
};

export type DashboardMetrics = {
  notificationsCount: number;
  revenueSeries: MetricPoint[];
  salesSeries: MetricPoint[];
  inventorySeries: MetricPoint[];
  productsSeries: MetricPoint[];
};

export type ProductItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  purchasePrice: number;
  salePrice: number;
  primaryImage: string | null;
  secondaryImage: string | null;
  stock: number;
  brandId: number | null;
  brandName: string;
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
};

export type CatalogOption = {
  id: number;
  nombre: string;
  imagen?: string | null;
};

export type RoleOption = {
  id: number;
  nombre: string;
};

export type SubcategoryOption = {
  id: number;
  nombre: string;
  categoryId: number;
  createdAt?: string | null;
  active?: boolean | null;
};

export type CustomerItem = {
  id: number;
  name: string;
  nit: string | null;
  telefono: string | null;
  correo: string | null;
  createdAt?: string | null;
};

export type RecentSale = {
  id: number;
  fecha: string;
  customerName: string;
  total: number;
};

export type LowStockProduct = {
  id: number;
  nombre: string;
  stock: number;
};

export type UserManagementItem = {
  id: number;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
  profileName: string;
  profileType: 'empleado' | 'cliente' | 'usuario';
  role: {
    id: number;
    name: string;
  };
};

export type CartItem = {
  productId: number;
  quantity: number;
};

export type CustomerAccountSection =
  | 'orders'
  | 'addresses'
  | 'invoices'
  | 'history'
  | 'profile';

export type CustomerAccountOrderItem = {
  productId: number;
  name: string;
  brandName: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CustomerAccountOrder = {
  id: number;
  orderCode: string;
  trackingCode: string | null;
  createdAt: string;
  total: number;
  shippingCost: number;
  orderStatus: string;
  deliveryStatus: string;
  deliveryStatusLabel: string;
  address: string | null;
  reference: string | null;
  zone: string | null;
  recipientName: string | null;
  phone: string | null;
  estimatedMinutes: number | null;
  items: CustomerAccountOrderItem[];
};

export type CustomerAccountAddress = {
  id: string;
  label: string;
  address: string;
  zone: string | null;
  reference: string | null;
  recipientName: string | null;
  phone: string | null;
  lastUsedAt: string;
  ordersCount: number;
};

export type CustomerAccountProfile = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  nit: string | null;
  createdAt: string | null;
};

export type CustomerAccountSummary = {
  totalOrders: number;
  totalSpent: number;
  activeOrders: number;
  deliveredOrders: number;
  savedAddresses: number;
};

export type CustomerAccountDashboard = {
  summary: CustomerAccountSummary;
  profile: CustomerAccountProfile;
  orders: CustomerAccountOrder[];
  addresses: CustomerAccountAddress[];
};

export type SalesHistorySummary = {
  totalVendido: number;
  cantidadVentas: number;
  productosVendidos: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
};

export type SalesHistoryProduct = {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type SalesHistorySale = {
  id: number;
  fecha: string;
  clienteNombre: string;
  nit: string;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  subtotal: number;
  descuento: number;
  total: number;
  montoRecibido: number | null;
  cambio: number;
  referenciaPago: string | null;
  estado: string;
  cajero: string;
  productos: SalesHistoryProduct[];
};

export type SalesHistoryResponse = {
  fecha: string;
  resumen: SalesHistorySummary;
  ventas: SalesHistorySale[];
};

export type DeliveryOrderStatus =
  | 'pedido_recibido'
  | 'pago_confirmado'
  | 'preparando_pedido'
  | 'pedido_despachado'
  | 'repartidor_en_camino'
  | 'repartidor_cerca'
  | 'entregado';

export type DeliveryOrderStatusView = {
  code: DeliveryOrderStatus;
  label: string;
  message: string;
};

export type DeliveryOrderProduct = {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type DeliveryOrder = {
  id: number;
  trackingCode: string | null;
  fecha: string;
  updatedAt?: string | null;
  deliveredAt?: string | null;
  cliente: {
    nombre: string;
    nit: string;
    telefono: string;
  };
  repartidor: {
    id: number;
    nombre: string;
  } | null;
  direccionEntrega: string;
  referenciaEntrega: string;
  zonaEntrega: string;
  nombreRecibe: string;
  telefonoEntrega: string;
  tiempoEstimadoMinutos: number | null;
  costoEnvio: number;
  total: number;
  estadoPedido: DeliveryOrderStatus;
  estadoEntrega: DeliveryOrderStatus;
  estado: DeliveryOrderStatusView;
  productos: DeliveryOrderProduct[];
};

export type DeliveryTrackingHistoryItem = DeliveryOrderStatusView & {
  descripcion: string | null;
  createdAt: string;
};

export type DeliveryTrackingResponse = {
  order: DeliveryOrder & {
    historial: DeliveryTrackingHistoryItem[];
  };
};
