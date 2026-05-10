import {
  Box,
  CheckCircle,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import type { DeliveryOrderStatus } from '../../domain/types';

export const DELIVERY_STATUS_STEPS: Array<{
  code: DeliveryOrderStatus;
  label: string;
  icon: LucideIcon;
}> = [
  { code: 'pedido_recibido', label: 'Pedido recibido', icon: PackageCheck },
  { code: 'pago_confirmado', label: 'Pago confirmado', icon: CreditCard },
  { code: 'preparando_pedido', label: 'Preparando pedido', icon: Box },
  { code: 'pedido_despachado', label: 'Pedido despachado', icon: Truck },
  { code: 'repartidor_en_camino', label: 'Repartidor en camino', icon: MapPin },
  { code: 'repartidor_cerca', label: 'Repartidor cerca', icon: Home },
  { code: 'entregado', label: 'Entregado', icon: CheckCircle },
];

export const getDeliveryStatusIndex = (status: DeliveryOrderStatus) =>
  DELIVERY_STATUS_STEPS.findIndex((step) => step.code === status);
