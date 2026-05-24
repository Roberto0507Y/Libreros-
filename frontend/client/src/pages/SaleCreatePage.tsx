import { useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  LayoutGrid,
  PackageSearch,
  ScanSearch,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react';

import { CheckoutModal } from '../components/sales/CheckoutModal';
import { PosCart } from '../components/sales/PosCart';
import { ProductCard } from '../components/sales/ProductCard';
import type { PaymentMethod } from '../components/sales/PaymentMethodSelector';
import type { CustomerItem, ProductItem } from '../domain/types';
import { currency } from '../lib/format';

type SaleCreatePageProps = {
  customers: CustomerItem[];
  isLoading: boolean;
  isSaving: boolean;
  onCreateCustomer: (input: {
    fullName: string;
    nit: string;
    phone?: string;
    email?: string;
  }) => Promise<CustomerItem>;
  onRegister: (input: {
    customerId?: number | null;
    discount?: number;
    paymentMethod: PaymentMethod;
    amountReceived?: number | null;
    paymentReference?: string;
    items: Array<{ productId: number; quantity: number }>;
  }) => Promise<void>;
  onSearchCustomers: (query: string, mode?: 'all' | 'nit') => Promise<CustomerItem[]>;
  products: ProductItem[];
};

type CartLine = {
  productId: number;
  quantity: number;
};

type NewCustomerFormState = {
  email: string;
  firstName: string;
  lastName: string;
  nit: string;
  phone: string;
};

const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'efectivo';

const parseMoney = (value: string) => {
  const amount = Number(value);
  return Number.isNaN(amount) ? 0 : Math.max(amount, 0);
};

const findConsumerFinalCustomer = (list: CustomerItem[]) =>
  list.find(
    (customer) =>
      customer.nit?.trim().toUpperCase() === 'CF' ||
      customer.name.trim().toLowerCase() === 'consumidor final',
  ) ?? null;

const emptyNewCustomerForm: NewCustomerFormState = {
  email: '',
  firstName: '',
  lastName: '',
  nit: '',
  phone: '',
};

export function SaleCreatePage({
  customers,
  isLoading,
  isSaving,
  onCreateCustomer,
  onRegister,
  onSearchCustomers,
  products,
}: SaleCreatePageProps) {
  const [catalogQuery, setCatalogQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('0');
  const [selectedClient, setSelectedClient] = useState<CustomerItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [customerMode, setCustomerMode] = useState<'cf' | 'nit'>('cf');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerItem[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerError, setNewCustomerError] = useState('');
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerFormState>(emptyNewCustomerForm);
  const [checkoutCustomerSnapshot, setCheckoutCustomerSnapshot] = useState<CustomerItem | null>(null);

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const defaultCustomer = useMemo(() => {
    return findConsumerFinalCustomer(customers) ?? customers[0] ?? null;
  }, [customers]);

  useEffect(() => {
    if (!selectedClient && defaultCustomer) {
      setSelectedClient(defaultCustomer);
      return;
    }

    if (selectedClient) {
      const nextSelected =
        customers.find((customer) => customer.id === selectedClient.id) ?? selectedClient;
      if (nextSelected !== selectedClient) {
        setSelectedClient(nextSelected);
      }
    }
  }, [customers, defaultCustomer, selectedClient]);

  useEffect(() => {
    if (customerMode !== 'nit') {
      setCustomerSearchResults([]);
      setIsSearchingCustomers(false);
      return;
    }

    const query = customerSearch.trim();
    if (!query) {
      setCustomerSearchResults([]);
      setIsSearchingCustomers(false);
      return;
    }

    let active = true;

    const timeout = window.setTimeout(async () => {
      setIsSearchingCustomers(true);
      try {
        const results = await onSearchCustomers(query, 'nit');
        if (active) {
          setCustomerSearchResults(results);
        }
      } catch {
        if (active) {
          setCustomerSearchResults([]);
        }
      } finally {
        if (active) {
          setIsSearchingCustomers(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [customerMode, customerSearch, onSearchCustomers]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = catalogQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [
        product.nombre,
        product.brandName,
        product.categoryName,
        product.subcategoryName,
        String(product.id),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [catalogQuery, products]);

  const cart = useMemo(() => {
    return cartItems
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) return null;

        return {
          id: product.id,
          name: product.nombre,
          brandName: product.brandName,
          image: product.primaryImage,
          price: product.salePrice,
          quantity: item.quantity,
          stock: product.stock,
          subtotal: product.salePrice * item.quantity,
        };
      })
      .filter(Boolean);
  }, [cartItems, products]) as Array<{
    id: number;
    name: string;
    brandName: string;
    image: string | null;
    price: number;
    quantity: number;
    stock: number;
    subtotal: number;
  }>;

  const subtotal = cart.reduce((accumulator, item) => accumulator + item.subtotal, 0);
  const discountValue = Math.min(parseMoney(discount), subtotal);
  const total = Math.max(subtotal - discountValue, 0);
  const amountReceivedValue = parseMoney(amountReceived);
  const change = paymentMethod === 'efectivo' && amountReceivedValue > total ? amountReceivedValue - total : 0;
  const unitsInCart = cart.reduce((accumulator, item) => accumulator + item.quantity, 0);

  const stats = useMemo(
    () => [
      {
        label: 'Productos visibles',
        value: filteredProducts.length,
        icon: LayoutGrid,
        tone:
          'border border-blue-100/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(219,234,254,0.14))] text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] backdrop-blur-md',
        iconTone:
          'bg-[linear-gradient(135deg,rgba(30,58,138,0.9),rgba(37,99,235,0.95))] text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]',
        labelTone: 'text-blue-100/90',
      },
      {
        label: 'En carrito',
        value: unitsInCart,
        icon: ShoppingBasket,
        tone:
          'border border-emerald-100/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(209,250,229,0.14))] text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] backdrop-blur-md',
        iconTone:
          'bg-[linear-gradient(135deg,rgba(5,150,105,0.9),rgba(16,185,129,0.95))] text-white shadow-[0_14px_28px_rgba(16,185,129,0.2)]',
        labelTone: 'text-emerald-100/90',
      },
      {
        label: 'Total estimado',
        value: currency.format(total),
        icon: BadgeDollarSign,
        tone:
          'border border-amber-100/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,251,235,0.14))] text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] backdrop-blur-md',
        iconTone:
          'bg-[linear-gradient(135deg,rgba(245,158,11,0.9),rgba(249,115,22,0.95))] text-white shadow-[0_14px_28px_rgba(249,115,22,0.18)]',
        labelTone: 'text-amber-100/90',
      },
    ],
    [filteredProducts.length, total, unitsInCart],
  );

  const resetCheckout = () => {
    setCheckoutStep(1);
    setCustomerMode('cf');
    setCustomerSearch('');
    setCustomerSearchResults([]);
    setNewCustomerError('');
    setNewCustomerForm(emptyNewCustomerForm);
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setAmountReceived('');
    setPaymentReference('');
    setErrorMessage('');
  };

  const resetSale = () => {
    setCartItems([]);
    setDiscount('0');
    setAmountReceived('');
    setPaymentReference('');
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setSelectedClient(defaultCustomer);
    setCustomerMode('cf');
    setCustomerSearch('');
    setCustomerSearchResults([]);
    setNewCustomerError('');
    setNewCustomerForm(emptyNewCustomerForm);
    setErrorMessage('');
    setSuccessMessage('');
    setIsCheckoutOpen(false);
    setIsMobileCartOpen(false);
    setCheckoutStep(1);
  };

  const handleAddProduct = (productId: number) => {
    setErrorMessage('');
    setSuccessMessage('');

    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setCartItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      const alreadyReserved = existing?.quantity ?? 0;

      if (alreadyReserved >= product.stock) {
        setErrorMessage(`No hay stock suficiente para ${product.nombre}.`);
        return current;
      }

      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
  };

  const handleDecreaseItem = (productId: number) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleIncreaseItem = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    setCartItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;
        if (item.quantity >= product.stock) return item;
        return { ...item, quantity: item.quantity + 1 };
      }),
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  };

  const openCheckout = () => {
    if (!cartItems.length) {
      setErrorMessage('Agrega al menos un producto antes de finalizar la compra.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setCheckoutCustomerSnapshot(selectedClient ?? defaultCustomer);
    setIsCheckoutOpen(true);
    setCheckoutStep(1);
    setCustomerMode(selectedClient?.nit?.toUpperCase() === 'CF' || !selectedClient ? 'cf' : 'nit');
    setCustomerSearch('');
    setCustomerSearchResults([]);
    setNewCustomerError('');
  };

  const handleContinueFromCustomer = () => {
    if (customerMode === 'cf') {
      if (!defaultCustomer) {
        setErrorMessage('No se encontró el cliente Consumidor Final configurado.');
        return;
      }

      setSelectedClient(defaultCustomer);
      setCheckoutStep(2);
      return;
    }

    if (!selectedClient || selectedClient.nit?.toUpperCase() === 'CF') {
      setErrorMessage('Selecciona un cliente válido con NIT para continuar.');
      return;
    }

    setCheckoutStep(2);
  };

  const handleCreateCustomerSubmit = async () => {
    setNewCustomerError('');
    setErrorMessage('');

    if (!newCustomerForm.firstName.trim()) {
      setNewCustomerError('Debes ingresar los nombres del cliente.');
      return;
    }

    if (!newCustomerForm.lastName.trim()) {
      setNewCustomerError('Debes ingresar los apellidos del cliente.');
      return;
    }

    if (!newCustomerForm.nit.trim()) {
      setNewCustomerError('Debes ingresar el NIT del cliente.');
      return;
    }

    setIsCreatingCustomer(true);

    try {
      const createdCustomer = await onCreateCustomer({
        fullName: `${newCustomerForm.firstName.trim()} ${newCustomerForm.lastName.trim()}`,
        nit: newCustomerForm.nit.trim().toUpperCase(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim(),
      });

      setSelectedClient(createdCustomer);
      setCustomerMode('nit');
      setCustomerSearch(createdCustomer.nit ?? createdCustomer.name);
      setCustomerSearchResults([createdCustomer]);
      setNewCustomerForm(emptyNewCustomerForm);
      setCheckoutStep(2);
      setSuccessMessage('Cliente creado y seleccionado correctamente.');
    } catch (error) {
      setNewCustomerError(error instanceof Error ? error.message : 'No se pudo crear el cliente.');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleConfirmSale = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!cartItems.length) {
      setErrorMessage('No puedes finalizar una venta sin productos.');
      return;
    }

    if (total < 0) {
      setErrorMessage('El total de la venta no puede ser negativo.');
      return;
    }

    if (paymentMethod === 'efectivo' && amountReceivedValue < total) {
      setErrorMessage('El monto recibido debe cubrir el total a pagar.');
      return;
    }

    try {
      await onRegister({
        customerId: selectedClient?.id ?? defaultCustomer?.id ?? null,
        discount: discountValue,
        paymentMethod,
        amountReceived: paymentMethod === 'efectivo' ? amountReceivedValue : null,
        paymentReference: paymentMethod === 'efectivo' ? '' : paymentReference.trim(),
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      resetSale();
      setSuccessMessage('Venta registrada correctamente.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo registrar la venta.');
    }
  };

  const handleCheckoutStepChange = (nextStep: 1 | 2 | 3) => {
    if (nextStep === 3 && paymentMethod === 'efectivo' && amountReceivedValue < total) {
      setErrorMessage('El monto recibido debe cubrir el total antes de continuar.');
      return;
    }

    setErrorMessage('');
    setCheckoutStep(nextStep);
  };

  const renderLoadingSkeleton = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
      <div className="space-y-6">
        <div className="animate-pulse rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="h-6 w-52 rounded bg-slate-200" />
          <div className="mt-4 h-12 rounded-2xl bg-slate-100" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)]"
              key={index}
            >
              <div className="aspect-[4/3] rounded-[22px] bg-slate-100" />
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
              <div className="mt-5 h-11 rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="animate-pulse rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="mt-5 h-24 rounded-[24px] bg-slate-100" />
        <div className="mt-4 h-48 rounded-[24px] bg-slate-100" />
      </div>
    </div>
  );

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_58%,#2563eb_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] md:px-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Punto de venta
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
              Registro de ventas en caja
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className={`rounded-[24px] px-4 py-4 transition hover:-translate-y-0.5 ${stat.tone}`} key={stat.label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${stat.labelTone}`}>
                      {stat.label}
                    </span>
                    <span className={`grid h-9 w-9 place-items-center rounded-2xl ${stat.iconTone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <strong className="mt-3 block text-2xl font-black">
                    {typeof stat.value === 'number' ? stat.value : stat.value}
                  </strong>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_44px_rgba(15,23,42,0.06)] md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Catálogo POS
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Toca un producto para agregarlo</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    <PackageSearch className="h-4 w-4" />
                    {products.length} productos
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <ShoppingBag className="h-4 w-4" />
                    {unitsInCart} en venta
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/80 p-2">
                <label
                  className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 shadow-sm"
                  htmlFor="pos-product-search"
                >
                  <ScanSearch className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
                    id="pos-product-search"
                    onChange={(event) => setCatalogQuery(event.target.value)}
                    placeholder="Buscar por nombre, marca, categoría o código..."
                    type="search"
                    value={catalogQuery}
                  />
                </label>
              </div>
            </section>

            {filteredProducts.length ? (
              <section
                className={`grid gap-4 ${
                  filteredProducts.length < 3
                    ? 'md:grid-cols-2 xl:grid-cols-2'
                    : 'md:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    onAdd={handleAddProduct}
                    product={product}
                    quantityInCart={cartItems.find((item) => item.productId === product.id)?.quantity ?? 0}
                  />
                ))}
              </section>
            ) : (
              <section className="grid min-h-[320px] place-items-center rounded-[30px] border border-dashed border-slate-200 bg-white px-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <div>
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400">
                    <PackageSearch className="h-7 w-7" />
                  </span>
                  <strong className="mt-4 block text-xl text-slate-950">No encontramos productos</strong>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Ajusta tu búsqueda o limpia el texto para volver a ver todo el catálogo disponible.
                  </p>
                </div>
              </section>
            )}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-16">
              <PosCart
                cartCount={cartItems.length}
                discount={discount}
                isSaving={isSaving}
                items={cart}
                onDecrease={handleDecreaseItem}
                onDiscountChange={setDiscount}
                onIncrease={handleIncreaseItem}
                onOpenCheckout={openCheckout}
                onRemove={handleRemoveItem}
                subtotal={subtotal}
                total={total}
              />
            </div>
          </div>
        </div>
      )}

      {!isLoading ? (
        <div className="xl:hidden">
          <button
            className="fixed inset-x-4 bottom-4 z-40 inline-flex items-center justify-between rounded-[26px] bg-slate-950 px-5 py-4 text-left text-white shadow-[0_20px_40px_rgba(15,23,42,0.28)]"
            onClick={() => setIsMobileCartOpen(true)}
            type="button"
          >
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Carrito
              </span>
              <strong className="mt-1 block text-lg font-bold">
                {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
              </strong>
            </div>
            <div className="text-right">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Total
              </span>
              <strong className="mt-1 block text-2xl font-black">{currency.format(total)}</strong>
            </div>
          </button>

          {isMobileCartOpen ? (
            <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm">
              <button
                aria-label="Cerrar carrito"
                className="absolute inset-0 h-full w-full"
                onClick={() => setIsMobileCartOpen(false)}
                type="button"
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[32px] bg-white shadow-[0_-20px_50px_rgba(15,23,42,0.18)]">
                <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-slate-200" />
                <div className="p-4">
                  <PosCart
                    cartCount={cartItems.length}
                    discount={discount}
                    isCompact
                    isSaving={isSaving}
                    items={cart}
                    onDecrease={handleDecreaseItem}
                    onDiscountChange={setDiscount}
                    onIncrease={handleIncreaseItem}
                    onOpenCheckout={() => {
                      setIsMobileCartOpen(false);
                      openCheckout();
                    }}
                    onRemove={handleRemoveItem}
                    subtotal={subtotal}
                    total={total}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <CheckoutModal
        amountReceived={amountReceived}
        cartItems={cart}
        change={change}
        customerMode={customerMode}
        customerSearch={customerSearch}
        customerSearchResults={customerSearchResults}
        discountValue={discountValue}
        errorMessage={errorMessage}
        isCreatingCustomer={isCreatingCustomer}
        isOpen={isCheckoutOpen}
        isSearchingCustomers={isSearchingCustomers}
        isSubmitting={isSaving}
        newCustomerError={newCustomerError}
        newCustomerForm={newCustomerForm}
        onAmountReceivedChange={setAmountReceived}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedClient(checkoutCustomerSnapshot ?? defaultCustomer);
          resetCheckout();
        }}
        onConfirm={handleConfirmSale}
        onContinueFromCustomer={handleContinueFromCustomer}
        onCreateCustomer={handleCreateCustomerSubmit}
        onCustomerModeChange={(value) => {
          setCustomerMode(value);
          setNewCustomerError('');
          if (value === 'cf') {
            setSelectedClient(defaultCustomer);
            setCustomerSearch('');
            setCustomerSearchResults([]);
          } else {
            if (selectedClient?.nit?.toUpperCase() === 'CF') {
              setSelectedClient(null);
            }
          }
        }}
        onCustomerSearchChange={(value) => {
          const normalizedValue = value.toUpperCase();
          setCustomerSearch(normalizedValue);
          setSelectedClient(null);
          setNewCustomerError('');
          setNewCustomerForm((current) => ({
            ...current,
            nit: normalizedValue,
          }));
        }}
        onCustomerSelect={(customer) => {
          setSelectedClient(customer);
          setCustomerSearch(customer.nit ?? customer.name);
          setNewCustomerError('');
        }}
        onNewCustomerChange={(field, value) =>
          setNewCustomerForm((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onPaymentMethodChange={(method) => {
          setPaymentMethod(method);
          if (method === 'efectivo') {
            setPaymentReference('');
          }
        }}
        onPaymentReferenceChange={setPaymentReference}
        onStepChange={handleCheckoutStepChange}
        paymentMethod={paymentMethod}
        paymentReference={paymentReference}
        selectedCustomer={selectedClient ?? defaultCustomer}
        step={checkoutStep}
        subtotal={subtotal}
        total={total}
      />
    </div>
  );
}
