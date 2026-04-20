import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Package, AlertTriangle, XCircle, ShoppingCart, Users,
  Droplets, Wind, Cpu, SlidersHorizontal, ShieldCheck,
  Monitor, Gauge, RotateCw, Radio, Hash, Radar, Flame,
  TrendingUp, ArrowRight
} from 'lucide-react';

const ICON_MAP = {
  Droplets, Wind, Cpu, SlidersHorizontal, ShieldCheck,
  Monitor, Gauge, RotateCw, Radio, Hash, Radar, Flame,
  ShoppingCart, Users
};

const EXTRA_TILES = [
  { id: 'ventes', name: 'Ventes', icon: 'ShoppingCart', path: '/ventes', accent: '#16A34A' },
  { id: 'clients', name: 'Clients', icon: 'Users', path: '/clients', accent: '#2563EB' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error('Erreur chargement stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[#0A3D73]/20 border-t-[#0A3D73] rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Articles',
      value: stats?.total_products || 0,
      icon: Package,
      color: '#0A3D73',
      bg: '#EFF6FF',
    },
    {
      label: 'Stock Faible',
      value: stats?.low_stock || 0,
      icon: AlertTriangle,
      color: '#EA580C',
      bg: '#FFF7ED',
    },
    {
      label: 'En Rupture',
      value: stats?.out_of_stock || 0,
      icon: XCircle,
      color: '#DC2626',
      bg: '#FEF2F2',
    },
    {
      label: 'Ventes du Mois',
      value: stats?.monthly_sales_count || 0,
      icon: TrendingUp,
      color: '#16A34A',
      bg: '#F0FDF4',
    },
    {
      label: 'Total Clients',
      value: stats?.total_clients || 0,
      icon: Users,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
  ];

  const categories = stats?.categories || [];

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="stats-section">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`stat-card bg-white border border-slate-200 rounded-md p-4 shadow-sm animate-fade-in-up stagger-${idx + 1}`}
              style={{ opacity: 0 }}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{(stat.value ?? 0).toLocaleString('fr-FR')}</p>
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Section Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight" data-testid="categories-title">
          Familles de Produits
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Sélectionnez une catégorie pour consulter les pièces
        </p>
      </div>

      {/* Category Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" data-testid="categories-grid">
        {categories.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || Package;
          const count = stats?.category_counts?.[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => navigate(`/categorie/${cat.id}`)}
              className="category-tile bg-white border border-slate-200 rounded-md p-5 md:p-6 shadow-sm text-left group"
              data-testid={`category-tile-${cat.id}`}
            >
              <div className="tile-icon-wrapper w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-[#0A3D73] mb-4 transition-colors">
                <IconComp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#0A3D73] transition-colors">
                {cat.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-500">{count} article{count !== 1 ? 's' : ''}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0A3D73] transition-colors" />
              </div>
            </button>
          );
        })}

        {/* Extra tiles: Ventes + Clients */}
        {EXTRA_TILES.map((tile) => {
          const IconComp = ICON_MAP[tile.icon] || Package;
          return (
            <button
              key={tile.id}
              onClick={() => navigate(tile.path)}
              className="category-tile bg-white border border-slate-200 rounded-md p-5 md:p-6 shadow-sm text-left group"
              data-testid={`category-tile-${tile.id}`}
            >
              <div
                className="tile-icon-wrapper w-12 h-12 rounded-md flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: `${tile.accent}15`, color: tile.accent }}
              >
                <IconComp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#0A3D73] transition-colors">
                {tile.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-500">
                  {tile.id === 'ventes' ? `${stats?.monthly_sales_count || 0} ce mois` : `${stats?.total_clients || 0} total`}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0A3D73] transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
