import type { FC, ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex flex-col gap-2 pb-4 mb-6 border-b border-[#1b2433] md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-100 font-sans">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-400 font-sans mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
};

