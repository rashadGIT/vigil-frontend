'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const primaryTabs = [
  { label: 'Overview', href: '' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Documents', href: '/documents' },
  { label: 'Payments', href: '/payments' },
];

const overflowTabs = [
  { label: 'Obituary', href: '/obituary' },
  { label: 'Follow-ups', href: '/follow-ups' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Signatures', href: '/signatures' },
  { label: 'First Call', href: '/first-call' },
  { label: 'Death Certificate', href: '/death-certificate' },
  { label: 'Cremation Auth', href: '/cremation-auth' },
  { label: 'Merchandise', href: '/merchandise' },
  { label: 'Cemetery', href: '/cemetery' },
];

export function CaseWorkspaceTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/cases/${caseId}`;

  const isOverflowActive = overflowTabs.some((tab) => {
    const href = `${base}${tab.href}`;
    return pathname.startsWith(href);
  });

  return (
    <div className="border-b mb-6 overflow-x-auto">
      <nav className="flex -mb-px min-w-max">
        {primaryTabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors inline-flex items-center gap-1',
                isOverflowActive
                  ? 'border-primary text-primary font-medium bg-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
              )}
            >
              More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {overflowTabs.map((tab) => {
              const href = `${base}${tab.href}`;
              const isActive = pathname.startsWith(href);
              return (
                <DropdownMenuItem
                  key={tab.label}
                  className={cn(isActive && 'bg-accent text-accent-foreground font-medium')}
                  onSelect={() => router.push(href)}
                >
                  {tab.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
