import { useMemo, useState } from 'react';

import { ActivityFeed, type ActivityItem } from '../components/dashboard/ActivityFeed';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { LoadingSkeleton } from '../components/dashboard/LoadingSkeleton';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentSales } from '../components/dashboard/RecentSales';
import { SalesChart } from '../components/dashboard/SalesChart';
import {
  ProductCardIcon,
  RevenueIcon,
  SalesCardIcon,
  StockCardIcon,
} from '../components/icons';
import type {
  CatalogOption,
  DashboardMetrics,
  LowStockProduct,
  Overview,
  ProductItem,
  RecentSale,
} from '../domain/types';
import { dateTime } from '../lib/format';

type DashboardPageProps = {
  brands: CatalogOption[];
  isLoading: boolean;
  metrics: DashboardMetrics;
  lowStockProducts: LowStockProduct[];
  onGoToInventory: () => void;
  onGoToProducts: () => void;
  onGoToSales: () => void;
  overview: Overview;
  products: ProductItem[];
  recentSales: RecentSale[];
};

const calculateChange = (series: DashboardMetrics['revenueSeries']) => {
  const current = series.at(-1)?.value ?? 0;
  const previous = series.at(-2)?.value ?? 0;

  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

export function DashboardPage({
  brands,
  isLoading,
  metrics,
  lowStockProducts,
  onGoToInventory,
  onGoToProducts,
  onGoToSales,
  overview,
  products,
  recentSales,
}: DashboardPageProps) {
  const [detailMessage, setDetailMessage] = useState('');

  const statsItems = useMemo(
    () => [
      {
        label: 'Ingresos hoy',
        value: overview.revenueToday,
        isCurrency: true,
        change: calculateChange(metrics.revenueSeries),
        description: `${overview.totalSalesToday} ventas y ${overview.itemsSoldToday} unidades colocadas.`,
        icon: <RevenueIcon />,
        tone: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Ventas hoy',
        value: overview.totalSalesToday,
        change: calculateChange(metrics.salesSeries),
        description: `${overview.itemsSoldToday} unidades registradas durante el dia.`,
        icon: <SalesCardIcon />,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Stock total',
        value: overview.totalStock,
        change: calculateChange(metrics.inventorySeries),
        description: 'Existencias consolidadas en inventario general.',
        icon: <StockCardIcon />,
        tone: 'bg-violet-50 text-violet-700',
      },
      {
        label: 'Productos',
        value: overview.totalProducts,
        change: calculateChange(metrics.productsSeries),
        description: `Marcas activas: ${brands.length}. Catalogo en crecimiento.`,
        icon: <ProductCardIcon />,
        tone: 'bg-amber-50 text-amber-700',
      },
    ],
    [brands.length, metrics.inventorySeries, metrics.productsSeries, metrics.revenueSeries, metrics.salesSeries, overview.itemsSoldToday, overview.revenueToday, overview.totalProducts, overview.totalSalesToday, overview.totalStock],
  );

  const activityItems = useMemo<ActivityItem[]>(() => {
    const saleItems = recentSales.map((sale) => ({
      id: `sale-${sale.id}`,
      title: `Venta #${sale.id} registrada`,
      description: `${sale.customerName} aparece como cliente de la operacion.`,
      sortValue: new Date(sale.fecha).getTime(),
      time: dateTime.format(new Date(sale.fecha)),
      tone: 'blue' as const,
    }));

    const productItems = [...products]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 4)
      .map((product) => ({
        id: `product-${product.id}`,
        title: `Producto creado: ${product.nombre}`,
        description: `${product.categoryName} • ${product.brandName}`,
        sortValue: new Date(product.createdAt).getTime(),
        time: dateTime.format(new Date(product.createdAt)),
        tone: 'emerald' as const,
      }));

    return [...saleItems, ...productItems]
      .sort((left, right) => right.sortValue - left.sortValue)
      .slice(0, 6);
  }, [products, recentSales]);

  const handleViewSale = (saleId: number) => {
    setDetailMessage(`La venta #${saleId} aparece en el panel reciente. Si quieres verla completa, entra al modulo de ventas.`);
  };

  return (
    <div className="grid gap-6">
      {detailMessage ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {detailMessage}
        </div>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <QuickActions
            onAdjustStock={onGoToInventory}
            onNewProduct={onGoToProducts}
            onNewSale={onGoToSales}
          />

          <DashboardStats items={statsItems} />

          <SalesChart points={metrics.revenueSeries} />

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <RecentSales onGoToSales={onGoToSales} onViewSale={handleViewSale} sales={recentSales} />
            <AlertsPanel alerts={lowStockProducts} onGoToInventory={onGoToInventory} />
          </div>

          <ActivityFeed items={activityItems} />
        </>
      )}
    </div>
  );
}
