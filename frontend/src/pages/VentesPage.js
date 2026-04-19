import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Plus, Search, Loader2, ShoppingCart, TrendingUp, Download,
  ChevronLeft, ChevronRight, Trophy
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const fmt = (v) => new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v || 0) + ' DZD';
const fmtDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '-'; } };

export default function VentesPage() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [groupedMonths, setGroupedMonths] = useState([]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 200, grouped: true };
      if (search) params.search = search;
      const { data } = await api.get('/sales', { params });
      setGroupedMonths(data.months || []);
      setTotal(data.total); setPages(data.pages);
      // Flatten for backward compat
      const allSales = (data.months || []).flatMap(m => m.sales);
      setSales(allSales);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/sales/summary');
      setSummary(data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchSales(); fetchSummary(); }, [fetchSales, fetchSummary]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  const exportSales = () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/export/sales`;
    const token = localStorage.getItem('access_token');
    window.open(`${url}?token=${token}`, '_blank');
  };

  const chartData = (summary?.months || []).map(m => {
    const [y, mo] = m.month.split('-');
    return { name: MONTH_NAMES[parseInt(mo) - 1]?.substring(0, 3) || mo, Ventes: m.total };
  });

  return (
    <div className="space-y-6" data-testid="ventes-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ventes</h1>
          <p className="text-sm text-slate-500">Suivi des ventes et historique</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSales} className="border-slate-300" data-testid="export-sales-btn">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => setFormOpen(true)} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="new-sale-btn">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle vente
          </Button>
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
            <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center mb-3"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <p className="text-2xl font-bold text-slate-900">{fmt(summary.month_total)}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Ventes du mois ({summary.month_count})</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Évolution des ventes</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="Ventes" fill="#0A3D73" radius={[3, 3, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Top products */}
      {summary?.top_products?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Top articles vendus ce mois</h3>
          <div className="flex flex-wrap gap-2">
            {summary.top_products.slice(0, 5).map((p, i) => (
              <Badge key={i} variant="outline" className="text-xs py-1 px-3">
                {p._id || p.name} <span className="ml-1 font-bold text-[#0A3D73]">x{p.total_qty}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search + list */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher par client ou n° vente..." className="pl-10 border-slate-300" data-testid="sales-search-input" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : groupedMonths.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-md py-16 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4"><ShoppingCart className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{search ? 'Aucun résultat' : 'Aucune vente'}</h3>
          </div>
        ) : (
          groupedMonths.map((monthGroup) => {
            const [y, m] = monthGroup.month.split('-');
            const monthLabel = `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
            return (
              <div key={monthGroup.month} className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                <div className="bg-[#0A3D73] text-white px-4 py-2.5 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider">{monthLabel}</h3>
                  <span className="text-sm text-white/70">{monthGroup.count} vente{monthGroup.count > 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">N° Vente</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Client</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Articles</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Vendeur</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthGroup.sales.map((s, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-sm font-medium text-[#0A3D73]">{s.sale_number}</TableCell>
                          <TableCell className="text-sm text-slate-600">{fmtDate(s.created_at)}</TableCell>
                          <TableCell className="font-medium text-slate-900">{s.client_name}</TableCell>
                          <TableCell className="text-sm text-slate-600 hidden md:table-cell max-w-[200px] truncate">
                            {(s.items || []).map(it => `${it.reference} x${it.quantity}`).join(', ')}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 hidden md:table-cell">{s.sold_by_name}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">{fmt(s.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={5} className="text-sm font-semibold text-right text-slate-700">Total {monthLabel} :</TableCell>
                        <TableCell className="text-right font-bold text-[#0A3D73]">{fmt(monthGroup.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })
        )}
      </div>

      <SaleForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { fetchSales(); fetchSummary(); }} />
    </div>
  );
}

// ============ SALE FORM ============
function SaleForm({ open, onClose, onSaved }) {
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientName, setClientName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setItems([]); setSelectedClient(null); setClientName(''); setDiscount(0); setError(''); }
  }, [open]);

  // Search clients
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) { setClients([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/clients', { params: { search: clientSearch, limit: 5 } });
        setClients(data.items);
      } catch { setClients([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // Search products
  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProductResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/products', { params: { search: productSearch, limit: 8 } });
        setProductResults(data.products);
      } catch { setProductResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProduct = (p) => {
    if (items.find(i => i.product_id === p.id)) return;
    setItems(prev => [...prev, { product_id: p.id, reference: p.reference, name: p.name, quantity: 1, unit_price: p.sale_price || 0 }]);
    setProductSearch('');
    setProductResults([]);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal - discount;

  const handleSubmit = async () => {
    const name = selectedClient?.name || clientName;
    if (!name.trim()) { setError('Client obligatoire'); return; }
    if (items.length === 0) { setError('Ajoutez au moins un article'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/sales', {
        client_id: selectedClient?.id || null,
        client_name: name,
        items,
        discount,
      });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="sale-form-dialog">
        <DialogHeader><DialogTitle>Nouvelle vente</DialogTitle></DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

        {/* Client */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Client *</Label>
          {selectedClient ? (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border">
              <span className="text-sm font-medium flex-1">{selectedClient.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedClient(null)} className="h-7 text-xs">Changer</Button>
            </div>
          ) : (
            <div className="relative">
              <Input value={clientSearch || clientName} onChange={(e) => { setClientSearch(e.target.value); setClientName(e.target.value); }} placeholder="Rechercher ou saisir le nom du client..." className="border-slate-300" data-testid="sale-client-input" />
              {clients.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg z-50 mt-1 max-h-40 overflow-y-auto">
                  {clients.map(c => (
                    <button key={c.id} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0" onClick={() => { setSelectedClient(c); setClientName(c.name); setClients([]); setClientSearch(''); }}>
                      <span className="font-medium">{c.name}</span> {c.phone && <span className="text-slate-400 ml-2">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add products */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Articles</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Rechercher un article par référence ou nom..." className="pl-10 border-slate-300" data-testid="sale-product-search" />
            {productResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                {productResults.map(p => (
                  <button key={p.id} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between" onClick={() => addProduct(p)}>
                    <span><span className="font-mono font-medium text-[#0A3D73]">{p.reference}</span> <span className="text-slate-600 ml-2">{p.name}</span></span>
                    <span className="text-slate-400">Qté: {p.quantity} | {fmt(p.sale_price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="text-xs">Article</TableHead>
                <TableHead className="text-xs w-20">Qté</TableHead>
                <TableHead className="text-xs w-28">Prix unit.</TableHead>
                <TableHead className="text-xs w-24 text-right">Total</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm"><span className="font-mono text-[#0A3D73]">{item.reference}</span></TableCell>
                    <TableCell><Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-sm border-slate-300 w-16" /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="h-7 text-sm border-slate-300 w-24" /></TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(item.quantity * item.unit_price)}</TableCell>
                    <TableCell><button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs">x</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm items-center"><span>Remise</span>
                <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 h-7 text-sm text-right border-slate-300" />
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-[#0A3D73]">{fmt(total)}</span></div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-300">Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="sale-form-submit">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Enregistrer la vente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
