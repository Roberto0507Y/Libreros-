import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEventHandler } from 'react';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { ChevronDown, Eye, EyeOff, Grid2x2, Lock, LogOut, Mail, Menu, Package2, Search, ShoppingCart, Tags, UserCircle2, UserRound } from 'lucide-react';

import { API_URL } from '../api/client';
import { login, registerCustomer, requestPasswordReset } from '../api/auth';
import { fetchCart, replaceCart } from '../api/cart';
import { createOrder } from '../api/orders';
import { fetchStorefront } from '../api/storefront';
import { Footer, type FooterAction } from '../components/Footer';
import { NexusLogo } from '../components/branding/NexusLogo';
import { DeliveryStep } from '../components/payment-demo/DeliveryStep';
import { DemoCardPreview } from '../components/payment-demo/DemoCardPreview';
import { InvoicePreview } from '../components/payment-demo/InvoicePreview';
import { PaymentForm } from '../components/payment-demo/PaymentForm';
import { PaymentSummary } from '../components/payment-demo/PaymentSummary';
import { SecurePaymentBox } from '../components/payment-demo/SecurityNotice';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { ProductCard } from '../components/ui/ProductCard';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Select } from '../components/ui/Select';
import { CustomerDashboardPage } from './CustomerDashboardPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { TrackingPage } from './TrackingPage';
import type {
  DeliveryEstimate,
  DeliveryFormErrors,
  PaymentCardFocus,
  PaymentFormErrors,
} from '../components/payment-demo/types';
import type { CartItem, CatalogOption, ProductItem, SessionData } from '../domain/types';
import { currency, dateTime } from '../lib/format';
import { storageKey, storeSession } from '../lib/session';
import { clearStoredCart, readStoredCart, storeCart } from '../lib/cart';

type StorefrontPageProps = {
  onLogin: (session: SessionData) => void;
  onLogout?: () => void;
  session?: SessionData | null;
};

type InvoiceState = {
  customerName: string;
  deliveryAddress: string;
  deliveryEta: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  orderDate: string;
  orderId: number;
  orderTotal: number;
  phone: string;
  reference: string;
  shippingCost: number;
  subtotal: number;
};

const formatInvoiceOrderCode = (orderId: number, orderDate: string) => {
  const date = new Date(orderDate);
  return `ORD-${date.getFullYear()}-${String(orderId).padStart(4, '0')}`;
};

const buildInvoiceTrackingCode = (orderId: number, orderDate: string) => {
  const date = new Date(orderDate);
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return `TRK-${stamp}-${String(orderId).padStart(4, '0')}`;
};

const normalizeCartItems = (items: CartItem[]) =>
  [...items]
    .map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.productId) && Number.isFinite(item.quantity) && item.quantity > 0,
    )
    .sort((left, right) => left.productId - right.productId);

const mergeCartCollections = (...collections: CartItem[][]) => {
  const merged = new Map<number, number>();

  for (const collection of collections) {
    for (const item of collection) {
      if (!Number.isFinite(item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        continue;
      }

      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

const areCartCollectionsEqual = (left: CartItem[], right: CartItem[]) => {
  const normalizedLeft = normalizeCartItems(left);
  const normalizedRight = normalizeCartItems(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every(
    (item, index) =>
      item.productId === normalizedRight[index]?.productId &&
      item.quantity === normalizedRight[index]?.quantity,
  );
};

export function StorefrontPage({ onLogin, onLogout, session = null }: StorefrontPageProps) {
  const initialPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const initialTrackingCode = initialPathname.startsWith('/tracking/')
    ? decodeURIComponent(initialPathname.replace('/tracking/', '').trim())
    : '';
  const initialResetPasswordToken =
    initialPathname === '/reset-password'
      ? new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('token') ?? ''
      : '';
  const initialSearchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialBackView =
    initialSearchParams?.get('backView') === 'category-products' ||
    initialSearchParams?.get('backView') === 'all-products' ||
    initialSearchParams?.get('backView') === 'brand-products'
      ? (initialSearchParams.get('backView') as 'brand-products' | 'category-products' | 'all-products')
      : 'brand-products';
  const initialProductId = Number(initialSearchParams?.get('productId'));
  const initialBrandId = Number(initialSearchParams?.get('brandId'));
  const initialCategoryId = Number(initialSearchParams?.get('categoryId'));
  const isInitialBrandProductsRoute =
    initialSearchParams?.get('brandView') === 'brand-products' &&
    Number.isFinite(initialBrandId) &&
    initialBrandId > 0;
  const isInitialCategoryProductsRoute =
    initialSearchParams?.get('categoryView') === 'category-products' &&
    Number.isFinite(initialCategoryId) &&
    initialCategoryId > 0;
  const isInitialProductDetailRoute =
    initialSearchParams?.get('detailView') === 'product-detail' &&
    Number.isFinite(initialProductId) &&
    initialProductId > 0;

  const deliveryZones = [
    {
      value: 'zona-central',
      label: 'Zona central de la capital',
      coverage: 'Centro histórico y áreas cercanas',
      distanceKm: 3.8,
      minutes: 35,
      shippingCost: 18,
      lat: 14.6389,
      lng: -90.5133,
      mapLabel: 'Centro Histórico',
    },
    {
      value: 'zona-premium',
      label: 'Zonas 10, 14 y 15',
      coverage: 'Áreas comerciales y residenciales',
      distanceKm: 6.4,
      minutes: 45,
      shippingCost: 24,
      lat: 14.5964,
      lng: -90.5092,
      mapLabel: 'Zona 10',
    },
    {
      value: 'mixco',
      label: 'Mixco y San Cristóbal',
      coverage: 'Periferia oeste',
      distanceKm: 9.2,
      minutes: 58,
      shippingCost: 32,
      lat: 14.6567,
      lng: -90.6075,
      mapLabel: 'Mixco',
    },
    {
      value: 'villa-nueva',
      label: 'Villa Nueva y Petapa',
      coverage: 'Periferia sur',
      distanceKm: 11.5,
      minutes: 72,
      shippingCost: 40,
      lat: 14.5269,
      lng: -90.5881,
      mapLabel: 'Villa Nueva',
    },
    {
      value: 'carretera',
      label: 'Carretera a El Salvador / Fraijanes',
      coverage: 'Área oriente',
      distanceKm: 13.8,
      minutes: 82,
      shippingCost: 46,
      lat: 14.545,
      lng: -90.4378,
      mapLabel: 'Fraijanes',
    },
  ] as const;

  const heroSlides = [
    {
      id: 1,
      image: '/publicidad.png',
    },
    {
      id: 2,
      image: '/publicida2.png',
    },
    {
      id: 3,
      image: '/publicidad3.png',
    },
    {
      id: 4,
      image: '/publicidad4.png',
    },
  ];
  const testimonials = [
    {
      id: 1,
      name: 'Herrera Ax Karla Maribel',
      role: 'Cliente',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      text:
        'Muy Buena atención al cliente; pacientes, atentos, y muy claros al explicar, dándonos precios accesibles a los mayoristas. El parqueo es muy amplio para todo tipo de vehículo.',
    },
    {
      id: 2,
      name: 'Douglas Ricardo Sartorezzi',
      role: 'Cliente',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
      text:
        '¡Una excelente Librería! Muy surtida, gran variedad de productos y marcas, precios muy favorables y convenientes. Se puede comprar por mayor y menor. Cuenta con parqueo propio, gratuito. La atención al por mayor es en el sótano y al menudeo en el primer nivel. Excelente atención por parte del personal.',
    },
    {
      id: 3,
      name: 'Mireya Isidro',
      role: 'Cliente',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
      text:
        'Es la primera vez que visité el lugar, y quedé gratamente sorprendida por la atención que le dan al cliente, resolvieron todas mis dudas y todas las veces que quise preguntar por algún producto, siempre hubo quién me atendiera con mucha cortesía.',
    },
  ];
  const [brands, setBrands] = useState<CatalogOption[]>([]);
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const cartSyncEnabledRef = useRef(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(
    Number.isFinite(initialBrandId) && initialBrandId > 0 ? initialBrandId : null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    Number.isFinite(initialCategoryId) && initialCategoryId > 0 ? initialCategoryId : null,
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    isInitialProductDetailRoute ? initialProductId : null,
  );
  const [productBackView, setProductBackView] = useState<'brand-products' | 'category-products' | 'all-products'>(
    initialBackView,
  );
  const [activeProductImage, setActiveProductImage] = useState<'primary' | 'secondary'>('primary');
  const [view, setView] = useState<
    | 'brands'
    | 'brand-products'
    | 'categories'
    | 'category-products'
    | 'product-detail'
    | 'all-products'
    | 'account'
  >(
    isInitialProductDetailRoute
      ? 'product-detail'
      : isInitialBrandProductsRoute
        ? 'brand-products'
        : isInitialCategoryProductsRoute
          ? 'category-products'
          : 'brands',
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceState | null>(null);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [footerInfoView, setFooterInfoView] = useState<'policies' | 'terms' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogBrandFilter, setCatalogBrandFilter] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('');
  const [catalogAvailability, setCatalogAvailability] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [catalogSort, setCatalogSort] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoginSuccessOpen, setIsLoginSuccessOpen] = useState(false);
  const [loginSuccessName, setLoginSuccessName] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newsletter: true,
  });
  const [loginError, setLoginError] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [paymentFocus, setPaymentFocus] = useState<PaymentCardFocus>(undefined);
  const [deliveryForm, setDeliveryForm] = useState({
    recipientName: '',
    phone: '',
    zone: '',
    address: '',
    reference: '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryFormErrors>({});
  const [paymentErrors, setPaymentErrors] = useState<PaymentFormErrors>({});
  const isClientSession = session?.user.role.name === 'Cliente';
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const benefitsSectionRef = useRef<HTMLDivElement | null>(null);
  const featuredProductsSectionRef = useRef<HTMLDivElement | null>(null);
  const brandsSectionRef = useRef<HTMLDivElement | null>(null);
  const categoriesSectionRef = useRef<HTMLDivElement | null>(null);
  const testimonialsSectionRef = useRef<HTMLDivElement | null>(null);

  const clearDetailSearchParams = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('productId');
    url.searchParams.delete('detailView');
    url.searchParams.delete('backView');
    url.searchParams.delete('brandId');
    url.searchParams.delete('brandView');
    url.searchParams.delete('categoryId');
    url.searchParams.delete('categoryView');
    window.history.replaceState({}, '', url.toString());
  };

  const scrollToElement = (element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const openHomeSection = (section: 'benefits' | 'products' | 'brands' | 'categories' | 'testimonials') => {
    clearDetailSearchParams();
    setSelectedProductId(null);
    setIsZoomActive(false);
    setView('brands');

    const sectionMap: Record<
      'benefits' | 'products' | 'brands' | 'categories' | 'testimonials',
      string
    > = {
      benefits: 'benefits-section',
      products: 'featured-products-section',
      brands: 'brands-section',
      categories: 'categories-section',
      testimonials: 'testimonials-section',
    };

    window.setTimeout(() => {
      scrollToElement(document.getElementById(sectionMap[section]));
    }, 90);
  };

  useEffect(() => {
    let ignore = false;

    const hydrateCart = async () => {
      cartSyncEnabledRef.current = false;
      setIsCartHydrated(false);
      const localCart = readStoredCart();

      if (!session || !isClientSession) {
        if (!ignore) {
          setCart(localCart);
          setIsCartHydrated(true);
        }
        return;
      }

      try {
        const payload = await fetchCart(session.token);
        const remoteCart = payload.items;
        const mergedCart = localCart.length ? mergeCartCollections(remoteCart, localCart) : remoteCart;

        if (localCart.length && !areCartCollectionsEqual(mergedCart, remoteCart)) {
          await replaceCart(session.token, mergedCart);
        }

        clearStoredCart();

        if (!ignore) {
          setCart(mergedCart);
        }
      } catch {
        if (!ignore) {
          setCart(localCart);
        }
      } finally {
        if (!ignore) {
          cartSyncEnabledRef.current = true;
          setIsCartHydrated(true);
        }
      }
    };

    void hydrateCart();

    return () => {
      ignore = true;
    };
  }, [isClientSession, session]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchStorefront();
        setBrands(data.brands);
        setCategories(data.categories);
        setProducts(data.products);

        if (
          !isInitialProductDetailRoute &&
          !isInitialCategoryProductsRoute &&
          !isInitialBrandProductsRoute
        ) {
          const firstBrandWithProducts =
            data.brands.find((brand) => data.products.some((product) => product.brandId === brand.id))?.id ??
            null;
          setSelectedBrandId(firstBrandWithProducts);
          const firstCategoryWithProducts =
            data.categories.find((category) =>
              data.products.some((product) => product.categoryId === category.id),
            )?.id ?? null;
          setSelectedCategoryId(firstCategoryWithProducts);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'No se pudo cargar la tienda principal',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!isCartHydrated || !cartSyncEnabledRef.current) {
      return;
    }

    let ignore = false;

    const persistCart = async () => {
      if (!session || !isClientSession) {
        storeCart(cart);
        return;
      }

      try {
        await replaceCart(session.token, cart);
        clearStoredCart();
      } catch {
        storeCart(cart);

        if (!ignore && cart.length > 0) {
          setCartMessage(
            'No se pudo sincronizar el carrito, pero tus productos siguen guardados en este dispositivo.',
          );
        }
      }
    };

    void persistCart();

    return () => {
      ignore = true;
    };
  }, [cart, isCartHydrated, isClientSession, session]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current) {
        return;
      }

      if (!accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (view === 'all-products') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [view]);

  useEffect(() => {
    if (isLoading || products.length === 0) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const detailView = params.get('detailView');
    const productId = Number(params.get('productId'));
    const backView = params.get('backView');
    const brandId = Number(params.get('brandId'));
    const categoryId = Number(params.get('categoryId'));

    if (detailView !== 'product-detail' || !Number.isFinite(productId) || productId <= 0) {
      return;
    }

    const productExists = products.some((product) => product.id === productId);
    if (!productExists) {
      return;
    }

    if (Number.isFinite(brandId) && brandId > 0) {
      setSelectedBrandId(brandId);
    }

    if (Number.isFinite(categoryId) && categoryId > 0) {
      setSelectedCategoryId(categoryId);
    }

    if (
      backView === 'brand-products' ||
      backView === 'category-products' ||
      backView === 'all-products'
    ) {
      setProductBackView(backView);
    }

    setSelectedProductId(productId);
    setActiveProductImage('primary');
    setIsZoomActive(false);
    setView('product-detail');
  }, [isLoading, products]);

  const visibleBrands = useMemo(() => brands, [brands]);
  const visibleCategories = useMemo(() => categories, [categories]);
  const selectedBrand = visibleBrands.find((brand) => brand.id === selectedBrandId) ?? null;
  const brandProducts = products.filter((product) => product.brandId === selectedBrandId);
  const selectedCategory = visibleCategories.find((category) => category.id === selectedCategoryId) ?? null;
  const categoryProducts = products.filter((product) => product.categoryId === selectedCategoryId);
  const featuredProducts = useMemo(() => {
    return visibleBrands
      .slice(0, 5)
      .map((brand) => products.find((product) => product.brandId === brand.id))
      .filter(Boolean) as ProductItem[];
  }, [products, visibleBrands]);
  const filteredCatalogProducts = useMemo(() => {
    const normalizedQuery = catalogSearch.trim().toLowerCase();

    return [...products]
      .filter((product) => {
        const matchesQuery = !normalizedQuery
          ? true
          : [product.nombre, product.brandName, product.categoryName, product.subcategoryName]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery);
        const matchesBrand = catalogBrandFilter ? String(product.brandId) === catalogBrandFilter : true;
        const matchesCategory = catalogCategoryFilter
          ? String(product.categoryId) === catalogCategoryFilter
          : true;
        const matchesAvailability =
          catalogAvailability === 'all'
            ? true
            : catalogAvailability === 'available'
              ? product.stock > 5
              : catalogAvailability === 'low'
                ? product.stock > 0 && product.stock <= 5
                : product.stock <= 0;

        return matchesQuery && matchesBrand && matchesCategory && matchesAvailability;
      })
      .sort((left, right) => {
        if (catalogSort === 'price-asc') {
          return left.salePrice - right.salePrice;
        }

        if (catalogSort === 'price-desc') {
          return right.salePrice - left.salePrice;
        }

        if (catalogSort === 'name') {
          return left.nombre.localeCompare(right.nombre);
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [catalogAvailability, catalogBrandFilter, catalogCategoryFilter, catalogSearch, catalogSort, products]);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const detailContextLogo =
    productBackView === 'category-products' ? selectedCategory?.imagen : selectedBrand?.imagen;
  const detailContextAlt =
    productBackView === 'category-products' ? selectedCategory?.nombre : selectedBrand?.nombre;
  const cartItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return null;

          return {
            ...item,
            product,
            subtotal: item.quantity * product.salePrice,
          };
        })
        .filter(Boolean) as Array<{
        productId: number;
        quantity: number;
        product: ProductItem;
        subtotal: number;
      }>,
    [cart, products],
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const productGallery = selectedProduct
    ? [
        { id: 'primary' as const, label: 'Foto 1', src: selectedProduct.primaryImage },
        { id: 'secondary' as const, label: 'Foto 2', src: selectedProduct.secondaryImage },
      ].filter((image) => Boolean(image.src))
    : [];
  const currentProductImage =
    productGallery.find((image) => image.id === activeProductImage)?.src ??
    selectedProduct?.primaryImage ??
    selectedProduct?.secondaryImage ??
    null;
  const productDetailLines = (selectedProduct?.descripcion ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const activeHero = heroSlides[currentHeroSlide];
  const simulatedOrderLabel = useMemo(
    () => `ORD-${session?.user.id ?? 0}-${cartCount || 1}-${Math.round(cartTotal || 0)}`,
    [cartCount, cartTotal, session?.user.id],
  );
  const paymentCustomerLabel =
    session?.user.employee?.firstName && session.user.employee.lastName
      ? `${session.user.employee.firstName} ${session.user.employee.lastName}`
      : session?.user.username ?? 'Cliente';
  const paymentItems = cartItems.map((item) => ({
    id: item.productId,
    name: item.product.nombre,
    quantity: item.quantity,
  }));
  const selectedDeliveryZone = useMemo(
    () => deliveryZones.find((zone) => zone.value === deliveryForm.zone) ?? null,
    [deliveryForm.zone, deliveryZones],
  );
  const deliveryEstimate = useMemo<DeliveryEstimate | null>(() => {
    if (!selectedDeliveryZone) {
      return null;
    }

    return {
      zone: selectedDeliveryZone.value,
      label: selectedDeliveryZone.label,
      distanceKm: selectedDeliveryZone.distanceKm,
      minutes: selectedDeliveryZone.minutes,
      shippingCost: selectedDeliveryZone.shippingCost,
    };
  }, [selectedDeliveryZone]);
  const finalCheckoutTotal = cartTotal + (deliveryEstimate?.shippingCost ?? 0);
  const paymentCustomerWithRoute = deliveryEstimate
    ? `${paymentCustomerLabel} · ${deliveryEstimate.label}`
    : paymentCustomerLabel;
  const deliveryProductLabel =
    cartItems.length === 1
      ? cartItems[0]?.product.nombre ?? 'Producto del pedido'
      : `${cartItems.length} productos seleccionados`;
  const handleClientSessionRefresh = (nextSession: SessionData) => {
    const shouldRemember = Boolean(window.localStorage.getItem(storageKey));
    storeSession(nextSession, shouldRemember);
    onLogin(nextSession);
  };
  const userInitials = useMemo(() => {
    if (!session) {
      return 'LD';
    }

    const source =
      `${session.user.employee?.firstName ?? ''} ${session.user.employee?.lastName ?? ''}`.trim() ||
      session.user.username ||
      'Usuario';

    const parts = source.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [session]);
  const isAccountTab = view === 'account';
  const isCatalogTab = view === 'all-products';
  const isProductDetailTab = view === 'product-detail';
  const isStandaloneBrandTab = isInitialBrandProductsRoute;
  const isStandaloneCategoryTab = isInitialCategoryProductsRoute;
  const productGridClass =
    'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4';
  const isHomeNavActive = view === 'brands' && !isCatalogTab && !isProductDetailTab;
  const isCategoriesNavActive = view === 'categories' || view === 'category-products';
  const isProductsNavActive = view === 'all-products' || (view === 'product-detail' && productBackView === 'all-products');
  const isBrandsNavActive =
    view === 'brand-products' || (view === 'product-detail' && productBackView === 'brand-products');

  const navItemClass = (isActive: boolean) =>
    `group relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
        : 'text-white/74 hover:bg-white/10 hover:text-white'
    }`;
  const validatePaymentForm = (values = paymentForm) => {
    const nextErrors: PaymentFormErrors = {};
    const cardDigits = values.cardNumber.replace(/\D/g, '');
    const expiryDigits = values.expiry.replace(/\D/g, '');

    if (!values.cardholder.trim()) {
      nextErrors.cardholder = 'El nombre del titular es obligatorio.';
    }

    if (cardDigits.length !== 16) {
      nextErrors.cardNumber = 'Ingresa 16 dígitos con formato válido.';
    }

    if (expiryDigits.length !== 4) {
      nextErrors.expiry = 'Usa el formato MM/AA.';
    } else {
      const month = Number(expiryDigits.slice(0, 2));
      if (month < 1 || month > 12) {
        nextErrors.expiry = 'El mes de expiración no es válido.';
      }
    }

    if (values.cvv.length < 3 || values.cvv.length > 4) {
      nextErrors.cvv = 'Ingresa un CVV de 3 o 4 dígitos.';
    }

    return nextErrors;
  };

  const validateDeliveryForm = (values = deliveryForm) => {
    const nextErrors: DeliveryFormErrors = {};

    if (!values.recipientName.trim()) {
      nextErrors.recipientName = 'Indica quién recibirá el pedido.';
    }

    if (values.phone.replace(/\D/g, '').length < 8) {
      nextErrors.phone = 'Ingresa un teléfono válido para coordinar la entrega.';
    }

    if (!values.zone) {
      nextErrors.zone = 'Selecciona una zona de entrega.';
    }

    if (!values.address.trim()) {
      nextErrors.address = 'Escribe la dirección exacta del domicilio.';
    }

    if (!values.reference.trim()) {
      nextErrors.reference = 'Agrega una referencia para ubicar el pedido.';
    }

    return nextErrors;
  };

  const resolveImageSrc = (value?: string | null) => {
    if (!value) return '';
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `${API_URL}${value}`;
  };

  const resetCatalogFilters = () => {
    setCatalogSearch('');
    setCatalogBrandFilter('');
    setCatalogCategoryFilter('');
    setCatalogAvailability('all');
    setCatalogSort('recent');
  };

  const handleLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked, name, type, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleForgotPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordMessage('');
    setIsSubmittingForgotPassword(true);

    try {
      const payload = await requestPasswordReset(forgotPasswordEmail);
      setForgotPasswordMessage(
        payload.message ??
          'Si encontramos una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña.',
      );
    } catch (forgotErrorValue) {
      setForgotPasswordError(
        forgotErrorValue instanceof Error
          ? forgotErrorValue.message
          : 'No fue posible iniciar el proceso de restablecimiento.',
      );
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  const handleRegisterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked, name, type, value } = event.target;
    setRegisterForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePaymentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPaymentErrors((current) => ({ ...current, [name]: '' }));
    setCartMessage('');

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      setPaymentForm((current) => ({ ...current, cardNumber: formatted }));
      return;
    }

    if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      setPaymentForm((current) => ({ ...current, expiry: formatted }));
      return;
    }

    if (name === 'cvv') {
      setPaymentForm((current) => ({ ...current, cvv: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }

    setPaymentForm((current) => ({ ...current, [name]: value }));
  };

  const buildRegisterUsername = () => {
    const emailPrefix = registerForm.email.split('@')[0]?.trim().toLowerCase() ?? '';
    const nameSeed = `${registerForm.firstName}.${registerForm.lastName}`.toLowerCase();
    const rawValue = emailPrefix || nameSeed || 'cliente';
    const normalized = rawValue
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]/g, '');

    return normalized || `cliente${Date.now()}`;
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    try {
      const session = await login(loginForm.identifier, loginForm.password);
      storeSession(session, loginForm.rememberMe);
      setLoginForm({
        identifier: '',
        password: '',
        rememberMe: loginForm.rememberMe,
      });
      setIsPasswordVisible(false);
      setLoginSuccessName(session.user.username);
      setIsLoginOpen(false);
      setIsLoginSuccessOpen(true);
      window.setTimeout(() => {
        setIsLoginSuccessOpen(false);
        onLogin(session);
      }, 1400);
    } catch (loginErrorValue) {
      setLoginError(
        loginErrorValue instanceof Error ? loginErrorValue.message : 'No fue posible iniciar sesion',
      );
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterMessage('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmittingRegister(true);

    try {
      const payload = await registerCustomer({
        username: buildRegisterUsername(),
        email: registerForm.email,
        password: registerForm.password,
        fullName: `${registerForm.firstName} ${registerForm.lastName}`.trim(),
        phone: registerForm.phone,
      });
      setRegisterMessage(payload.message ?? 'Cuenta creada');
      setRegisterForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        newsletter: true,
      });
    } catch (registerErrorValue) {
      setRegisterError(
        registerErrorValue instanceof Error
          ? registerErrorValue.message
          : 'No se pudo crear la cuenta',
      );
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handleBrandOpen = (brandId: number) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('brandView', 'brand-products');
    url.searchParams.set('brandId', String(brandId));
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const handleCategoryOpen = (categoryId: number) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('categoryView', 'category-products');
    url.searchParams.set('categoryId', String(categoryId));
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const handleOpenAllProducts = () => {
    clearDetailSearchParams();
    setSelectedProductId(null);
    setIsZoomActive(false);
    setView('all-products');
  };

  const handleFooterAction = (action: FooterAction) => {
    switch (action) {
      case 'catalog':
        handleOpenAllProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      case 'brands':
        openHomeSection('brands');
        return;
      case 'categories':
        openHomeSection('categories');
        return;
      case 'recent':
        setCatalogSort('recent');
        handleOpenAllProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      case 'secure-purchase':
      case 'home-delivery':
      case 'store-pickup':
        openHomeSection('benefits');
        return;
      case 'support':
        window.location.href =
          'mailto:soporte@libreriadigitalnexus.com?subject=Soporte%20Librer%C3%ADa%20Digital%20Nexus';
        return;
      case 'register':
        setIsRegisterOpen(true);
        setIsLoginOpen(false);
        return;
      case 'login':
        setIsLoginOpen(true);
        setIsRegisterOpen(false);
        return;
      case 'cart':
        setIsCartOpen(true);
        return;
      case 'history':
        if (session?.user.role.name === 'Cliente') {
          setView('account');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setIsLoginOpen(true);
        }
        return;
      case 'about':
        openHomeSection('testimonials');
        return;
      case 'contact':
        scrollToElement(document.getElementById('footer-contacto'));
        return;
      case 'policies':
        setFooterInfoView('policies');
        return;
      case 'terms':
        setFooterInfoView('terms');
        return;
      default:
        return;
    }
  };

  const addToCart = (productId: number, quantity = 1) => {
    setCartMessage('');
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [...current, { productId, quantity }];
    });
    setIsCartOpen(true);
  };

  const changeCartQuantity = (productId: number, nextQuantity: number) => {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    clearStoredCart();
  };

  const handleDeliveryChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setDeliveryForm((current) => ({
      ...current,
      [name]: value,
    }));

    setDeliveryErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const handleBeginCheckout = () => {
    setError('');
    setCartMessage('');
    setPaymentErrors({});
    setDeliveryErrors({});

    if (!cartItems.length) {
      setCartMessage('Tu carrito esta vacio');
      return false;
    }

    if (!session) {
      setCartMessage('Debes iniciar sesion como cliente para completar la compra');
      setIsLoginOpen(true);
      return false;
    }

    if (session.user.role.name !== 'Cliente') {
      setCartMessage('La compra en linea esta disponible para cuentas de cliente');
      return false;
    }

    const sessionName =
      session.user.employee?.firstName && session.user.employee.lastName
        ? `${session.user.employee.firstName} ${session.user.employee.lastName}`.trim()
        : session.user.username;

    setDeliveryForm((current) => ({
      recipientName: current.recipientName || sessionName,
      phone: current.phone || session.user.employee?.phone || '',
      zone: current.zone,
      address: current.address,
      reference: current.reference,
    }));

    setIsCartOpen(false);
    setIsDeliveryOpen(true);
    return true;
  };

  const handleContinueToPayment = () => {
    const nextErrors = validateDeliveryForm();
    setDeliveryErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsDeliveryOpen(false);
    setIsPaymentOpen(true);
  };

  const handleCheckout = async () => {
    setError('');
    setCartMessage('');

    if (!session) {
      setCartMessage('Debes iniciar sesion como cliente para completar la compra');
      setIsPaymentOpen(false);
      setIsDeliveryOpen(false);
      setIsLoginOpen(true);
      return;
    }

    setIsCheckingOut(true);
    const minimumProcessingDelay = new Promise((resolve) => window.setTimeout(resolve, 900));

    try {
      const invoiceSnapshot: InvoiceState = {
        customerName: deliveryForm.recipientName || paymentCustomerLabel,
        deliveryAddress: deliveryForm.address,
        deliveryEta: deliveryEstimate
          ? `${deliveryEstimate.label} · ${deliveryEstimate.minutes} a ${deliveryEstimate.minutes + 15} min`
          : 'Entrega a domicilio',
        items: cartItems.map((item) => ({
          id: item.productId,
          name: item.product.nombre,
          quantity: item.quantity,
          unitPrice: item.product.salePrice,
          subtotal: item.subtotal,
        })),
        orderDate: new Date().toISOString(),
        orderId: 0,
        orderTotal: finalCheckoutTotal,
        phone: deliveryForm.phone,
        reference: deliveryForm.reference,
        shippingCost: deliveryEstimate?.shippingCost ?? 0,
        subtotal: cartTotal,
      };

      const [payload] = await Promise.all([
        createOrder(session.token, {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          delivery: {
            recipientName: deliveryForm.recipientName,
            phone: deliveryForm.phone,
            zone: deliveryEstimate?.label || deliveryForm.zone,
            address: deliveryForm.address,
            reference: deliveryForm.reference,
            shippingCost: deliveryEstimate?.shippingCost ?? 0,
            estimatedMinutes: deliveryEstimate?.minutes ?? undefined,
          },
        }),
        minimumProcessingDelay,
      ]);
      setInvoiceData({
        ...invoiceSnapshot,
        orderDate: new Date().toISOString(),
        orderId: payload.order.id,
        orderTotal: finalCheckoutTotal,
      });
      setCartMessage(
        `${payload.message}. Pedido #${payload.order.id}${
          deliveryEstimate ? `. Entrega estimada: ${deliveryEstimate.minutes} a ${deliveryEstimate.minutes + 15} min.` : ''
        }`,
      );
      clearCart();
      setIsCartOpen(false);
      setIsPaymentSuccessOpen(true);
      setDeliveryForm({
        recipientName: '',
        phone: '',
        zone: '',
        address: '',
        reference: '',
      });
      setDeliveryErrors({});
      setPaymentForm({
        cardholder: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
      });
      setPaymentFocus(undefined);
      setPaymentErrors({});
      const data = await fetchStorefront();
      setBrands(data.brands);
      setCategories(data.categories);
      setProducts(data.products);

      window.setTimeout(() => {
        setIsPaymentSuccessOpen(false);
        setIsPaymentOpen(false);
        setIsDeliveryOpen(false);
      }, 1800);
    } catch (checkoutError) {
      await minimumProcessingDelay;
      setCartMessage(
        checkoutError instanceof Error ? checkoutError.message : 'No se pudo completar la compra',
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleConfirmSimulatedPayment = async () => {
    if (isCheckingOut) {
      return;
    }

    setCartMessage('');
    const nextErrors = validatePaymentForm();
    setPaymentErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = ['cardholder', 'cardNumber', 'expiry', 'cvv'].find(
        (field) => field in nextErrors,
      );

      if (firstInvalidField) {
        window.requestAnimationFrame(() => {
          const input = document.querySelector<HTMLInputElement>(`input[name="${firstInvalidField}"]`);
          input?.focus();
        });
      }
      return;
    }

    await handleCheckout();
  };

  const loadImageAsDataUrl = (src: string) =>
    new Promise<string>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('No se pudo preparar el logo para la factura.'));
          return;
        }

        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => reject(new Error('No se pudo cargar el logo de la empresa.'));
      image.src = src;
    });

  const handleDownloadInvoice = async () => {
    if (!invoiceData) {
      return;
    }

    try {
      const pdf = new jsPDF({
        format: 'a4',
        unit: 'mm',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      const orderCode = formatInvoiceOrderCode(invoiceData.orderId, invoiceData.orderDate);
      const trackingCode = buildInvoiceTrackingCode(invoiceData.orderId, invoiceData.orderDate);
      let cursorY = 18;

      const logoDataUrl = await loadImageAsDataUrl('/libreria.png');
      const drawLabelValue = (label: string, value: string, x: number, y: number, align: 'left' | 'right' = 'left') => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(label.toUpperCase(), x, y, { align });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text(value, x, y + 6, { align });
      };

      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.8);
      pdf.line(margin, cursorY - 4, margin + 18, cursorY - 4);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text('factura', margin, cursorY + 4);

      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(margin, cursorY + 8, margin + 44, cursorY + 8);
      pdf.setLineDashPattern([], 0);

      pdf.circle(pageWidth - margin - 12, cursorY + 2, 7, 'S');
      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', pageWidth - margin - 17, cursorY - 3, 10, 10);
      }

      cursorY += 18;

      drawLabelValue('De', 'Librería Digital', margin, cursorY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(['Zona 1, Ciudad de Guatemala', '+502 2222 0000', 'soporte@libreriadigital.com'], margin, cursorY + 14);

      drawLabelValue('No. de factura', orderCode, pageWidth - margin, cursorY, 'right');
      drawLabelValue('Fecha', dateTime.format(new Date(invoiceData.orderDate)), pageWidth - margin, cursorY + 18, 'right');
      drawLabelValue('Estado', 'Pagado', pageWidth - margin, cursorY + 36, 'right');

      cursorY += 46;
      const midX = margin + contentWidth / 2 + 8;

      drawLabelValue('Facturar a', invoiceData.customerName, margin, cursorY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text([invoiceData.phone || 'Sin teléfono registrado', invoiceData.deliveryAddress], margin, cursorY + 14);

      drawLabelValue('Entrega', invoiceData.deliveryEta, midX, cursorY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text([invoiceData.deliveryAddress, invoiceData.reference || 'Sin referencia adicional'], midX, cursorY + 14);

      cursorY += 32;
      pdf.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 6;

      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, cursorY, contentWidth, 10, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(margin, cursorY, contentWidth, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('CANT.', margin + 5, cursorY + 6.5);
      pdf.text('DESCRIPCIÓN', margin + 22, cursorY + 6.5);
      pdf.text('PRECIO UNITARIO', margin + 122, cursorY + 6.5);
      pdf.text('IMPORTE', pageWidth - margin - 5, cursorY + 6.5, { align: 'right' });

      cursorY += 10;
      invoiceData.items.forEach((item, index) => {
        const rowLines = pdf.splitTextToSize(item.name, 92);
        const rowHeight = Math.max(9, rowLines.length * 5 + 2);

        if (cursorY + rowHeight > pageHeight - 55) {
          pdf.addPage();
          cursorY = 20;
        }

        if (index % 2 === 1) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, cursorY, contentWidth, rowHeight, 'F');
        }

        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, cursorY, contentWidth, rowHeight);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(String(item.quantity), margin + 7, cursorY + 5.6, { align: 'center' });
        pdf.text(rowLines, margin + 22, cursorY + 5.6);
        pdf.text(currency.format(item.unitPrice), margin + 147, cursorY + 5.6, { align: 'right' });
        pdf.text(currency.format(item.subtotal), pageWidth - margin - 5, cursorY + 5.6, { align: 'right' });
        cursorY += rowHeight;
      });

      cursorY += 8;
      pdf.setDrawColor(15, 23, 42);
      pdf.rect(pageWidth - margin - 70, cursorY, 70, 16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('TOTAL', pageWidth - margin - 64, cursorY + 10.5);
      pdf.setFontSize(16);
      pdf.text(currency.format(invoiceData.orderTotal), pageWidth - margin - 4, cursorY + 10.5, {
        align: 'right',
      });

      const footerY = pageHeight - 40;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('CONDICIONES Y FORMA DE PAGO', margin, footerY);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(
        [
          'Pago procesado en línea con conexión segura SSL.',
          'Entrega programada según cobertura y confirmación de ruta.',
          `Seguimiento: ${trackingCode}`,
        ],
        margin,
        footerY + 6,
      );

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Librería Digital', pageWidth - margin - 8, pageHeight - 22, { align: 'right' });

      pdf.save(`factura-pedido-${invoiceData.orderId}.pdf`);
    } catch (downloadError) {
      setCartMessage(
        downloadError instanceof Error
          ? downloadError.message
          : 'No se pudo generar la factura en PDF.',
      );
    }
  };

  const handleProductOpen = (
    productId: number,
    backView: 'brand-products' | 'category-products' | 'all-products' = 'brand-products',
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set('detailView', 'product-detail');
    url.searchParams.set('productId', String(productId));
    url.searchParams.set('backView', backView);

    if (selectedBrandId) {
      url.searchParams.set('brandId', String(selectedBrandId));
    } else {
      url.searchParams.delete('brandId');
    }

    if (selectedCategoryId) {
      url.searchParams.set('categoryId', String(selectedCategoryId));
    } else {
      url.searchParams.delete('categoryId');
    }

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const handleZoomMove: MouseEventHandler<HTMLDivElement> = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

    if (initialTrackingCode) {
      return <TrackingPage trackingCode={initialTrackingCode} />;
    }

    if (initialResetPasswordToken) {
      return (
        <ResetPasswordPage
          onBackToStore={() => {
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }}
          onOpenLogin={() => {
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }}
          token={initialResetPasswordToken}
        />
      );
    }

    return (
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff1ff_0%,#eef4fb_34%,#e9f2ff_70%,#eff5fc_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] bg-[linear-gradient(180deg,rgba(30,64,175,0.16),transparent_75%)]" />
      <div className="animate-float-soft pointer-events-none absolute -left-24 top-24 z-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="animate-float-delay pointer-events-none absolute right-[-80px] top-16 z-0 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 z-0 storefront-grid opacity-40" />

      <header className="sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
        <div className="mx-auto max-w-7xl rounded-[22px] border border-white/10 bg-[linear-gradient(90deg,rgba(16,30,72,0.92),rgba(33,64,154,0.88),rgba(91,33,182,0.84))] text-white shadow-[0_26px_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:rounded-[30px]">
          <div className="flex min-h-[66px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 md:min-h-[78px] md:px-5 lg:px-6">
            <button
              className="flex min-w-0 flex-1 items-center gap-3 text-left md:flex-none"
              onClick={() => {
                setView('brands');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsMobileMenuOpen(false);
                setIsAccountMenuOpen(false);
              }}
              type="button"
            >
              <NexusLogo mode="navbar" />
            </button>

            <nav className="hidden items-center justify-center md:flex">
              <div className="flex items-center gap-1 rounded-3xl border border-white/10 bg-white/8 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                <button className={navItemClass(isHomeNavActive)} onClick={() => setView('brands')} type="button">
                  <Package2 className="h-4 w-4 text-white/65 transition group-hover:text-white" />
                  <span>Inicio</span>
                  {isHomeNavActive ? <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" /> : null}
                </button>
                <span className="h-5 w-px bg-white/10" />
                <button className={navItemClass(isCategoriesNavActive)} onClick={() => setView('categories')} type="button">
                  <Grid2x2 className="h-4 w-4 text-white/65 transition group-hover:text-white" />
                  <span>Categorías</span>
                  {isCategoriesNavActive ? <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" /> : null}
                </button>
                <span className="h-5 w-px bg-white/10" />
                <button className={navItemClass(isProductsNavActive)} onClick={handleOpenAllProducts} type="button">
                  <Package2 className="h-4 w-4 text-white/65 transition group-hover:text-white" />
                  <span>Productos</span>
                  {isProductsNavActive ? <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" /> : null}
                </button>
                <span className="h-5 w-px bg-white/10" />
                <button className={navItemClass(isBrandsNavActive)} onClick={() => setView('brands')} type="button">
                  <Tags className="h-4 w-4 text-white/65 transition group-hover:text-white" />
                  <span>Marcas</span>
                  {isBrandsNavActive ? <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" /> : null}
                </button>
              </div>
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                aria-label="Buscar productos"
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all duration-300 hover:bg-white/14 active:scale-95 md:hidden"
                onClick={() => {
                  handleOpenAllProducts();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                <Search className="h-4.5 w-4.5" />
              </button>

              <button
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-0 text-sm font-medium text-white/90 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/14 hover:text-white md:h-11 md:w-auto md:gap-2 md:px-3.5"
                onClick={() => setIsCartOpen(true)}
                type="button"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                <span className="hidden lg:inline">Carrito</span>
                {cartCount ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-indigo-700 shadow-sm">
                    {cartCount}
                  </span>
                ) : null}
              </button>

              <span className="hidden h-7 w-px bg-white/10 md:block" />

              {session ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    className="inline-flex h-11 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-2.5 pr-3 text-left text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/14"
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    type="button"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] text-xs font-semibold shadow-[0_8px_16px_rgba(15,23,42,0.2)]">
                      {userInitials}
                    </span>
                    <span className="hidden min-w-0 lg:block">
                      <span className="block truncate text-sm font-medium">{isClientSession ? 'Mi cuenta' : session.user.username}</span>
                    </span>
                    <ChevronDown className={`hidden h-4 w-4 text-white/70 transition duration-300 md:block ${isAccountMenuOpen ? 'rotate-180 text-white' : ''}`} />
                  </button>

                  {isAccountMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-20 w-[260px] overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-2 text-slate-900 shadow-[0_28px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">{session.user.username}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">{session.user.email}</div>
                      </div>
                      <div className="mt-2 grid gap-1">
                        {isClientSession ? (
                          <button
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                            onClick={() => {
                              setView('account');
                              setIsAccountMenuOpen(false);
                            }}
                            type="button"
                          >
                            <UserCircle2 className="h-4 w-4 text-slate-500" />
                            Mi cuenta
                          </button>
                        ) : null}
                        <button
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            onLogout?.();
                          }}
                          type="button"
                        >
                          <LogOut className="h-4 w-4 text-slate-500" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <button
                    className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-medium text-white/85 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
                    onClick={() => setIsRegisterOpen(true)}
                    type="button"
                  >
                    Registrarse
                  </button>
                  <button
                    className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50"
                    onClick={() => setIsLoginOpen(true)}
                    type="button"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}

              {session ? (
                <button
                  className="inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all duration-300 hover:bg-white/14 md:hidden"
                  onClick={() => {
                    if (isClientSession) {
                      setView('account');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[11px] font-semibold">
                    {userInitials}
                  </span>
                </button>
              ) : null}

              <button
                aria-label="Abrir menú"
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all duration-300 hover:bg-white/14 active:scale-95 md:hidden"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isMobileMenuOpen ? (
            <div className="border-t border-white/10 px-4 pb-4 pt-3 md:hidden">
              <div className="rounded-[26px] border border-white/10 bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <div className="grid gap-1.5">
                  <button
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setView('brands');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <Package2 className="h-4 w-4" />
                    Inicio
                  </button>
                  <button
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setView('categories');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <Grid2x2 className="h-4 w-4" />
                    Categorías
                  </button>
                  <button
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      handleOpenAllProducts();
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <Package2 className="h-4 w-4" />
                    Productos
                  </button>
                  <button
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setView('brands');
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <Tags className="h-4 w-4" />
                    Marcas
                  </button>
                </div>

                <div className="my-3 h-px bg-white/10" />

                {session ? (
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-white">
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold">
                        {userInitials}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{session.user.username}</div>
                        <div className="truncate text-xs text-white/65">{session.user.email}</div>
                      </div>
                    </div>

                    {isClientSession ? (
                      <button
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setView('account');
                          setIsMobileMenuOpen(false);
                        }}
                        type="button"
                      >
                        <UserCircle2 className="h-4 w-4" />
                        Mi cuenta
                      </button>
                    ) : null}

                    <button
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        onLogout?.();
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-medium text-white/85 transition hover:bg-white/12 hover:text-white"
                      onClick={() => {
                        setIsRegisterOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                    >
                      Registrarse
                    </button>
                    <button
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                      onClick={() => {
                        setIsLoginOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                    >
                      Iniciar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main
        className={`relative z-10 mx-auto grid gap-6 ${
          isAccountTab
            ? 'w-full max-w-none px-0 py-0'
            : 'max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:gap-10 lg:py-10'
        }`}
      >
        {isAccountTab && session ? (
          <CustomerDashboardPage
            onBackToStore={() => setView('brands')}
            onSessionRefresh={handleClientSessionRefresh}
            session={session}
          />
        ) : (
          <>
        {!isCatalogTab && !isProductDetailTab && !isStandaloneCategoryTab && !isStandaloneBrandTab ? (
        <Card className="order-1 overflow-hidden rounded-[30px] border border-white/70 bg-white/78 shadow-[0_35px_90px_rgba(15,23,42,0.08)] sm:rounded-[40px]" id="benefits-section" ref={benefitsSectionRef}>
          <div className="grid gap-4 p-3 sm:p-4 md:p-6">
            <motion.div
              className="group relative overflow-hidden rounded-[30px] bg-slate-100 shadow-[0_30px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80"
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.img
                key={activeHero.id}
                alt={`Publicidad ${currentHeroSlide + 1}`}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[210px] w-full object-cover object-center transition duration-700 group-hover:scale-[1.025] sm:h-[260px] md:h-[420px] xl:h-[550px]"
                initial={{ opacity: 0.88, scale: 1.02 }}
                src={activeHero.image}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.08),transparent_34%,rgba(15,23,42,0.18))]" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.62))] md:hidden" />
              <div className="animate-shimmer-pan pointer-events-none absolute inset-y-0 left-[-18%] w-[28%] -skew-x-12 bg-white/10 blur-2xl" />

              <div className="absolute left-4 top-4 md:hidden">
                <span className="inline-flex rounded-full bg-white/92 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900 shadow-[0_10px_20px_rgba(15,23,42,0.16)]">
                  Lanzamientos
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 md:hidden">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[1.35rem] font-black leading-7 tracking-[-0.04em] text-white">
                      Compra online
                    </div>
                    <p className="mt-1 text-xs text-white/82">
                      Explora novedades y encuentra productos en minutos.
                    </p>
                  </div>
                  <button
                    className="shrink-0 rounded-full bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-4 py-2 text-xs font-bold text-white shadow-[0_14px_24px_rgba(249,115,22,0.3)]"
                    onClick={handleOpenAllProducts}
                    type="button"
                  >
                    Ver catálogo
                  </button>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 flex items-center gap-2 sm:bottom-5 sm:left-5 md:bottom-7 md:left-7">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    aria-label={`Ir a publicidad ${index + 1}`}
                    className={`rounded-full transition ${
                      currentHeroSlide === index
                        ? 'h-2.5 w-8 bg-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.18)]'
                        : 'h-2.5 w-2.5 bg-white/70 hover:bg-white'
                    }`}
                    onClick={() => setCurrentHeroSlide(index)}
                    type="button"
                  />
                ))}
              </div>

              <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 overflow-hidden rounded-l-[28px] border border-white/70 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur md:grid">
                <button
                  className="grid h-16 w-14 place-items-center border-b border-slate-200 text-3xl text-slate-700 transition hover:bg-slate-50"
                  onClick={() =>
                    setCurrentHeroSlide((current) =>
                      current === 0 ? heroSlides.length - 1 : current - 1,
                    )
                  }
                  type="button"
                >
                  ←
                </button>
                <button
                  className="grid h-16 w-14 place-items-center text-3xl text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setCurrentHeroSlide((current) => (current + 1) % heroSlides.length)}
                  type="button"
                >
                  →
                </button>
              </div>

              <button
                className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-6 py-2.5 text-sm font-semibold text-slate-800 shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-x-1/2 hover:-translate-y-0.5 hover:bg-white md:inline-flex"
                onClick={handleOpenAllProducts}
                type="button"
              >
                Ver productos
              </button>
            </motion.div>

            <div className="mt-3 flex items-center justify-center gap-2 md:hidden">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={() =>
                  setCurrentHeroSlide((current) =>
                    current === 0 ? heroSlides.length - 1 : current - 1,
                  )
                }
                type="button"
              >
                ←
              </button>
              <div className="inline-flex min-w-[110px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                {currentHeroSlide + 1} / {heroSlides.length}
              </div>
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={() => setCurrentHeroSlide((current) => (current + 1) % heroSlides.length)}
                type="button"
              >
                →
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
            {[
              'Envío gratis',
              'Compra segura',
              'Recoge en tienda',
              'Atención rápida',
            ].map((item) => (
              <span
                key={item}
                className="inline-flex shrink-0 items-center rounded-full border border-sky-200/70 bg-white px-4 py-2 text-xs font-semibold tracking-[0.02em] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="hidden gap-4 bg-[linear-gradient(90deg,#1297ea,#2563eb_52%,#1d4ed8)] px-5 py-6 text-white md:grid md:grid-cols-2 md:px-8 xl:grid-cols-4">
            <article className="rounded-[24px] border border-white/15 bg-white/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-1">
              <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/85 bg-white/8">
                <svg aria-hidden="true" className="h-7 w-7 fill-white" viewBox="0 0 24 24">
                  <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h8.5A1.75 1.75 0 0 1 15 6.75V8h2.43c.63 0 1.2.34 1.5.89l1.82 3.28c.16.29.25.61.25.94v2.14A1.75 1.75 0 0 1 19.25 17H18a2.75 2.75 0 1 1-5.5 0H10a2.75 2.75 0 1 1-5.5 0h-.75A1.75 1.75 0 0 1 2 15.25v-1.5h1V6.75Zm1.5 0v8.75h.26a2.75 2.75 0 0 1 5.48 0h2.52a2.75 2.75 0 0 1 5.48 0h1.26v-2.1L17.06 9.5H15v4h-1.5V6.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM7.5 17a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm8 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
                </svg>
              </span>
              <div>
                <strong className="block text-2xl font-bold">Envío Gratis</strong>
                <p className="mt-1 text-sm text-white/92">en compras mayores a Q100, en zonas de cobertura</p>
              </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-white/15 bg-white/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-1">
              <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/85 bg-white/8">
                <svg aria-hidden="true" className="h-7 w-7 fill-white" viewBox="0 0 24 24">
                  <path d="M4 9.25 6.4 4h11.2L20 9.25V11a2 2 0 0 1-1 1.73V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6.27A2 2 0 0 1 4 11V9.25Zm1.65 0h12.7l-1.03-2.25H6.68L5.65 9.25ZM9 12.75V19h6v-6.25l-.3.15a3.44 3.44 0 0 1-3.4 0l-.3-.15Zm-2.5.02V19H7.5v-6.48c-.34-.03-.67-.11-.98-.23Zm11 0c-.31.12-.64.2-.98.23V19h.98v-6.23ZM6 10.75c0 .55.45 1 1 1 .2 0 .4-.06.56-.17l1.19-.79 1.27.85a2 2 0 0 0 2.2 0l1.27-.85 1.19.79A1 1 0 0 0 16 10.75V10H6v.75Z" />
                </svg>
              </span>
              <div>
                <strong className="block text-2xl font-bold">Compra en línea</strong>
                <p className="mt-1 text-sm text-white/92">recoge en tienda</p>
              </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-white/15 bg-white/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-1">
              <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/85 bg-white/8">
                <svg aria-hidden="true" className="h-7 w-7 fill-white" viewBox="0 0 24 24">
                  <path d="M12 3 5 5.6v5.62c0 4.4 2.83 8.32 7 9.78 4.17-1.46 7-5.38 7-9.78V5.6L12 3Zm0 1.6 5.5 2.03v4.59c0 3.64-2.26 6.92-5.5 8.3-3.24-1.38-5.5-4.66-5.5-8.3V6.63L12 4.6Zm-.75 3.65v3.5H8.5v1.5h2.75V16h1.5v-2.75h2.75v-1.5h-2.75v-3.5h-1.5Z" />
                </svg>
              </span>
              <div>
                <strong className="block text-2xl font-bold">Compra Segura</strong>
                <p className="mt-1 text-sm text-white/92">Sitio protegido</p>
              </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-white/15 bg-white/8 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition hover:-translate-y-1">
              <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/85 bg-white/8">
                <svg aria-hidden="true" className="h-7 w-7 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2.75 4 6.82v10.36l8 4.07 8-4.07V6.82l-8-4.07Zm0 1.68 5.97 3.04L12 10.5 6.03 7.47 12 4.43ZM5.5 8.7l5.75 2.93v7.7L5.5 16.4V8.7Zm7.25 10.63v-7.7L18.5 8.7v7.7l-5.75 2.93Z" />
                </svg>
              </span>
              <div>
                <strong className="block text-2xl font-bold">Envíos Seguros</strong>
                <p className="mt-1 text-sm text-white/92">Recibe en tu casa u oficina</p>
              </div>
              </div>
            </article>
          </div>
        </Card>
        ) : null}

        {!isProductDetailTab && !isStandaloneCategoryTab && !isStandaloneBrandTab ? (
        <Card className="order-3 px-3 py-5 sm:px-6 sm:py-8" id="featured-products-section" ref={featuredProductsSectionRef}>
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-[1.45rem] font-extrabold tracking-[-0.04em] text-slate-950">Productos destacados</h2>
                <p className="mt-1 text-xs text-slate-500">Listos para comprar</p>
              </div>
              <button
                className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-[0_10px_18px_rgba(15,23,42,0.05)]"
                onClick={handleOpenAllProducts}
                type="button"
              >
                Ver todo
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <SectionTitle
              actions={
                <Button onClick={handleOpenAllProducts} variant="cta">
                  Ver productos +
                </Button>
              }
              description="Una selección compacta y visual de productos destacados para descubrir el catálogo más rápido."
              eyebrow="Selección destacada"
              title="Productos recomendados"
            />
          </div>

          <div className="mt-8">
            {featuredProducts.length ? (
              <div className={productGridClass}>
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    compact
                    imageSrc={resolveImageSrc(product.primaryImage)}
                    onAddToCart={(productId) => addToCart(productId, 1)}
                    onViewProduct={(productId) => handleProductOpen(productId)}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                description="Registra marcas y productos para poblar esta vitrina destacada."
                title="Aún no hay productos recomendados"
              />
            )}
          </div>
        </Card>
        ) : null}
        {!isProductDetailTab && (view === 'brands' || view === 'brand-products' || view === 'all-products') ? (
        <Card className="order-4 px-6 py-8" id="brands-section" ref={brandsSectionRef}>
          {error ? <p className="error-message">{error}</p> : null}

          {isLoading ? (
            <div className="empty-state compact">
              <strong>Cargando marcas y productos...</strong>
            </div>
          ) : visibleBrands.length ? (
            <>
              {view === 'brands' ? (
                <>
                  <SectionTitle
                    align="center"
                    eyebrow="Marcas"
                    title="Compra por marca"
                    description="Logos uniformes, interacción más limpia y acceso rápido al catálogo de cada marca."
                  />

                      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:overflow-visible">
                        {visibleBrands.map((brand) => (
                          <button
                            key={brand.id}
                            onClick={() => handleBrandOpen(brand.id)}
                            type="button"
                        className="group relative flex h-[148px] w-[148px] shrink-0 snap-start items-center justify-center overflow-hidden rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-4 text-center shadow-[0_16px_38px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_24px_52px_rgba(37,99,235,0.12)]"
                      >
                        <div className="grid h-[74px] w-full place-items-center overflow-hidden rounded-2xl">
                          {brand.imagen ? (
                            <img
                              alt={brand.nombre}
                              className="max-h-full w-full object-contain transition duration-300 group-hover:scale-105"
                              src={resolveImageSrc(brand.imagen)}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-slate-500">{brand.nombre}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : view === 'brand-products' ? (
                <div className="mt-2">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <button
                        className="mb-3 inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        onClick={() => {
                          if (isStandaloneBrandTab) {
                            window.location.href = '/';
                            return;
                          }

                          setView('brands');
                        }}
                        type="button"
                      >
                        ← {isStandaloneBrandTab ? 'Volver a la tienda' : 'Volver a marcas'}
                      </button>
                      <h2 className="text-3xl font-bold uppercase tracking-wide text-blue-900">
                        {selectedBrand?.nombre ?? 'Marca'}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Productos registrados para esta marca.
                      </p>
                    </div>
                    {detailContextLogo ? (
                      <div className="grid h-20 w-44 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                        <img
                          alt={detailContextAlt ?? 'Contexto del producto'}
                          className="max-h-full w-full object-contain"
                          src={resolveImageSrc(detailContextLogo)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div />
                    <Badge tone="primary">{brandProducts.length} productos</Badge>
                  </div>

                  {brandProducts.length ? (
                    <div className={productGridClass}>
                      {brandProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          imageSrc={resolveImageSrc(product.primaryImage)}
                          onAddToCart={(productId) => addToCart(productId, 1)}
                          onViewProduct={(productId) => handleProductOpen(productId, 'brand-products')}
                          product={product}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      description="Asigna productos a la marca para mostrarlos aquí."
                      title="Esta marca todavía no tiene productos"
                    />
                  )}
                </div>
              ) : view === 'all-products' ? (
                <div className="mt-2">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <button
                        className="mb-3 inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        onClick={() => setView('brands')}
                        type="button"
                      >
                        ← Volver al inicio
                      </button>
                      <h2 className="text-3xl font-bold uppercase tracking-wide text-blue-900">
                        Todos los productos
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Se muestra el catálogo completo disponible en la tienda.
                      </p>
                    </div>
                    <Badge tone="primary">{filteredCatalogProducts.length} productos</Badge>
                  </div>

                  {products.length ? (
                    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                      <Card className="hidden h-fit p-5 lg:block">
                        <SectionTitle
                          eyebrow="Filtros"
                          title="Catálogo"
                          description="Busca, ordena y filtra por categoría, marca o disponibilidad."
                        />
                        <div className="mt-5 grid gap-4">
                          <Input label="Buscar producto" onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Nombre, marca o categoría" value={catalogSearch} />
                          <Select label="Marca" onChange={(event) => setCatalogBrandFilter(event.target.value)} value={catalogBrandFilter}>
                            <option value="">Todas las marcas</option>
                            {visibleBrands.map((brand) => (
                              <option key={brand.id} value={String(brand.id)}>
                                {brand.nombre}
                              </option>
                            ))}
                          </Select>
                          <Select label="Categoría" onChange={(event) => setCatalogCategoryFilter(event.target.value)} value={catalogCategoryFilter}>
                            <option value="">Todas las categorías</option>
                            {visibleCategories.map((category) => (
                              <option key={category.id} value={String(category.id)}>
                                {category.nombre}
                              </option>
                            ))}
                          </Select>
                          <Select label="Disponibilidad" onChange={(event) => setCatalogAvailability(event.target.value as 'all' | 'available' | 'low' | 'out')} value={catalogAvailability}>
                            <option value="all">Todas</option>
                            <option value="available">En stock</option>
                            <option value="low">Stock bajo</option>
                            <option value="out">Agotados</option>
                          </Select>
                          <Select label="Ordenar por" onChange={(event) => setCatalogSort(event.target.value as 'recent' | 'price-asc' | 'price-desc' | 'name')} value={catalogSort}>
                            <option value="recent">Más recientes</option>
                            <option value="price-asc">Precio más bajo</option>
                            <option value="price-desc">Precio más alto</option>
                            <option value="name">Nombre</option>
                          </Select>
                          <Button onClick={resetCatalogFilters} variant="secondary">
                            Limpiar filtros
                          </Button>
                        </div>
                      </Card>

                      <div className="grid gap-5">
                        <div className="flex items-center justify-between gap-3 lg:hidden">
                          <Button onClick={() => setIsFiltersDrawerOpen(true)} variant="secondary">
                            Filtros
                          </Button>
                          <Badge tone="neutral">
                            {catalogSort === 'recent'
                              ? 'Recientes'
                              : catalogSort === 'price-asc'
                                ? 'Precio menor'
                                : catalogSort === 'price-desc'
                                  ? 'Precio mayor'
                                  : 'Nombre'}
                          </Badge>
                        </div>

                        {filteredCatalogProducts.length ? (
                          <div className={productGridClass}>
                            {filteredCatalogProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                imageSrc={resolveImageSrc(product.primaryImage)}
                                onAddToCart={(productId) => addToCart(productId, 1)}
                                onViewProduct={(productId) => handleProductOpen(productId, 'all-products')}
                                product={product}
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            description="Prueba con otros filtros o registra productos para poblar este catálogo."
                            title="No encontramos productos con esos filtros"
                            action={
                              <Button onClick={resetCatalogFilters} variant="secondary">
                                Limpiar filtros
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      description="Agrega productos para mostrarlos en este catálogo."
                      title="Aún no hay productos registrados"
                    />
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state compact">
              <strong>Aun no hay marcas con productos.</strong>
              <span>Crea marcas y productos para mostrarlos en la portada principal.</span>
            </div>
          )}
        </Card>
        ) : null}

        {isProductDetailTab ? (
          <Card className="order-2 px-6 py-8">
            <div className="mt-2">
              <div className="mb-8 rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)] md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1">
                    <button
                      className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      onClick={() => setView(productBackView)}
                      type="button"
                    >
                      ← Volver a productos
                    </button>

                    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>Inicio</span>
                      <span>→</span>
                      <span>{productBackView === 'category-products' ? 'Categoría' : 'Marca'}</span>
                      <span>→</span>
                      <span className="font-medium text-slate-700">
                        {productBackView === 'category-products'
                          ? selectedCategory?.nombre ?? 'Categoría'
                          : selectedBrand?.nombre ?? 'Marca'}
                      </span>
                      <span>→</span>
                      <span className="max-w-[520px] truncate font-medium text-blue-900">
                        {selectedProduct?.nombre ?? 'Producto'}
                      </span>
                    </div>

                    <h2 className="text-[2.15rem] font-black uppercase leading-tight tracking-[0.02em] text-blue-900 md:text-[2.7rem]">
                      {selectedProduct?.nombre ?? 'Producto'}
                    </h2>
                    <div className="mt-4 h-[3px] w-24 rounded-full bg-amber-400" />
                  </div>

                  {detailContextLogo ? (
                    <div className="grid h-24 w-44 place-items-center overflow-hidden rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                      <img
                        alt={detailContextAlt ?? 'Marca'}
                        className="max-h-full w-full object-contain"
                        src={resolveImageSrc(detailContextLogo)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedProduct ? (
                <div className="grid gap-6 xl:grid-cols-[78px_minmax(0,1fr)]">
                  <div className="grid content-start gap-3">
                    {productGallery.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => {
                          setActiveProductImage(image.id);
                          setIsZoomActive(false);
                        }}
                        type="button"
                        className={`grid h-[84px] w-[66px] place-items-center overflow-hidden rounded-xl border bg-white transition ${
                          activeProductImage === image.id
                            ? 'border-blue-500 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          alt={image.label}
                          className="h-full w-full object-contain p-1"
                          src={resolveImageSrc(image.src)}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-8 xl:grid-cols-[minmax(360px,1fr)_minmax(320px,0.94fr)]">
                    <div
                      className="relative grid min-h-[540px] place-items-center overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
                      onMouseEnter={() => setIsZoomActive(true)}
                      onMouseLeave={() => setIsZoomActive(false)}
                      onMouseMove={handleZoomMove}
                    >
                      {currentProductImage ? (
                        <>
                          <img
                            alt={selectedProduct.nombre}
                            className="max-h-[480px] w-full object-contain transition duration-150 ease-out"
                            src={resolveImageSrc(currentProductImage)}
                            style={{
                              transform: isZoomActive ? 'scale(2)' : 'scale(1)',
                              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            }}
                          />
                          {isZoomActive ? (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_120px,rgba(255,255,255,0.08)_121px,rgba(255,255,255,0.08)_122px,transparent_123px)]"
                              style={{
                                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                              }}
                            />
                          ) : null}
                          <div className="pointer-events-none absolute bottom-5 right-5 rounded-full bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-white">
                            Pasa el cursor para ampliar
                          </div>
                        </>
                      ) : (
                        <div className="grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-400">
                          Sin imagen disponible
                        </div>
                      )}
                    </div>

                    <div className="grid content-start gap-6">
                      <div className="border-b border-slate-200 pb-5">
                        <div className="flex gap-5 text-sm font-semibold uppercase tracking-wide text-slate-700">
                          <span className="border-b-2 border-amber-400 pb-3 text-slate-900">Descripción</span>
                          <span className="pb-3 text-slate-400">Detalles</span>
                        </div>
                      </div>

                      <div className="space-y-4 text-[1.02rem] leading-8 text-slate-700">
                        {productDetailLines.length ? (
                          <>
                            <p>{productDetailLines[0]}</p>
                            {productDetailLines.length > 1 ? (
                              <ul className="list-disc space-y-1 pl-5">
                                {productDetailLines.slice(1).map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                            ) : null}
                          </>
                        ) : (
                          <p>Este producto aún no tiene una descripción detallada registrada.</p>
                        )}
                      </div>

                      <div className="grid gap-4 border-t border-blue-200 pt-6 md:grid-cols-[minmax(0,1fr)_164px]">
                        <div className="grid gap-3">
                          <div className="text-[3rem] font-black leading-none text-blue-900">
                            {currency.format(selectedProduct.salePrice)}
                          </div>
                          <div
                            className={`text-sm font-semibold uppercase tracking-[0.16em] ${
                              selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {selectedProduct.stock > 0 ? 'Disponible' : 'No disponible'}
                          </div>
                          <div className="space-y-1 text-sm text-slate-500">
                            <div>Marca: {selectedProduct.brandName}</div>
                            <div>SKU: {selectedProduct.id}</div>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 shadow-sm">
                          <div className="font-semibold text-slate-700">{selectedProduct.subcategoryName}</div>
                          <div className="mt-2">Modelo: {selectedProduct.id}</div>
                          <div className="mt-2">{selectedProduct.categoryName}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[84px_minmax(0,1fr)_minmax(0,0.7fr)]">
                        <div className="flex h-[56px] items-center justify-center rounded-[12px] border border-slate-300 bg-white text-lg font-semibold text-slate-700">
                          1
                        </div>
                        <button
                          className={`rounded-[12px] px-4 py-3 text-sm font-bold uppercase tracking-[0.05em] text-white transition ${
                            selectedProduct.stock > 0
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'cursor-not-allowed bg-slate-300'
                          }`}
                          onClick={() => addToCart(selectedProduct.id, 1)}
                          disabled={selectedProduct.stock <= 0}
                          type="button"
                        >
                          Añadir al carro
                        </button>
                        <button
                          className="rounded-[12px] bg-blue-600 px-4 py-3 text-sm font-bold uppercase tracking-[0.05em] text-white transition hover:bg-blue-700"
                          onClick={() => addToCart(selectedProduct.id, 1)}
                          type="button"
                        >
                          Comprar ahora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state compact">
                  <strong>No se pudo cargar el detalle del producto.</strong>
                </div>
              )}
            </div>
          </Card>
        ) : null}

        {!isCatalogTab && !isProductDetailTab && !isStandaloneBrandTab ? (
          <Card className="order-2 rounded-[34px] border border-white/70 bg-white/85 px-4 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6 sm:py-8" id="categories-section" ref={categoriesSectionRef}>
            {isLoading ? (
              <div className="empty-state compact">
                <strong>Cargando categorías y productos...</strong>
              </div>
            ) : visibleCategories.length ? (
              <>
                {view === 'categories' || view === 'brands' || view === 'brand-products' ? (
                  <>
                  <div className="md:hidden text-center">
                    <h2 className="text-[1.95rem] font-extrabold tracking-[-0.04em] text-slate-950">Categorías</h2>
                    <p className="mt-2 text-sm text-slate-500">Explora el catálogo por tipo de producto.</p>
                  </div>

                  <div className="hidden md:block">
                    <SectionTitle
                      align="center"
                      eyebrow="Categorías"
                      title="Compra por categoría"
                      description="Agrupa los productos de forma visual y clara para una exploración mucho más rápida."
                    />
                  </div>

                    <div className="mt-6 flex snap-x gap-3 overflow-x-auto pb-2 md:mt-8 md:grid md:gap-4 md:overflow-visible md:pb-0 sm:grid-cols-2 xl:grid-cols-4">
                      {visibleCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryOpen(category.id)}
                          type="button"
                          className="group relative flex min-h-[124px] min-w-[96px] shrink-0 snap-start flex-col items-center justify-start overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-3 py-4 text-center shadow-[0_16px_38px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_24px_52px_rgba(14,165,233,0.12)] md:min-h-[220px] md:min-w-0 md:justify-center md:px-4 md:py-5"
                        >
                          <div className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-sky-50/70 md:h-[102px] md:w-[102px] md:ring-8">
                            {category.imagen ? (
                              <img
                                alt={category.nombre}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                src={resolveImageSrc(category.imagen)}
                              />
                            ) : (
                              <span className="px-3 text-xs font-semibold text-slate-500">
                                {category.nombre}
                              </span>
                            )}
                          </div>
                          <strong className="mt-3 text-xs font-bold uppercase leading-5 tracking-[0.08em] text-blue-950 md:mt-4 md:text-[1.05rem] md:leading-6 md:tracking-[0.04em]">
                            {category.nombre}
                          </strong>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {view === 'category-products' ? (
                  <div className="mt-2">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <button
                          className="mb-3 inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                          onClick={() => {
                            if (isStandaloneCategoryTab) {
                              window.location.href = '/';
                              return;
                            }

                            setView('categories');
                          }}
                          type="button"
                        >
                          ← {isStandaloneCategoryTab ? 'Volver a la tienda' : 'Volver a categorías'}
                        </button>
                        <h2 className="text-3xl font-bold uppercase tracking-wide text-blue-900">
                          {selectedCategory?.nombre ?? 'Categoría'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                          Productos registrados para esta categoría.
                        </p>
                      </div>
                      {selectedCategory?.imagen ? (
                        <div className="grid h-20 w-44 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                          <img
                            alt={selectedCategory.nombre}
                            className="max-h-full w-full object-contain"
                            src={resolveImageSrc(selectedCategory.imagen)}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div />
                      <Badge tone="primary">{categoryProducts.length} productos</Badge>
                    </div>

                    {categoryProducts.length ? (
                      <div className={productGridClass}>
                        {categoryProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            imageSrc={resolveImageSrc(product.primaryImage)}
                            onAddToCart={(productId) => addToCart(productId, 1)}
                            onViewProduct={(productId) => handleProductOpen(productId, 'category-products')}
                            product={product}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        description="Asigna productos a esta categoría para mostrarlos aquí."
                        title="Esta categoría todavía no tiene productos"
                      />
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState
                description="Crea categorías y productos para mostrarlos en la portada principal."
                title="Aún no hay categorías con productos"
              />
            )}
          </Card>
        ) : null}

          {!isCatalogTab && !isProductDetailTab && !isStandaloneCategoryTab && !isStandaloneBrandTab ? (
            <Card className="order-5 px-6 py-8" id="testimonials-section" ref={testimonialsSectionRef}>
              <SectionTitle
                align="center"
                eyebrow="Testimonios"
                title="¡Conoce lo que dicen nuestros clientes!"
                description="Comentarios reales que refuerzan confianza, atención y experiencia de compra."
              />

              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {testimonials.map((testimonial) => (
                  <article
                    key={testimonial.id}
                    className="flex w-full flex-col items-center rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-8 text-center shadow-[0_20px_48px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(37,99,235,0.10)] lg:max-w-[340px]"
                  >
                    <img
                      alt={testimonial.name}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50"
                      src={testimonial.image}
                    />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{testimonial.name}</h3>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>

                    <div className="mt-4 flex items-center justify-center gap-1 text-[#ff532e]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg key={index} width="16" height="15" viewBox="0 0 16 15" fill="none">
                          <path
                            d="M7.524.464a.5.5 0 0 1 .952 0l1.432 4.41a.5.5 0 0 0 .476.345h4.637a.5.5 0 0 1 .294.904L11.563 8.85a.5.5 0 0 0-.181.559l1.433 4.41a.5.5 0 0 1-.77.559L8.294 11.65a.5.5 0 0 0-.588 0l-3.751 2.726a.5.5 0 0 1-.77-.56l1.433-4.41a.5.5 0 0 0-.181-.558L.685 6.123A.5.5 0 0 1 .98 5.22h4.637a.5.5 0 0 0 .476-.346z"
                            fill="currentColor"
                          />
                        </svg>
                      ))}
                    </div>

                    <p className="mt-4 text-[15px] leading-7 text-slate-500">{testimonial.text}</p>
                  </article>
                ))}
              </div>
            </Card>
          ) : null}
          </>
        )}
      </main>

      {!isAccountTab && !isCartOpen && cartCount > 0 ? (
        <div className="fixed inset-x-3 bottom-4 z-30 md:hidden">
          <button
            className="flex w-full items-center justify-between rounded-[24px] bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] px-4 py-3 text-white shadow-[0_22px_50px_rgba(37,99,235,0.3)]"
            onClick={() => setIsCartOpen(true)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/14">
                <ShoppingCart className="h-4.5 w-4.5" />
              </span>
              <div className="text-left">
                <div className="text-sm font-bold">Ver carrito</div>
                <div className="text-xs text-white/80">{cartCount} producto(s)</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/70">Total</div>
              <div className="text-base font-black">{currency.format(cartTotal)}</div>
            </div>
          </button>
        </div>
      ) : null}

      <Drawer
        isOpen={isFiltersDrawerOpen}
        onClose={() => setIsFiltersDrawerOpen(false)}
        title="Filtros del catálogo"
        actions={
          <Button
            className="px-3"
            onClick={() => {
              resetCatalogFilters();
              setIsFiltersDrawerOpen(false);
            }}
            size="sm"
            variant="secondary"
          >
            Limpiar
          </Button>
        }
      >
        <div className="grid gap-4">
          <Input
            label="Buscar producto"
            onChange={(event) => setCatalogSearch(event.target.value)}
            placeholder="Nombre, marca o categoría"
            value={catalogSearch}
          />
          <Select
            label="Marca"
            onChange={(event) => setCatalogBrandFilter(event.target.value)}
            value={catalogBrandFilter}
          >
            <option value="">Todas las marcas</option>
            {visibleBrands.map((brand) => (
              <option key={brand.id} value={String(brand.id)}>
                {brand.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Categoría"
            onChange={(event) => setCatalogCategoryFilter(event.target.value)}
            value={catalogCategoryFilter}
          >
            <option value="">Todas las categorías</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Disponibilidad"
            onChange={(event) => setCatalogAvailability(event.target.value as 'all' | 'available' | 'low' | 'out')}
            value={catalogAvailability}
          >
            <option value="all">Todas</option>
            <option value="available">En stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotados</option>
          </Select>
          <Select
            label="Ordenar por"
            onChange={(event) => setCatalogSort(event.target.value as 'recent' | 'price-asc' | 'price-desc' | 'name')}
            value={catalogSort}
          >
            <option value="recent">Más recientes</option>
            <option value="price-asc">Precio más bajo</option>
            <option value="price-desc">Precio más alto</option>
            <option value="name">Nombre</option>
          </Select>
          <Button onClick={() => setIsFiltersDrawerOpen(false)} variant="primary">
            Aplicar filtros
          </Button>
        </div>
      </Drawer>

      {!isAccountTab ? <Footer onAction={handleFooterAction} /> : null}

      {footerInfoView ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md"
          role="dialog"
        >
          <div className="w-full max-w-[640px] rounded-[30px] border border-white/70 bg-white/96 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  {footerInfoView === 'policies' ? 'Políticas' : 'Términos'}
                </div>
                <h3 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
                  {footerInfoView === 'policies'
                    ? 'Políticas de compra y entrega'
                    : 'Términos y condiciones'}
                </h3>
              </div>
              <button
                className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                onClick={() => setFooterInfoView(null)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 text-sm leading-7 text-slate-600">
              {footerInfoView === 'policies' ? (
                <>
                  <p>
                    Todas las compras están sujetas a disponibilidad de inventario, validación de
                    pago y cobertura de entrega dentro del área metropolitana de Guatemala.
                  </p>
                  <p>
                    Los tiempos de envío son estimados y pueden variar según zona, volumen de
                    pedidos y horario de atención. Si un producto requiere confirmación, nuestro
                    equipo de soporte te contactará antes del despacho.
                  </p>
                  <p>
                    Para aclaraciones sobre cambios, facturación o atención postventa, puedes
                    escribir a{' '}
                    <a
                      className="font-semibold text-blue-600 hover:text-blue-700"
                      href="mailto:soporte@libreriadigitalnexus.com"
                    >
                      soporte@libreriadigitalnexus.com
                    </a>
                    .
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Al utilizar Librería Digital Nexus aceptas proporcionar información válida para
                    procesar tus pedidos, pagos y entregas. Los datos se usan únicamente para fines
                    operativos, de seguimiento y soporte al cliente.
                  </p>
                  <p>
                    El cliente es responsable de verificar dirección, teléfono, correo y productos
                    antes de confirmar la compra. Una vez aprobado el pago, el pedido entra al
                    flujo de preparación y entrega correspondiente.
                  </p>
                  <p>
                    Si necesitas ayuda con una orden, factura o entrega, nuestro equipo puede
                    asistirte por correo o WhatsApp dentro del horario publicado en la tienda.
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(37,99,235,0.28)]"
                onClick={() => setFooterInfoView(null)}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLoginOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="w-full max-w-[460px] rounded-[28px] border border-white/60 bg-white/96 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] shadow-[0_12px_24px_rgba(37,99,235,0.08)]">
                  <img alt="Librería Digital Nexus" className="h-9 w-auto object-contain" src="/libreria.png" />
                </div>
                <div>
                  <h2 className="text-[1.9rem] font-bold tracking-[-0.03em] text-slate-950">Iniciar sesión</h2>
                  <p className="mt-1 text-sm text-slate-500">Accede a tu cuenta para continuar</p>
                </div>
              </div>

              <button
                className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                onClick={() => {
                  setIsLoginOpen(false);
                  setIsPasswordVisible(false);
                }}
                type="button"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <form className="mt-7 grid gap-5" onSubmit={handleLoginSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Usuario o correo</span>
                <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50/90 pl-3.5 pr-4 transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  {loginForm.identifier.includes('@') ? (
                    <Mail className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                  ) : (
                    <UserRound className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                  )}
                  <input
                    className="h-full flex-1 bg-transparent px-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                    name="identifier"
                    onChange={handleLoginChange}
                    placeholder="Usuario o correo"
                    required
                    type="text"
                    value={loginForm.identifier}
                  />
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Contraseña</span>
                <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50/90 pl-3.5 pr-3 transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <Lock className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                  <input
                    className="h-full flex-1 bg-transparent px-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                    name="password"
                    onChange={handleLoginChange}
                    placeholder="Tu contraseña"
                    required
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={loginForm.password}
                  />
                  <button
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    type="button"
                  >
                    {isPasswordVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-500">
                  <input
                    checked={loginForm.rememberMe}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    name="rememberMe"
                    onChange={handleLoginChange}
                    type="checkbox"
                  />
                  <span>Recuérdame</span>
                </label>

                <button
                  className="text-left text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                  onClick={() => {
                    setIsLoginOpen(false);
                    setIsPasswordVisible(false);
                    setForgotPasswordError('');
                    setForgotPasswordMessage('');
                    setForgotPasswordEmail(loginForm.identifier.includes('@') ? loginForm.identifier : '');
                    setIsForgotPasswordOpen(true);
                  }}
                  type="button"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {loginError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {loginError}
                </div>
              ) : null}

              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(37,99,235,0.26)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmittingLogin}
                type="submit"
              >
                {isSubmittingLogin ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Ingresando...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>

              <div className="flex items-center gap-4 pt-1 text-sm text-slate-500">
                <div className="h-px flex-1 bg-slate-200" />
                <span>¿No tienes cuenta?</span>
                <button
                  className="font-semibold text-blue-700 transition hover:text-blue-800"
                  onClick={() => {
                    setIsLoginOpen(false);
                    setIsPasswordVisible(false);
                    setIsRegisterOpen(true);
                  }}
                  type="button"
                >
                  Crear cuenta
                </button>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isForgotPasswordOpen ? (
        <div className="auth-modal" role="dialog" aria-modal="true">
          <div className="auth-modal-card">
            <div className="auth-modal-head">
              <div>
                <strong>Restablecer contrasena</strong>
                <span>Te enviaremos un enlace seguro para crear una nueva contraseña.</span>
              </div>
              <button
                className="auth-close"
                onClick={() => setIsForgotPasswordOpen(false)}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
              <label className="auth-field">
                <span>Correo electrónico</span>
                <div className="auth-input">
                  <input
                    onChange={(event) => setForgotPasswordEmail(event.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    type="email"
                    value={forgotPasswordEmail}
                  />
                </div>
              </label>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                El enlace llegará a tu correo y te llevará directamente al formulario para definir una nueva contraseña.
              </div>

              {forgotPasswordError ? <p className="error-message">{forgotPasswordError}</p> : null}
              {forgotPasswordMessage ? (
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                  {forgotPasswordMessage}
                </div>
              ) : null}

              <button
                className="primary-button full-width-button"
                disabled={isSubmittingForgotPassword}
                type="submit"
              >
                {isSubmittingForgotPassword ? 'ENVIANDO ENLACE...' : 'ENVIAR ENLACE'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isLoginSuccessOpen ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="login-success-pop relative w-full max-w-md overflow-hidden rounded-[30px] border border-emerald-200/70 bg-white/95 px-8 py-8 text-center shadow-[0_35px_90px_rgba(15,23,42,0.22)]">
            <div className="login-success-ring absolute inset-0 rounded-[30px]" />
            <div className="relative">
              <div className="mx-auto grid h-22 w-22 place-items-center rounded-full bg-[radial-gradient(circle_at_top,#86efac,#22c55e_58%,#15803d_100%)] shadow-[0_18px_35px_rgba(34,197,94,0.35)]">
                <svg aria-hidden="true" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5 9.2 16.7 19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="mt-5 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Acceso aprobado
              </span>
              <h3 className="mt-4 text-3xl font-bold text-slate-950">Sesion iniciada correctamente</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Bienvenido{loginSuccessName ? `, ${loginSuccessName}` : ''}. Estamos preparando tu acceso.
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="login-success-bar h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#16a34a,#4ade80)]" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isRegisterOpen ? (
        <div className="auth-modal" role="dialog" aria-modal="true">
          <div className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-6 md:px-10">
              <div>
                <h2 className="text-[1.95rem] font-bold text-blue-900">Crear cuenta</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Regístrate como cliente para comprar en línea.
                </p>
              </div>
              <button
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                onClick={() => setIsRegisterOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleRegisterSubmit}>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-10">
                <div className="grid gap-8">
                  <section className="grid gap-5">
                    <div>
                      <h3 className="text-2xl font-bold text-blue-900">Tus datos Personales</h3>
                      <div className="mt-3 h-0.5 w-16 rounded-full bg-slate-300" />
                    </div>

                    <div className="grid gap-4">
                      <label className="grid gap-2 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                        <span className="text-[1.05rem] font-medium text-slate-800">
                          Nombre <span className="text-rose-500">*</span>
                        </span>
                        <input
                          className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          name="firstName"
                          onChange={handleRegisterChange}
                          placeholder="Nombre"
                          required
                          type="text"
                          value={registerForm.firstName}
                        />
                      </label>

                      <label className="grid gap-2 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                        <span className="text-[1.05rem] font-medium text-slate-800">
                          Apellido <span className="text-rose-500">*</span>
                        </span>
                        <input
                          className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          name="lastName"
                          onChange={handleRegisterChange}
                          placeholder="Apellido"
                          required
                          type="text"
                          value={registerForm.lastName}
                        />
                      </label>

                      <label className="grid gap-2 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                        <span className="text-[1.05rem] font-medium text-slate-800">E-Mail</span>
                        <input
                          className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          name="email"
                          onChange={handleRegisterChange}
                          placeholder="E-Mail"
                          required
                          type="email"
                          value={registerForm.email}
                        />
                      </label>

                      <label className="grid gap-2 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                        <span className="text-[1.05rem] font-medium text-slate-800">
                          Teléfono <span className="text-rose-500">*</span>
                        </span>
                        <div className="flex h-12 overflow-hidden rounded-md border border-slate-300 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                          <div className="flex items-center gap-2 border-r border-slate-200 px-3 text-sm text-slate-500">
                            <span>🇬🇹</span>
                            <span>▼</span>
                          </div>
                          <input
                            className="h-full flex-1 px-4 text-base text-slate-800 outline-none"
                            name="phone"
                            onChange={handleRegisterChange}
                            placeholder="Teléfono"
                            required
                            type="text"
                            value={registerForm.phone}
                          />
                        </div>
                      </label>
                    </div>
                  </section>

                  <section className="grid gap-5">
                    <div>
                      <h3 className="text-2xl font-bold text-blue-900">Su Contraseña</h3>
                      <div className="mt-3 h-0.5 w-16 rounded-full bg-slate-300" />
                    </div>

                    <div className="grid gap-4">
                      <label className="grid gap-2 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                        <span className="text-[1.05rem] font-medium text-slate-800">
                          Contraseña <span className="text-rose-500">*</span>
                        </span>
                        <input
                          className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          name="password"
                          onChange={handleRegisterChange}
                          placeholder="Contraseña"
                          required
                          type="password"
                          value={registerForm.password}
                        />
                      </label>

                      <label className="grid gap-2 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                        <span className="text-[1.05rem] font-medium text-slate-800">
                          Confirma Contraseña <span className="text-rose-500">*</span>
                        </span>
                        <input
                          className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          name="confirmPassword"
                          onChange={handleRegisterChange}
                          placeholder="Confirma Contraseña"
                          required
                          type="password"
                          value={registerForm.confirmPassword}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="grid gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-blue-900">Boletín</h3>
                      <div className="mt-3 h-0.5 w-16 rounded-full bg-slate-300" />
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <input
                        checked={registerForm.newsletter}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        name="newsletter"
                        onChange={handleRegisterChange}
                        type="checkbox"
                      />
                      <span>Deseo recibir novedades, promociones y recomendaciones de productos.</span>
                    </label>
                  </section>

                  {registerError ? <p className="error-message">{registerError}</p> : null}
                  {registerMessage ? <p className="success-message">{registerMessage}</p> : null}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-6 py-4 md:px-10">
                <div className="flex justify-end">
                  <button
                    className="rounded-2xl bg-blue-700 px-8 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSubmittingRegister}
                    type="submit"
                  >
                    {isSubmittingRegister ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCartOpen ? (
        <div className="auth-modal" role="dialog" aria-modal="true">
          <div className="auth-modal-card" style={{ width: 'min(620px, 100%)' }}>
            <div className="auth-modal-head">
              <div>
                <strong>Carrito de compras</strong>
                <span>{cartCount} producto(s) en tu carrito</span>
              </div>
              <button className="auth-close" onClick={() => setIsCartOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <div className="grid gap-4">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <article
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[84px_minmax(0,1fr)_100px]"
                    key={item.productId}
                  >
                    <div className="grid h-[84px] place-items-center overflow-hidden rounded-2xl bg-white p-2">
                      {item.product.primaryImage ? (
                        <img
                          alt={item.product.nombre}
                          className="max-h-full w-full object-contain"
                          src={resolveImageSrc(item.product.primaryImage)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Sin imagen</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <strong className="block text-sm text-slate-900">{item.product.nombre}</strong>
                      <span className="mt-1 block text-sm text-slate-500">
                        {currency.format(item.product.salePrice)}
                      </span>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700"
                          onClick={() => changeCartQuantity(item.productId, item.quantity - 1)}
                          type="button"
                        >
                          -
                        </button>
                        <div className="grid h-9 min-w-12 place-items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                          {item.quantity}
                        </div>
                        <button
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700"
                          onClick={() => changeCartQuantity(item.productId, item.quantity + 1)}
                          type="button"
                        >
                          +
                        </button>
                        <button
                          className="ml-2 text-sm font-semibold text-rose-600"
                          onClick={() => removeFromCart(item.productId)}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Subtotal</div>
                      <strong className="text-lg text-slate-900">
                        {currency.format(item.subtotal)}
                      </strong>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state compact">
                  <strong>Tu carrito esta vacio.</strong>
                  <span>Agrega productos para continuar con tu compra.</span>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Total</div>
                    <strong className="text-2xl text-slate-900">{currency.format(cartTotal)}</strong>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      onClick={() => setIsCartOpen(false)}
                      type="button"
                    >
                      Seguir comprando
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={clearCart}
                      type="button"
                    >
                      Vaciar carrito
                    </button>
                    <button
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!cartItems.length || isCheckingOut}
                      onClick={() => {
                        handleBeginCheckout();
                      }}
                      type="button"
                    >
                      {isCheckingOut ? 'Procesando...' : 'Continuar con entrega'}
                    </button>
                  </div>
                </div>
                {cartMessage ? <p className="success-message" style={{ marginTop: '1rem' }}>{cartMessage}</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isDeliveryOpen ? (
        <DeliveryStep
          customerLabel={paymentCustomerLabel}
          errors={deliveryErrors}
          estimate={deliveryEstimate}
          onBack={() => {
            setIsDeliveryOpen(false);
            setIsCartOpen(true);
          }}
          onChange={handleDeliveryChange}
          onClose={() => {
            setIsDeliveryOpen(false);
            setDeliveryErrors({});
          }}
          onContinue={handleContinueToPayment}
          onSelectStep={(step) => {
            if (step === 'payment') {
              handleContinueToPayment();
            }
          }}
          orderLabel={simulatedOrderLabel}
          productLabel={deliveryProductLabel}
          subtotalLabel={currency.format(cartTotal)}
          totalLabel={currency.format(finalCheckoutTotal)}
          values={deliveryForm}
          zoneOptions={deliveryZones.map((zone) => ({
            value: zone.value,
            label: zone.label,
            coverage: zone.coverage,
            lat: zone.lat,
            lng: zone.lng,
            mapLabel: zone.mapLabel,
          }))}
        />
      ) : null}

      {isPaymentOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[radial-gradient(circle_at_top_left,#1f3c88_0%,#0d1f4d_28%,#081733_75%,#07112a_100%)] p-4 md:p-6" role="dialog" aria-modal="true">
          <div className="relative mx-auto min-h-[calc(100vh-2rem)] max-w-[1480px] overflow-hidden rounded-[34px] bg-white shadow-[0_40px_120px_rgba(2,8,23,0.3)] ring-1 ring-white/10 md:min-h-[calc(100vh-3rem)]">
            {!isCheckingOut && !isPaymentSuccessOpen ? (
              <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_670px]">
                <div className="overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)]">
                  <PaymentForm
                  errors={paymentErrors}
                  feedbackMessage={cartMessage}
                  isCheckingOut={isCheckingOut}
                  onBack={() => {
                    setIsDeliveryOpen(true);
                    setIsPaymentOpen(false);
                    setPaymentErrors({});
                    setPaymentFocus(undefined);
                  }}
                  onChange={handlePaymentChange}
                  onClose={() => {
                    setIsPaymentOpen(false);
                    setIsDeliveryOpen(false);
                    setPaymentErrors({});
                    setPaymentFocus(undefined);
                  }}
                  onConfirm={() => void handleConfirmSimulatedPayment()}
                  onFieldFocus={setPaymentFocus}
                  onSelectStep={(step) => {
                    if (step === 'delivery') {
                      setIsDeliveryOpen(true);
                      setIsPaymentOpen(false);
                      setPaymentErrors({});
                      setPaymentFocus(undefined);
                    }
                  }}
                  values={paymentForm}
                />
                </div>
                <div className="overflow-y-auto border-l border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-7 py-8 md:px-10 md:py-10">
                  <div className="mx-auto grid max-w-[520px] gap-8">
                    <div className="relative">
                      <PaymentSummary
                        customerLabel={paymentCustomerWithRoute}
                        deliveryLabel={
                          deliveryEstimate
                            ? `${deliveryEstimate.label} · ${deliveryEstimate.minutes} a ${deliveryEstimate.minutes + 15} min`
                            : undefined
                        }
                        items={paymentItems}
                        orderLabel={simulatedOrderLabel}
                        shippingLabel={
                          deliveryEstimate ? `Q ${deliveryEstimate.shippingCost.toFixed(2)}` : undefined
                        }
                        subtotalLabel={currency.format(cartTotal)}
                      />
                    </div>

                    <div className="grid gap-4">
                      <div className="text-lg font-semibold text-slate-900">Tarjeta (modo prueba)</div>
                      <DemoCardPreview focus={paymentFocus} values={paymentForm} />
                    </div>

                    <div className="relative">
                      <SecurePaymentBox
                        shippingLabel={
                          deliveryEstimate ? `Q ${deliveryEstimate.shippingCost.toFixed(2)}` : undefined
                        }
                        totalLabel={currency.format(finalCheckoutTotal)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {isCheckingOut && !isPaymentSuccessOpen ? (
              <div className="grid min-h-full place-items-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4">
                <div className="w-full max-w-[440px] rounded-[30px] border border-slate-100 bg-white px-8 py-10 text-center shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blue-50 text-blue-600 shadow-[0_14px_28px_rgba(37,99,235,0.18)]">
                    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
                  </div>
                  <h3 className="mt-6 text-3xl font-bold text-slate-950">Confirmando pago</h3>
                  <p className="mt-3 text-base leading-7 text-slate-500">
                    Estamos procesando tu transacción y preparando la confirmación de tu compra.
                  </p>
                  <div className="mt-6 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 w-full animate-pulse rounded-full bg-[linear-gradient(90deg,#2563eb,#60a5fa)]" />
                  </div>
                </div>
              </div>
            ) : null}

            {isPaymentSuccessOpen ? (
              <div className="grid min-h-full place-items-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4">
                <div className="w-full max-w-[460px] rounded-[30px] border border-emerald-100 bg-white px-8 py-10 text-center shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-[0_14px_28px_rgba(34,197,94,0.18)]">
                    <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="m7 12.5 3.2 3.2L17.5 8.5"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-3xl font-bold text-slate-950">Transacción confirmada</h3>
                  <p className="mt-3 text-base leading-7 text-slate-500">
                    Tu pago fue aprobado correctamente. Cerraremos esta ventana de pago en un momento.
                  </p>
                  {cartMessage ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {cartMessage}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {invoiceData ? (
        <InvoicePreview
          customerName={invoiceData.customerName}
          deliveryAddress={invoiceData.deliveryAddress}
          deliveryEta={invoiceData.deliveryEta}
          items={invoiceData.items}
          logoSrc="/libreria.png"
          onClose={() => setInvoiceData(null)}
          onDownloadPdf={() => void handleDownloadInvoice()}
          orderDate={invoiceData.orderDate}
          orderId={invoiceData.orderId}
          orderTotal={invoiceData.orderTotal}
          phone={invoiceData.phone}
          reference={invoiceData.reference}
          shippingCost={invoiceData.shippingCost}
          subtotal={invoiceData.subtotal}
        />
      ) : null}
    </div>
  );
}
