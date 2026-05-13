'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Building2,
  DollarSign,
  Settings,
  Menu,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';

const allNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true, adminOnly: false },
  { label: 'Cases', href: '/cases', icon: FolderOpen, adminOnly: false },
  { label: 'Calendar', href: '/calendar', icon: Calendar, adminOnly: false },
  { label: 'Vendors', href: '/vendors', icon: Building2, adminOnly: false },
  { label: 'Pre-Need', href: '/preneed', icon: BookOpen, adminOnly: false },
  { label: 'Price List', href: '/price-list', icon: DollarSign, adminOnly: false },
  { label: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
];

function NavLink({ item, onClick }: { item: (typeof allNavItems)[number]; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-semibold'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground font-normal',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { canAccessSettings } = useCurrentUser();
  const navItems = allNavItems.filter((item) => !item.adminOnly || canAccessSettings);

  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <span className="text-lg font-semibold tracking-tight">Kelova</span>
      </div>

      {/* Nav items */}
      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>
    </div>
  );
}

// Mobile hamburger trigger — rendered inside TopBar
export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden touch-target">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar — always visible on md+
export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <SidebarContent />
    </aside>
  );
}
