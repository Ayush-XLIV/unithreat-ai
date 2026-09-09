import type { FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  hasMore?: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  disabled?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

export const PaginationControls: FC<PaginationControlsProps> = ({
  page,
  limit,
  total,
  hasMore = false,
  onPageChange,
  onLimitChange,
  disabled = false,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) => {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const maxPage = Math.max(1, Math.ceil(total / (limit || 1)));

  const canGoPrevious = !disabled && page > 1;
  const canGoNext = !disabled && (hasMore || endItem < total) && page < maxPage;

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3.5 py-2.5 border-t border-[#1b2433] bg-[#0c1017] text-xs text-slate-300 font-sans ${className}`}
    >
      {/* Items Range Summary */}
      <div className="flex items-center gap-2 font-mono text-slate-400 text-[11px]">
        <span>
          Showing <strong className="text-slate-100">{startItem}</strong> –{' '}
          <strong className="text-slate-100">{endItem}</strong> of{' '}
          <strong className="text-cyan-400">{total}</strong> records
        </span>
      </div>

      {/* Controls Container */}
      <div className="flex items-center gap-4 justify-between sm:justify-end">
        {/* Page Limit Selector */}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <label htmlFor="pagination-limit-select" className="text-slate-400">
              Rows:
            </label>
            <select
              id="pagination-limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={disabled}
              className="rounded-md border border-[#1b2433] bg-[#121824] px-2 py-1 text-slate-200 focus-ring font-mono text-xs cursor-pointer hover:border-[#263347] transition-colors"
              aria-label="Select rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            className={`inline-flex items-center justify-center rounded-md border p-1.5 transition-colors focus-ring ${
              canGoPrevious
                ? 'border-[#1b2433] bg-[#121824] text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                : 'border-[#1b2433]/50 bg-slate-900/30 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 font-mono text-xs text-slate-300">
            Page <strong className="text-slate-100">{page}</strong> / {maxPage}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            className={`inline-flex items-center justify-center rounded-md border p-1.5 transition-colors focus-ring ${
              canGoNext
                ? 'border-[#1b2433] bg-[#121824] text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                : 'border-[#1b2433]/50 bg-slate-900/30 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

