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
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,99,235,0.12)] md:hover:-translate-y-1.5 md:hover:shadow-[0_28px_65px_rgba(37,99,235,0.12)]',
        className,
      )}
      tone="default"
    >
      <div className="relative grid aspect-square place-items-center overflow-hidden bg-[linear-gradient(180deg,#fbfdff,#f4f8fd)] p-3 md:p-4">
        {product.stock <= 0 ? (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_24px_rgba(244,63,94,0.25)] md:left-4 md:top-4 md:px-3 md:text-[10px] md:tracking-[0.2em]">
            Agotado
          </div>
        ) : null}
        {imageSrc ? (
          <img
            alt={product.nombre}
            className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            src={imageSrc}
          />
        ) : (
          <span className="text-sm font-medium text-slate-400">Sin imagen</span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 py-3.5 md:px-4 md:py-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="primary" className="normal-case tracking-normal text-[9px] md:text-xs">
            {product.brandName}
          </Badge>
          <Badge tone={stockTone} className="text-[9px] md:text-xs">
            Stock {product.stock}
          </Badge>
        </div>

        <div className="text-[11px] font-medium text-slate-500 md:text-xs">
          {currency.format(product.salePrice)}
        </div>

        <strong
          className={cn(
            'line-clamp-2 text-slate-950',
            compact
              ? 'mt-1 min-h-[38px] text-sm leading-5 md:min-h-[52px] md:text-[0.98rem] md:leading-6'
              : 'mt-1 min-h-[40px] text-sm leading-5 md:min-h-[58px] md:text-base md:leading-6',
            'font-bold',
          )}
        >
          {product.nombre}
        </strong>

        <div className="mt-1.5 text-[11px] text-slate-500 md:text-xs">
          {product.subcategoryName || product.categoryName}
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2 md:mt-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 md:text-[11px] md:tracking-[0.18em]">
              Modelo {product.id}
            </div>
            <div className="mt-1 text-lg font-black tracking-[-0.04em] text-[color:var(--brand-primary)] md:text-[1.55rem]">
              {currency.format(product.salePrice)}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400 md:text-xs">
            <div>{product.stock > 0 ? 'Disponible' : 'Sin stock'}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            fullWidth
            className="h-9 rounded-xl border border-slate-200 bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 shadow-none hover:bg-slate-200 md:h-10 md:text-xs"
            variant="secondary"
            onClick={() => onAddToCart(product.id)}
            disabled={product.stock <= 0}
          >
            Agregar
          </Button>
          <Button
            fullWidth
            className="h-9 rounded-xl px-2 text-[11px] font-semibold md:h-10 md:text-xs"
            variant="dark"
            onClick={() => onViewProduct(product.id)}
          >
            Ver
          </Button>
        </div>
      </div>
    </Card>
  );
}
