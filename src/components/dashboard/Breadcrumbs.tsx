'use client';

import Link from 'next/link';

type Crumb = {
  label: string;
  href?: string;
};

interface BreadcrumbsProps {
  items: Crumb[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition hover:text-blue-700">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-700">{item.label}</span>
          )}
          {index < items.length - 1 ? <span className="text-slate-300">/</span> : null}
        </span>
      ))}
    </div>
  );
}
