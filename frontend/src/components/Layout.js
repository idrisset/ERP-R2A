import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, ChevronDown, Bell, Calculator, FileUp, FileText, BarChart3,
  Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  { path: '/import', label: 'Import', icon: FileUp, adminOnly: true },
  { path: '/ventes', label: 'Ventes', icon: ShoppingCart },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/comptabilite', label: 'Comptabilité', icon: Calculator, adminOnly: true },
  { path: '/rapports', label: 'Rapports', icon: BarChart3, adminOnly: true },
  { path: '/parametres', label: 'Paramètres', icon: Settings, adminOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Global search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: searchQuery } });
        setSearchResults(data);
        setSearchOpen(true);
      } catch { setSearchResults(null); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToResult = (type, item) => {
    setSearchOpen(false); setSearchQuery('');
    if (type === 'product') navigate(`/categorie/${item.category}`);
    else navigate('/clients');
  };

  const filteredNav = NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
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
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`sidebar-link flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md mx-1 ${active ? 'active bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
              data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Utilisateur'}</p>
            <p className="text-xs text-white/50 capitalize">{user?.role === 'admin' ? 'Administrateur' : 'Vendeur'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {sidebarOpen && <div className="sidebar-overlay md:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 bg-[#0A3D73] z-50"><SidebarContent /></aside>
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0A3D73] z-50 transform transition-transform duration-200 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-4 right-4"><button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button></div>
        <SidebarContent />
      </aside>

      <div className="md:ml-60 main-content">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-14 gap-3">
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-slate-900" data-testid="sidebar-toggle">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight hidden sm:block" data-testid="page-title">
                {filteredNav.find(n => isActive(n.path))?.label || 'R2A Industrie'}
              </h1>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-md relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setSearchOpen(true)}
                placeholder="Rechercher produit, client..."
                className="pl-10 h-9 border-slate-200 bg-slate-50 text-sm"
                data-testid="global-search-input"
              />
              {searchOpen && searchResults && (searchResults.products?.length > 0 || searchResults.clients?.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
                  {searchResults.products?.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">Produits</div>
                      {searchResults.products.map(p => (
                        <button key={p.id} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-50 flex justify-between" onClick={() => goToResult('product', p)}>
                          <span><span className="font-mono font-medium text-[#0A3D73]">{p.reference}</span> <span className="text-slate-600 ml-1">{p.brand}</span></span>
                          <span className="text-slate-400 text-xs">Qté: {p.quantity}</span>
                        </button>
                      ))}
                    </>
                  )}
                  {searchResults.clients?.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">Clients</div>
                      {searchResults.clients.map(c => (
                        <button key={c.id} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-50" onClick={() => goToResult('client', c)}>
                          <span className="font-medium">{c.name}</span>
                          {c.phone && <span className="text-slate-400 ml-2">{c.phone}</span>}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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
                  {user?.role === 'admin' && <DropdownMenuItem onClick={() => navigate('/parametres')} data-testid="menu-settings"><Settings className="w-4 h-4 mr-2" /> Paramètres</DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout"><LogOut className="w-4 h-4 mr-2" /> Déconnexion</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
