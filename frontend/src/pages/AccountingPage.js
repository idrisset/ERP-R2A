import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Plus, Search,
  MoreHorizontal, Pencil, Trash2, Loader2, BarChart3, ArrowUpRight,
  ArrowDownRight, Receipt, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle,
  Users, ArrowUpDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const REVENUE_CATS = { ventes: 'Ventes', services: 'Services', autres_revenus: 'Autres' };
const EXPENSE_CATS = {
  achats_stock: 'Achats stock', frais_generaux: 'Frais généraux', salaires: 'Salaires',
  loyer: 'Loyer', transport: 'Transport', marketing: 'Marketing',
  maintenance: 'Maintenance', autres_depenses: 'Autres'
};
const PAYMENT_METHODS = { virement: 'Virement', especes: 'Espèces', cheque: 'Chèque', carte: 'Carte bancaire' };
const INV_STATUS = {
  en_attente: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  payee: { label: 'Payée', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  en_retard: { label: 'En retard', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
};

const fmt = (v) => new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v || 0) + ' DZD';
const fmtDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return '-'; } };

// ============ MAIN ACCOUNTING PAGE ============
export default function AccountingPage() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/accounting/dashboard');
      setDashboard(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const chartData = (dashboard?.monthly_chart || []).map(d => ({
    name: MONTH_NAMES[d.month - 1],
    Revenus: d.revenue,
    Dépenses: d.expense,
  }));

  return (
    <div className="space-y-6" data-testid="accounting-page">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Comptabilité</h1>
        <p className="text-sm text-slate-500">Gestion financière et facturation</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 border border-slate-200" data-testid="accounting-tabs">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-dashboard">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="revenues" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-revenues">
            <ArrowUpRight className="w-4 h-4 mr-1.5" /> Revenus
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-expenses">
            <ArrowDownRight className="w-4 h-4 mr-1.5" /> Dépenses
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-invoices">
            <FileText className="w-4 h-4 mr-1.5" /> Factures
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-acc-clients">
            <Users className="w-4 h-4 mr-1.5" /> Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
          ) : (
            <DashboardTab data={dashboard} chartData={chartData} />
          )}
        </TabsContent>
        <TabsContent value="revenues" className="mt-6">
          <TransactionsTab type="revenue" onChanged={fetchDashboard} />
        </TabsContent>
        <TabsContent value="expenses" className="mt-6">
          <TransactionsTab type="expense" onChanged={fetchDashboard} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-6">
          <InvoicesTab onChanged={fetchDashboard} />
        </TabsContent>
        <TabsContent value="clients" className="mt-6">
          <ClientsAccountingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ DASHBOARD TAB ============
function DashboardTab({ data, chartData }) {
  if (!data) return null;
  const unpaidTotal = (data.invoices_pending || 0) + (data.invoices_overdue || 0);
  const [showDebts, setShowDebts] = useState(false);
  const [showRefunds, setShowRefunds] = useState(false);

  const stats = [
    { label: 'CA Encaissé (mois)', value: fmt(data.sales_encaisse || 0), icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Dettes actives', value: fmt(data.sales_dette || 0), icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2', count: data.sales_dette_count, onClick: () => setShowDebts(true) },
    { label: 'Remboursements (mois)', value: fmt(data.sales_remboursement || 0), icon: ArrowDownRight, color: '#2563EB', bg: '#EFF6FF', count: data.sales_remboursement_count, onClick: () => setShowRefunds(true) },
    { label: 'Factures non payées', value: unpaidTotal, icon: Clock, color: '#EA580C', bg: '#FFF7ED' },
    { label: 'Bénéfice annuel', value: fmt(data.year_profit), icon: BarChart3, color: '#0A3D73', bg: '#EFF6FF' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="accounting-stats">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`bg-white border border-slate-200 rounded-md p-4 shadow-sm ${s.onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''}`} onClick={s.onClick}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{s.label}{s.count ? ` (${s.count})` : ''}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm" data-testid="accounting-chart">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Évolution mensuelle {data.year}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0' }} />
              <Legend />
              <Bar dataKey="Revenus" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-2">Résumé annuel {data.year}</h3>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between"><span className="text-sm text-slate-600">Total Revenus</span><span className="text-sm font-semibold text-emerald-700">{fmt(data.year_revenue)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-600">Total Dépenses</span><span className="text-sm font-semibold text-red-700">{fmt(data.year_expense)}</span></div>
            <div className="border-t pt-3 flex justify-between"><span className="text-sm font-semibold text-slate-900">Bénéfice net</span><span className={`text-sm font-bold ${data.year_profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(data.year_profit)}</span></div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-2">Factures</h3>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Payées</span><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{data.invoices_paid}</Badge></div>
            <div className="flex justify-between items-center"><span className="text-sm text-slate-600">En attente</span><Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{data.invoices_pending}</Badge></div>
            <div className="flex justify-between items-center"><span className="text-sm text-slate-600">En retard</span><Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{data.invoices_overdue}</Badge></div>
          </div>
        </div>
      </div>

      {/* Debt Detail Dialog */}
      <Dialog open={showDebts} onOpenChange={setShowDebts}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-red-600">Dettes actives — {fmt(data.sales_dette || 0)}</DialogTitle></DialogHeader>
          {(data.debt_list || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aucune dette active</p>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="text-xs">N° Vente</TableHead><TableHead className="text-xs">Client</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Échéance</TableHead><TableHead className="text-xs text-right">Montant</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(data.debt_list || []).map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm text-[#0A3D73]">{d.sale_number}</TableCell>
                    <TableCell className="font-medium">{d.client_name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{fmtDate(d.created_at)}</TableCell>
                    <TableCell className="text-sm text-red-600 font-medium">{d.date_echeance ? fmtDate(d.date_echeance) : '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-red-700">{fmt(d.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Detail Dialog */}
      <Dialog open={showRefunds} onOpenChange={setShowRefunds}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-blue-600">Remboursements du mois — {fmt(data.sales_remboursement || 0)}</DialogTitle></DialogHeader>
          {(data.refund_list || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aucun remboursement</p>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="text-xs">N° Vente</TableHead><TableHead className="text-xs">Client</TableHead><TableHead className="text-xs">Motif</TableHead><TableHead className="text-xs text-right">Montant</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(data.refund_list || []).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm text-[#0A3D73]">{r.sale_number}</TableCell>
                    <TableCell className="font-medium">{r.client_name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{r.motif || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-700">{fmt(r.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionsTab({ type, onChanged }) {
  const isRevenue = type === 'revenue';
  const endpoint = isRevenue ? '/accounting/revenues' : '/accounting/expenses';
  const categories = isRevenue ? REVENUE_CATS : EXPENSE_CATS;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get(endpoint, { params });
      setItems(data.items); setTotal(data.total); setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [endpoint, page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`${endpoint}/${deleteTarget.id}`); setDeleteTarget(null); fetch(); onChanged(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher..." className="pl-10 border-slate-300" data-testid={`${type}-search`} />
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid={`add-${type}-btn`}>
          <Plus className="w-4 h-4 mr-2" /> {isRevenue ? 'Nouveau revenu' : 'Nouvelle dépense'}
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4">
              {isRevenue ? <ArrowUpRight className="w-7 h-7 text-slate-400" /> : <ArrowDownRight className="w-7 h-7 text-slate-400" />}
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{isRevenue ? 'Aucun revenu' : 'Aucune dépense'}</h3>
            <p className="text-sm text-slate-500">Cliquez sur le bouton pour en ajouter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Description</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Catégorie</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">{isRevenue ? 'Client' : 'Fournisseur'}</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Paiement</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Montant</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50" data-testid={`${type}-row-${item.id}`}>
                      <TableCell className="text-sm text-slate-600">{fmtDate(item.date)}</TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-[220px] truncate">{item.description}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs border-slate-200">{categories[item.category] || item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 hidden md:table-cell">{item.client_name || item.supplier_name || '-'}</TableCell>
                      <TableCell className="text-slate-600 hidden md:table-cell">{PAYMENT_METHODS[item.payment_method] || item.payment_method}</TableCell>
                      <TableCell className={`text-right font-semibold ${isRevenue ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isRevenue ? '+' : '-'}{fmt(item.amount)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditItem(item); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(item)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">Page {page} sur {pages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-slate-300 h-8"><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="border-slate-300 h-8"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Dialog */}
      <TransactionForm
        type={type} open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        item={editItem} onSaved={() => { fetch(); onChanged(); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. {deleteTarget?.description} ({fmt(deleteTarget?.amount)}) sera supprimé.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ TRANSACTION FORM ============
function TransactionForm({ type, open, onClose, item, onSaved }) {
  const isRevenue = type === 'revenue';
  const endpoint = isRevenue ? '/accounting/revenues' : '/accounting/expenses';
  const cats = isRevenue
    ? [{ v: 'ventes', l: 'Ventes' }, { v: 'services', l: 'Services' }, { v: 'autres_revenus', l: 'Autres' }]
    : [{ v: 'achats_stock', l: 'Achats stock' }, { v: 'frais_generaux', l: 'Frais généraux' }, { v: 'salaires', l: 'Salaires' }, { v: 'loyer', l: 'Loyer' }, { v: 'transport', l: 'Transport' }, { v: 'marketing', l: 'Marketing' }, { v: 'maintenance', l: 'Maintenance' }, { v: 'autres_depenses', l: 'Autres' }];

  const isEdit = !!item;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        description: item.description || '', amount: item.amount || 0,
        category: item.category || cats[0].v,
        [isRevenue ? 'client_name' : 'supplier_name']: item.client_name || item.supplier_name || '',
        payment_method: item.payment_method || 'virement',
        date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
        invoice_ref: item.invoice_ref || '',
      });
    } else {
      setForm({
        description: '', amount: 0, category: cats[0].v,
        [isRevenue ? 'client_name' : 'supplier_name']: '',
        payment_method: 'virement',
        date: new Date().toISOString().split('T')[0],
        invoice_ref: '',
      });
    }
    setError('');
  }, [item, open, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description?.trim()) { setError('Description obligatoire'); return; }
    if (!form.amount || form.amount <= 0) { setError('Montant invalide'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, date: form.date ? new Date(form.date).toISOString() : undefined };
      if (isEdit) await api.put(`${endpoint}/${item.id}`, payload);
      else await api.post(endpoint, payload);
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur');
    } finally { setSaving(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-testid={`${type}-form-dialog`}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier' : (isRevenue ? 'Nouveau revenu' : 'Nouvelle dépense')}</DialogTitle>
        </DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Description *</Label>
              <Input value={form.description || ''} onChange={(e) => set('description', e.target.value)} className="border-slate-300" data-testid={`${type}-desc-input`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Montant (DZD) *</Label>
              <Input type="number" min="0" step="0.01" value={form.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} className="border-slate-300" data-testid={`${type}-amount-input`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Date</Label>
              <Input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} className="border-slate-300" data-testid={`${type}-date-input`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Catégorie</Label>
              <Select value={form.category || cats[0].v} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="border-slate-300" data-testid={`${type}-cat-select`}><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Paiement</Label>
              <Select value={form.payment_method || 'virement'} onValueChange={(v) => set('payment_method', v)}>
                <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">{isRevenue ? 'Client' : 'Fournisseur'}</Label>
              <Input value={form[isRevenue ? 'client_name' : 'supplier_name'] || ''} onChange={(e) => set(isRevenue ? 'client_name' : 'supplier_name', e.target.value)} className="border-slate-300" data-testid={`${type}-party-input`} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">Annuler</Button>
            <Button type="submit" disabled={saving} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid={`${type}-form-submit`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ INVOICES TAB ============
function InvoicesTab({ onChanged }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/accounting/invoices', { params });
      setItems(data.items); setTotal(data.total); setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  const markStatus = async (id, status) => {
    try { await api.put(`/accounting/invoices/${id}`, { status }); fetch(); onChanged(); setStatusTarget(null); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/accounting/invoices/${deleteTarget.id}`); setDeleteTarget(null); fetch(); onChanged(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher facture..." className="pl-10 border-slate-300" data-testid="invoice-search" />
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="add-invoice-btn">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle facture
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4"><Receipt className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Aucune facture</h3>
            <p className="text-sm text-slate-500">Créez votre première facture</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">N° Facture</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Client</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Échéance</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((inv) => {
                    const st = INV_STATUS[inv.status] || INV_STATUS.en_attente;
                    const StIcon = st.icon;
                    return (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50" data-testid={`invoice-row-${inv.id}`}>
                        <TableCell className="font-mono text-sm font-medium text-[#0A3D73]">{inv.invoice_number}</TableCell>
                        <TableCell className="font-medium text-slate-900">{inv.client_name}</TableCell>
                        <TableCell className="text-slate-600 hidden md:table-cell">{fmtDate(inv.created_at)}</TableCell>
                        <TableCell className="text-slate-600 hidden md:table-cell">{fmtDate(inv.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${st.color}`}>
                            <StIcon className="w-3 h-3 mr-1" />{st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">{fmt(inv.total)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {inv.status !== 'payee' && (
                                <DropdownMenuItem onClick={() => markStatus(inv.id, 'payee')} data-testid={`inv-mark-paid-${inv.id}`}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Marquer payée
                                </DropdownMenuItem>
                              )}
                              {inv.status === 'en_attente' && (
                                <DropdownMenuItem onClick={() => markStatus(inv.id, 'en_retard')}>
                                  <AlertTriangle className="w-4 h-4 mr-2 text-red-600" /> Marquer en retard
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setDeleteTarget(inv)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">Page {page} sur {pages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-slate-300 h-8"><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="border-slate-300 h-8"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invoice Form */}
      <InvoiceFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { fetch(); onChanged(); }} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>La facture {deleteTarget?.invoice_number} sera supprimée définitivement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ INVOICE FORM DIALOG ============
function InvoiceFormDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ client_name: '', client_email: '', client_address: '', items: [{ description: '', quantity: 1, unit_price: 0 }], discount: 0, notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ client_name: '', client_email: '', client_address: '', items: [{ description: '', quantity: 1, unit_price: 0 }], discount: 0, notes: '' });
      setError('');
    }
  }, [open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setItem = (idx, k, v) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [k]: v };
    setForm(p => ({ ...p, items: newItems }));
  };
  const addLine = () => setForm(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unit_price: 0 }] }));
  const removeLine = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const total = subtotal - (form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) { setError('Client obligatoire'); return; }
    if (form.items.length === 0) { setError('Ajoutez au moins une ligne'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/accounting/invoices', form);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="invoice-form-dialog">
        <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Client *</Label>
              <Input value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className="border-slate-300" data-testid="invoice-client-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Email</Label>
              <Input value={form.client_email} onChange={(e) => set('client_email', e.target.value)} className="border-slate-300" data-testid="invoice-email-input" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Adresse</Label>
              <Input value={form.client_address} onChange={(e) => set('client_address', e.target.value)} className="border-slate-300" />
            </div>
          </div>

          {/* Invoice Lines */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Articles</Label>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {idx === 0 && <span className="text-xs text-slate-500 mb-1 block">Description</span>}
                    <Input value={item.description} onChange={(e) => setItem(idx, 'description', e.target.value)} placeholder="Article..." className="border-slate-300 text-sm" data-testid={`inv-item-desc-${idx}`} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <span className="text-xs text-slate-500 mb-1 block">Qté</span>}
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => setItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="border-slate-300 text-sm" />
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <span className="text-xs text-slate-500 mb-1 block">Prix unit.</span>}
                    <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => setItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="border-slate-300 text-sm" data-testid={`inv-item-price-${idx}`} />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-sm font-medium text-slate-700 flex-1 text-right">{fmt((item.quantity || 0) * (item.unit_price || 0))}</span>
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => removeLine(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2 border-slate-300 text-sm" data-testid="add-invoice-line">
              <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
            </Button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 border-t pt-3">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Sous-total</span><span className="font-medium">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600">Remise</span>
                <Input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => set('discount', parseFloat(e.target.value) || 0)} className="border-slate-300 w-28 h-7 text-sm text-right" data-testid="invoice-discount" />
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span className="text-[#0A3D73]">{fmt(total)}</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Notes</Label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D73]/50 resize-none" />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">Annuler</Button>
            <Button type="submit" disabled={saving} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="invoice-form-submit">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Créer la facture
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// ============ CLIENTS ACCOUNTING TAB ============
function ClientsAccountingTab() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients/accounting', { params: { sort_by: sortBy, sort_order: sortOrder, limit: 100 } });
      setClients(data.items || []); setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [sortBy, sortOrder]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const SortIcon = ({ field }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline cursor-pointer ${sortBy === field ? 'text-[#0A3D73]' : 'text-slate-400'}`} />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{total} client{total !== 1 ? 's' : ''} — triez par colonne</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center"><p className="text-sm text-slate-500">Aucun client</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('name')}>
                    Nom <SortIcon field="name" />
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider cursor-pointer text-center" onClick={() => toggleSort('purchase_count')}>
                    Nb achats <SortIcon field="purchase_count" />
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider cursor-pointer text-right" onClick={() => toggleSort('total_amount')}>
                    Total achats <SortIcon field="total_amount" />
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right hidden lg:table-cell">Dette</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right hidden lg:table-cell">Payé</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider cursor-pointer hidden md:table-cell" onClick={() => toggleSort('last_purchase')}>
                    Dernier achat <SortIcon field="last_purchase" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const hasDebt = (c.total_dette || 0) > 0;
                  return (
                  <TableRow key={c.id} className={`hover:bg-slate-50/50 ${hasDebt ? 'bg-red-50/30' : ''}`}>
                    <TableCell className="font-medium text-slate-900">{c.name}{hasDebt && <span className="ml-2 text-xs text-red-600 font-normal">(dette)</span>}</TableCell>
                    <TableCell className="text-slate-600 hidden md:table-cell">{c.phone || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{c.purchase_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#0A3D73]">{fmt(c.total_amount)}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{(c.total_dette || 0) > 0 ? <span className="font-semibold text-red-700">{fmt(c.total_dette)}</span> : <span className="text-slate-400">-</span>}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{(c.total_paye || 0) > 0 ? <span className="font-semibold text-emerald-700">{fmt(c.total_paye)}</span> : <span className="text-slate-400">-</span>}</TableCell>
                    <TableCell className="text-slate-600 hidden md:table-cell">{fmtDate(c.last_purchase)}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
