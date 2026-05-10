import { useEffect, useState } from 'react';

import './App.css';

import type {
  AppSection,
  CatalogOption,
  CustomerItem,
  DashboardMetrics,
  LowStockProduct,
  Overview,
  ProductItem,
  RecentSale,
  RoleOption,
  SessionData,
  SubcategoryOption,
  UserManagementItem,
} from './domain/types';
import { clearStoredSession, readStoredSession } from './lib/session';
import { AppShell } from './components/layout/AppShell';
import { AlertStack } from './components/feedback/AlertStack';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductCreatePage } from './pages/ProductCreatePage';
import { SaleCreatePage } from './pages/SaleCreatePage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { DeliveryManagementPage } from './pages/DeliveryManagementPage';
import { DeliveryHistoryPage } from './pages/DeliveryHistoryPage';
import { BrandsPage } from './pages/BrandsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SubcategoriesPage } from './pages/SubcategoriesPage';
import { StorefrontPage } from './pages/StorefrontPage';
import { fetchDashboard } from './api/dashboard';
import { createBrand } from './api/brands';
import { createCategory, deleteCategory, updateCategory } from './api/categories';
import { deleteBrand, updateBrand } from './api/brands';
import { createProduct, deleteProduct, updateProduct } from './api/products';
import { registerSale } from './api/sales';
import { createCustomer, searchCustomers } from './api/customers';
import { createSubcategory } from './api/subcategories';
import { fetchUsers, updateUserRole } from './api/users';
import { UsersPage } from './pages/UsersPage';
import { currency } from './lib/format';

const emptyOverview: Overview = {
  totalProducts: 0,
  totalStock: 0,
  inventoryValue: 0,
  totalSalesToday: 0,
  revenueToday: 0,
  itemsSoldToday: 0,
};

const emptyMetrics: DashboardMetrics = {
  notificationsCount: 0,
  revenueSeries: [],
  salesSeries: [],
  inventorySeries: [],
  productsSeries: [],
};

export default function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [brands, setBrands] = useState<CatalogOption[]>([]);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isDeletingBrand, setIsDeletingBrand] = useState(false);
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);
  const [isSavingUserRole, setIsSavingUserRole] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [inventoryProductTargetId, setInventoryProductTargetId] = useState<number | null>(null);

  useEffect(() => {
    setSession(readStoredSession());
  }, []);

  const load = async (activeSession: SessionData) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchDashboard(activeSession.token);
      setProducts(data.products);
      setOverview(data.overview);
      setMetrics(data.metrics);
      setLowStockProducts(data.lowStockProducts);
      setRecentSales(data.recentSales);
      setBrands(data.brands);
      setCategories(data.categories);
      setSubcategories(data.subcategories);
      setCustomers(data.customers);

      if (['Administrador', 'Director'].includes(activeSession.user.role.name)) {
        const usersPayload = await fetchUsers(activeSession.token);
        setUsers(usersPayload.users);
        setRoles(usersPayload.roles);
      } else {
        setUsers([]);
        setRoles([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el sistema');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void load(session);
  }, [session]);

  useEffect(() => {
    if (!error) return;

    const timeout = window.setTimeout(() => {
      setError('');
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (!actionMessage) return;

    const timeout = window.setTimeout(() => {
      setActionMessage('');
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  useEffect(() => {
    if (!session) return;

    const roleName = session.user.role.name;
    const adminOnlySections: AppSection[] = ['categories', 'brands', 'subcategories', 'users', 'deliveries-history'];
    const staffSections: AppSection[] = ['inventory', 'products', 'sales', 'sales-history'];
    const courierSections: AppSection[] = ['deliveries', 'my-deliveries'];

    if (!['Administrador', 'Director'].includes(roleName) && adminOnlySections.includes(activeSection)) {
      setActiveSection('dashboard');
      return;
    }

    if (roleName === 'Cliente' && staffSections.includes(activeSection)) {
      setActiveSection('dashboard');
      return;
    }

    if (roleName === 'Repartidor' && !courierSections.includes(activeSection)) {
      setActiveSection('deliveries');
    }
  }, [activeSection, session]);

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    setActiveSection('dashboard');
    setError('');
    setActionMessage('');
    setOverview(emptyOverview);
    setProducts([]);
    setMetrics(emptyMetrics);
    setBrands([]);
    setCategories([]);
    setSubcategories([]);
    setCustomers([]);
    setRecentSales([]);
    setLowStockProducts([]);
    setUsers([]);
    setRoles([]);
    setInventoryProductTargetId(null);
  };

  const handleOpenProductEditor = (productId?: number) => {
    setInventoryProductTargetId(productId ?? null);
    setActiveSection('products');
  };

  const handleCreateProduct = async (input: {
    name: string;
    description: string;
    brandId: number | null;
    subcategoryId: number;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    primaryImage: string;
    secondaryImage: string;
  }) => {
    if (!session) return;

    setIsSavingProduct(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await createProduct(session.token, input);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('inventory');
    } catch (productError) {
      setError(productError instanceof Error ? productError.message : 'No se pudo crear el producto');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleUpdateProduct = async (
    productId: number,
    input: {
      name: string;
      description: string;
      brandId: number | null;
      subcategoryId: number;
      purchasePrice: number;
      salePrice: number;
      initialStock: number;
      primaryImage: string;
      secondaryImage: string;
    },
  ) => {
    if (!session) return;

    setIsSavingProduct(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await updateProduct(session.token, productId, input);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('products');
    } catch (productError) {
      setError(productError instanceof Error ? productError.message : 'No se pudo actualizar el producto');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!session) return;

    setIsDeletingProduct(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await deleteProduct(session.token, productId);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('products');
    } catch (productError) {
      setError(productError instanceof Error ? productError.message : 'No se pudo eliminar el producto');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleRegisterSale = async (input: {
    customerId?: number | null;
    discount?: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    amountReceived?: number | null;
    paymentReference?: string;
    items: Array<{ productId: number; quantity: number }>;
  }) => {
    if (!session) return;

    setIsSavingSale(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await registerSale(session.token, input);
      setActionMessage(
        `${payload.message}. ${payload.sale.customer.name} · Total: ${currency.format(payload.sale.total)}`,
      );
      await load(session);
      setActiveSection('dashboard');
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : 'No se pudo registrar la venta');
      throw saleError;
    } finally {
      setIsSavingSale(false);
    }
  };

  const handleSearchCustomers = async (queryText: string) => {
    if (!session) return [];

    const payload = await searchCustomers(session.token, queryText);
    return payload.customers;
  };

  const handleCreateCustomer = async (input: {
    fullName: string;
    nit: string;
    phone?: string;
    email?: string;
  }) => {
    if (!session) {
      throw new Error('La sesión expiró. Inicia sesión nuevamente.');
    }

    setError('');
    setActionMessage('');

    const payload = await createCustomer(session.token, input);

    setCustomers((current) => {
      const next = [payload.customer, ...current.filter((customer) => customer.id !== payload.customer.id)];
      return next.sort((left, right) => left.name.localeCompare(right.name));
    });
    setActionMessage(payload.message);

    return payload.customer;
  };

  const handleCreateBrand = async (input: { name: string; image: string }) => {
    if (!session) return;

    setIsSavingBrand(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await createBrand(session.token, input);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('brands');
    } catch (brandError) {
      setError(brandError instanceof Error ? brandError.message : 'No se pudo crear la marca');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleCreateCategory = async (input: { name: string; image: string }) => {
    if (!session) return;

    setIsSavingCategory(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await createCategory(session.token, input);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('categories');
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : 'No se pudo crear la categoria');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleUpdateCategory = async (input: { categoryId: number; name: string; image?: string }) => {
    if (!session) return;

    setIsSavingCategory(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await updateCategory(session.token, input.categoryId, {
        name: input.name,
        image: input.image,
      });
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('categories');
    } catch (categoryError) {
      setError(
        categoryError instanceof Error ? categoryError.message : 'No se pudo actualizar la categoria',
      );
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!session) return;

    setIsDeletingCategory(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await deleteCategory(session.token, categoryId);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('categories');
    } catch (categoryError) {
      setError(
        categoryError instanceof Error ? categoryError.message : 'No se pudo eliminar la categoria',
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleUpdateBrand = async (input: { brandId: number; name: string; image?: string }) => {
    if (!session) return;

    setIsSavingBrand(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await updateBrand(session.token, input.brandId, {
        name: input.name,
        image: input.image,
      });
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('brands');
    } catch (brandError) {
      setError(brandError instanceof Error ? brandError.message : 'No se pudo actualizar la marca');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (!session) return;

    setIsDeletingBrand(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await deleteBrand(session.token, brandId);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('brands');
    } catch (brandError) {
      setError(brandError instanceof Error ? brandError.message : 'No se pudo eliminar la marca');
    } finally {
      setIsDeletingBrand(false);
    }
  };

  const handleCreateSubcategory = async (input: { name: string; categoryId: number }) => {
    if (!session) return;

    setIsSavingSubcategory(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await createSubcategory(session.token, input);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('subcategories');
    } catch (subcategoryError) {
      setError(
        subcategoryError instanceof Error
          ? subcategoryError.message
          : 'No se pudo crear la subcategoria',
      );
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  const handleUpdateUserRole = async (input: { userId: number; roleId: number }) => {
    if (!session) return;

    setIsSavingUserRole(true);
    setError('');
    setActionMessage('');

    try {
      const payload = await updateUserRole(session.token, input.userId, input.roleId);
      setActionMessage(payload.message);
      await load(session);
      setActiveSection('users');
    } catch (userError) {
      setError(userError instanceof Error ? userError.message : 'No se pudo actualizar el rol');
    } finally {
      setIsSavingUserRole(false);
    }
  };

  if (!session || session.user.role.name === 'Cliente') {
    return (
      <StorefrontPage
        onLogin={(nextSession) => setSession(nextSession)}
        onLogout={session ? handleLogout : undefined}
        session={session}
      />
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      notificationsCount={metrics.notificationsCount}
      onLogout={handleLogout}
      onNavigate={setActiveSection}
      session={session}
    >
      <AlertStack
        alerts={[
          ...(error
            ? [
                {
                  id: 'app-error',
                  title: 'Error',
                  message: error,
                  severity: 'error' as const,
                },
              ]
            : []),
          ...(actionMessage
            ? [
                {
                  id: 'app-success',
                  title: 'Éxito',
                  message: actionMessage,
                  severity: 'success' as const,
                },
              ]
            : []),
        ]}
        onClose={(id) => {
          if (id === 'app-error') {
            setError('');
          }

          if (id === 'app-success') {
            setActionMessage('');
          }
        }}
      />

      {activeSection === 'dashboard' ? (
        <DashboardPage
          brands={brands}
          isLoading={isLoading}
          metrics={metrics}
          lowStockProducts={lowStockProducts}
          onGoToInventory={() => setActiveSection('inventory')}
          onGoToProducts={() => setActiveSection('products')}
          onGoToSales={() => setActiveSection('sales')}
          overview={overview}
          products={products}
          recentSales={recentSales}
        />
      ) : null}

      {activeSection === 'inventory' ? (
        <InventoryPage
          isLoading={isLoading}
          onCreateProduct={() => handleOpenProductEditor()}
          onEditProduct={handleOpenProductEditor}
          products={products}
        />
      ) : null}

      {activeSection === 'products' ? (
        <ProductCreatePage
          brands={brands}
          categories={categories}
          initialProductId={inventoryProductTargetId}
          isDeleting={isDeletingProduct}
          isSaving={isSavingProduct}
          onCreate={handleCreateProduct}
          onDelete={handleDeleteProduct}
          onUpdate={handleUpdateProduct}
          products={products}
          subcategories={subcategories}
        />
      ) : null}

      {activeSection === 'categories' ? (
        <CategoriesPage
          categories={categories}
          isDeleting={isDeletingCategory}
          isSaving={isSavingCategory}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
          onUpdate={handleUpdateCategory}
        />
      ) : null}

      {activeSection === 'brands' ? (
        <BrandsPage
          brands={brands}
          isLoading={isLoading}
          isDeleting={isDeletingBrand}
          isSaving={isSavingBrand}
          onCreate={handleCreateBrand}
          onDelete={handleDeleteBrand}
          onUpdate={handleUpdateBrand}
        />
      ) : null}

      {activeSection === 'subcategories' ? (
        <SubcategoriesPage
          categories={categories}
          isLoading={isLoading}
          isSaving={isSavingSubcategory}
          onCreate={handleCreateSubcategory}
          subcategories={subcategories}
        />
      ) : null}

      {activeSection === 'users' ? (
        <UsersPage
          isLoading={isLoading}
          isSaving={isSavingUserRole}
          onRoleChange={handleUpdateUserRole}
          roles={roles}
          users={users}
        />
      ) : null}

      {activeSection === 'sales' ? (
        <SaleCreatePage
          customers={customers}
          isLoading={isLoading}
          isSaving={isSavingSale}
          onCreateCustomer={handleCreateCustomer}
          onRegister={handleRegisterSale}
          onSearchCustomers={handleSearchCustomers}
          products={products}
        />
      ) : null}

      {activeSection === 'sales-history' ? <SalesHistoryPage session={session} /> : null}

      {activeSection === 'deliveries' ? (
        <DeliveryManagementPage
          mode={session.user.role.name === 'Repartidor' ? 'active' : 'all'}
          onActionComplete={async (message) => {
            setActionMessage(message);
            await load(session);
          }}
          session={session}
          users={users}
        />
      ) : null}

      {activeSection === 'my-deliveries' ? (
        <DeliveryManagementPage
          mode="completed"
          onActionComplete={async (message) => {
            setActionMessage(message);
            await load(session);
          }}
          session={session}
          users={users}
        />
      ) : null}

      {activeSection === 'deliveries-history' ? <DeliveryHistoryPage session={session} /> : null}
    </AppShell>
  );
}
