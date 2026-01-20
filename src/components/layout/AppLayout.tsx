import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardList,
  User,
  Menu,
  X,
  Plane,
  BookOpen,
  Calculator,
  FlaskConical,
  UserCircle2,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/farms', label: 'Fincas', icon: MapPin },
  { href: '/jobs', label: 'Trabajos', icon: ClipboardList },
  {
    label: 'Equipos de trabajo',
    icon: UserCircle2,
    subItems: [
      { href: '/operations/team', label: 'Equipo', icon: UserCircle2 },
      { href: '/operations/drones', label: 'Drones', icon: Plane },
      { href: '/operations/generators', label: 'Generadores', icon: Zap },
    ]
  },
  { href: '/operations/attendance', label: 'Asistencia', icon: ClipboardList },
  { href: '/resources', label: 'Recursos', icon: BookOpen },
  { href: '/catalog', label: 'Catálogo', icon: FlaskConical },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const { signOut, user } = useAuth();

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <Plane className="h-8 w-8 text-sidebar-primary" />
            <span className="text-xl font-bold text-sidebar-foreground">SmartGrowth OPS</span>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              if (item.subItems) {
                // This is a parent item with submenu
                const isAnySubItemActive = item.subItems.some(subItem =>
                  location.pathname === subItem.href ||
                  (subItem.href !== '/' && location.pathname.startsWith(subItem.href!))
                );
                const isOpen = openSubmenus[item.label] || isAnySubItemActive;

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isAnySubItemActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-4">
                        {item.subItems.map((subItem) => {
                          const isActive = location.pathname === subItem.href ||
                            (subItem.href !== '/' && location.pathname.startsWith(subItem.href!));
                          return (
                            <Link
                              key={subItem.href}
                              to={subItem.href!}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              )}
                            >
                              <subItem.icon className="h-4 w-4" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular nav item
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href!));
                return (
                  <Link
                    key={item.href}
                    to={item.href!}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              }
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <p className="mb-2 truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Plane className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold">FarmFlight</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-16 lg:hidden">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              if (item.subItems) {
                // This is a parent item with submenu
                const isAnySubItemActive = item.subItems.some(subItem =>
                  location.pathname === subItem.href ||
                  (subItem.href !== '/' && location.pathname.startsWith(subItem.href!))
                );
                const isOpen = openSubmenus[item.label] || isAnySubItemActive;

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
                        isAnySubItemActive
                          ? 'bg-muted'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-4">
                        {item.subItems.map((subItem) => {
                          const isActive = location.pathname === subItem.href ||
                            (subItem.href !== '/' && location.pathname.startsWith(subItem.href!));
                          return (
                            <Link
                              key={subItem.href}
                              to={subItem.href!}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              )}
                            >
                              <subItem.icon className="h-4 w-4" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular nav item
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href!));
                return (
                  <Link
                    key={item.href}
                    to={item.href!}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              }
            })}
            <div className="pt-4">
              <p className="mb-2 px-4 text-sm text-muted-foreground">{user?.email}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
              >
                Cerrar sesión
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
}