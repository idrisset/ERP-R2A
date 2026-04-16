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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Users,
  ChevronLeft, ChevronRight, ShoppingBag, Eye
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/clients', { params });
      setClients(data.items); setTotal(data.total); setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/clients/${deleteTarget.id}`); setDeleteTarget(null); fetch(); }
    catch (err) { console.error(err); }
  };

  const viewPurchases = async (client) => {
    setHistoryClient(client);
    setLoadingPurchases(true);
    try {
      const { data } = await api.get(`/clients/${client.id}/purchases`);
      setPurchases(data.items);
    } catch (err) { console.error(err); }
    finally { setLoadingPurchases(false); }
  };

  const fmt = (v) => v != null && v !== 0 ? new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v) + ' DZD' : '-';
  const fmtDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return '-'; } };

  return (
    <div className="space-y-5" data-testid="clients-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-sm text-slate-500">{total} client{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditClient(null); setFormOpen(true); }} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="new-client-btn">
          <Plus className="w-4 h-4 mr-2" /> Nouveau client
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher par nom, téléphone, email..." className="pl-10 border-slate-300" data-testid="client-search-input" />
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4"><Users className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{search ? 'Aucun résultat' : 'Aucun client'}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Nom</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Email</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Adresse</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-center">Achats</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                    <TableCell className="text-slate-600 hidden md:table-cell">{c.phone || '-'}</TableCell>
                    <TableCell className="text-slate-600 hidden md:table-cell">{c.email || '-'}</TableCell>
                    <TableCell className="text-slate-600 hidden lg:table-cell max-w-[180px] truncate">{c.address || '-'}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-xs">{c.total_purchases || 0}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewPurchases(c)}><Eye className="w-4 h-4 mr-2" /> Historique achats</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditClient(c); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(c)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} sur {pages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-slate-300 h-8"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="border-slate-300 h-8"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Client Form */}
      <ClientForm open={formOpen} onClose={() => { setFormOpen(false); setEditClient(null); }} client={editClient} onSaved={fetch} />

      {/* Purchase History */}
      <Dialog open={!!historyClient} onOpenChange={(v) => !v && setHistoryClient(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="purchase-history-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-[#0A3D73]" /> Historique - {historyClient?.name}</DialogTitle>
          </DialogHeader>
          {loadingPurchases ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73] mx-auto" /></div>
          ) : purchases.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Aucun achat enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">N° Vente</TableHead><TableHead className="text-xs">Articles</TableHead><TableHead className="text-xs text-right">Total</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{fmtDate(p.created_at)}</TableCell>
                      <TableCell className="text-sm font-mono text-[#0A3D73]">{p.sale_number}</TableCell>
                      <TableCell className="text-sm">{(p.items || []).map(it => `${it.reference} x${it.quantity}`).join(', ')}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">{fmt(p.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle><AlertDialogDescription>{deleteTarget?.name} sera archivé.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientForm({ open, onClose, client, onSaved }) {
  const isEdit = !!client;
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) setForm({ name: client.name || '', phone: client.phone || '', email: client.email || '', address: client.address || '' });
    else setForm({ name: '', phone: '', email: '', address: '' });
    setError('');
  }, [client, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) await api.put(`/clients/${client.id}`, form);
      else await api.post('/clients', form);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="client-form-dialog">
        <DialogHeader><DialogTitle>{isEdit ? 'Modifier le client' : 'Nouveau client'}</DialogTitle></DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="border-slate-300" data-testid="client-name-input" /></div>
          <div className="space-y-1.5"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="border-slate-300" data-testid="client-phone-input" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="border-slate-300" /></div>
          <div className="space-y-1.5"><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="border-slate-300" /></div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">Annuler</Button>
            <Button type="submit" disabled={saving} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="client-form-submit">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
