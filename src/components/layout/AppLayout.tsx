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
  Plane
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/farms', label: 'Campos', icon: MapPin },
  { href: '/jobs', label: 'Trabajos', icon: ClipboardList },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <Plane className="h-8 w-8 text-sidebar-primary" />
            <span className="text-xl font-bold text-sidebar-foreground">FarmFlight</span>
          </div>
          
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
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
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
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