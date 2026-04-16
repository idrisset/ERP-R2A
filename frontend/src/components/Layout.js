import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, ChevronDown, Bell, Calculator, FileUp, FileText
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const NAV_ITEMS = [
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/produits', label: 'Produits', icon: Package },
  { path: '/import', label: 'Import', icon: FileUp },
  { path: '/ventes', label: 'Ventes', icon: ShoppingCart },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/comptabilite', label: 'Comptabilité', icon: Calculator },
  { path: '/parametres', label: 'Paramètres', icon: Settings },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3" data-testid="sidebar-logo">
          <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center">
            <span className="text-[#0A3D73] font-bold text-sm">R2A</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm tracking-tight block">R2A Industrie</span>
            <span className="text-white/50 text-xs">Gestion de Stock</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md mx-1 ${
                active ? 'active bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
              data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Utilisateur'}</p>
            <p className="text-xs text-white/50 capitalize">{user?.role || 'employé'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 bg-[#0A3D73] z-50"
        data-testid="sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#0A3D73] z-50 transform transition-transform duration-200 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar-mobile"
      >
        <div className="absolute top-4 right-4">
          <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white" data-testid="sidebar-close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="md:ml-60 main-content">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-600 hover:text-slate-900"
                data-testid="sidebar-toggle"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight" data-testid="page-title">
                {NAV_ITEMS.find(n => isActive(n.path))?.label || 'R2A Industrie'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 relative" data-testid="notifications-btn">
                <Bell className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-slate-700 hover:text-slate-900" data-testid="user-menu-trigger">
                    <div className="w-7 h-7 bg-[#0A3D73] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/parametres')} data-testid="menu-settings">
                    <Settings className="w-4 h-4 mr-2" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
