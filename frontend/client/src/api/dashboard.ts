import type {
  CatalogOption,
  CustomerItem,
  DashboardMetrics,
  LowStockProduct,
  Overview,
  ProductItem,
  RecentSale,
  SubcategoryOption,
} from '../domain/types';
import { authRequest } from './client';

export type DashboardData = {
  products: ProductItem[];
  overview: Overview;
  lowStockProducts: LowStockProduct[];
  recentSales: RecentSale[];
  metrics: DashboardMetrics;
  brands: CatalogOption[];
  categories: CatalogOption[];
  subcategories: SubcategoryOption[];
  customers: CustomerItem[];
};

export async function fetchDashboard(token: string): Promise<DashboardData> {
  const [productsPayload, summaryPayload, catalogPayload, customersPayload] = await Promise.all([
    authRequest<{ products: ProductItem[] }>('/api/products', token),
    authRequest<{
      overview: Overview;
      lowStockProducts: LowStockProduct[];
      recentSales: RecentSale[];
      metrics: DashboardMetrics;
    }>('/api/sales/summary', token),
    authRequest<{
      brands: CatalogOption[];
      categories: CatalogOption[];
      subcategories: SubcategoryOption[];
    }>('/api/catalog/options', token),
    authRequest<{ customers: CustomerItem[] }>('/api/customers', token),
  ]);

  return {
    products: productsPayload.products,
    overview: summaryPayload.overview,
    lowStockProducts: summaryPayload.lowStockProducts,
    recentSales: summaryPayload.recentSales,
    metrics: summaryPayload.metrics,
    brands: catalogPayload.brands,
    categories: catalogPayload.categories,
    subcategories: catalogPayload.subcategories,
    customers: customersPayload.customers,
  };
}
