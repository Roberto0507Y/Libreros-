import type { ProductItem } from '../../domain/types';
import { currency } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

type ProductCardProps = {
  product: ProductItem;
  imageSrc: string;
  onAddToCart: (productId: number) => void;
  onViewProduct: (productId: number) => void;
  compact?: boolean;
  className?: string;
};

export function ProductCard({
  className,
  compact = false,
  imageSrc,
  onAddToCart,
  onViewProduct,
  product,
}: ProductCardProps) {
  const stockTone = product.stock <= 0 ? 'danger' : product.stock <= 5 ? 'warning' : 'success';

  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_65px_rgba(37,99,235,0.12)]',
        className,
      )}
      tone="default"
    >
      <div className="relative grid aspect-[4/4.2] place-items-center overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6faff_100%)] p-5">
        {product.stock <= 0 ? (
          <div className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_12px_24px_rgba(244,63,94,0.25)]">
            Agotado
          </div>
        ) : null}
        {imageSrc ? (
          <img
            alt={product.nombre}
            className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            src={imageSrc}
          />
        ) : (
          <span className="text-sm font-medium text-slate-400">Sin imagen</span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="primary" className="normal-case tracking-normal">
            {product.brandName}
          </Badge>
          <Badge tone={stockTone}>Stock {product.stock}</Badge>
        </div>

        <strong className={cn('text-slate-950', compact ? 'min-h-[60px] text-base leading-7' : 'min-h-[76px] text-lg leading-8', 'font-bold')}>
          {product.nombre}
        </strong>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Modelo {product.id}
            </div>
            <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-[color:var(--brand-primary)]">
              {currency.format(product.salePrice)}
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div>{product.categoryName}</div>
            <div>{product.subcategoryName}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Button
            fullWidth
            size={compact ? 'sm' : 'md'}
            variant="secondary"
            onClick={() => onViewProduct(product.id)}
          >
            Ver producto
          </Button>
          <Button
            fullWidth
            size={compact ? 'sm' : 'md'}
            variant="success"
            onClick={() => onAddToCart(product.id)}
            disabled={product.stock <= 0}
          >
            Agregar al carrito
          </Button>
        </div>
      </div>
    </Card>
  );
}
