import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import {
  Plus, Search, FileText, Truck, Download, Eye, Loader2, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v || 0) + ' DZD';
const fmtDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '-'; } };

export default function DocumentsPage() {
  const [tab, setTab] = useState('facture');

  return (
    <div className="space-y-6" data-testid="documents-page">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Documents</h1>
        <p className="text-sm text-slate-500">Factures et bons de livraison</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 border border-slate-200">
          <TabsTrigger value="facture" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-factures">
            <FileText className="w-4 h-4 mr-1.5" /> Factures
          </TabsTrigger>
          <TabsTrigger value="bl" className="data-[state=active]:bg-white data-[state=active]:text-[#0A3D73]" data-testid="tab-bl">
            <Truck className="w-4 h-4 mr-1.5" /> Bons de livraison
          </TabsTrigger>
        </TabsList>
        <TabsContent value="facture" className="mt-4"><DocList docType="facture" /></TabsContent>
        <TabsContent value="bl" className="mt-4"><DocList docType="bl" /></TabsContent>
      </Tabs>
    </div>
  );
}

function DocList({ docType }) {
  const label = docType === 'facture' ? 'Facture' : 'Bon de livraison';
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { doc_type: docType, page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/documents', { params });
      setItems(data.items); setTotal(data.total); setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [docType, page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  const downloadPdf = (docId) => {
    const token = localStorage.getItem('access_token');
    window.open(`${process.env.REACT_APP_BACKEND_URL}/api/documents/${docId}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={`Rechercher par n° ou client...`} className="pl-10 border-slate-300" data-testid={`${docType}-search`} />
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid={`new-${docType}-btn`}>
          <Plus className="w-4 h-4 mr-2" /> {label}
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4">
              {docType === 'facture' ? <FileText className="w-7 h-7 text-slate-400" /> : <Truck className="w-7 h-7 text-slate-400" />}
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{search ? 'Aucun résultat' : `Aucun ${label.toLowerCase()}`}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">N°</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Client</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Articles</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Total</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d._id} className="hover:bg-slate-50/50" data-testid={`doc-row-${d._id}`}>
                    <TableCell className="font-mono text-sm font-semibold text-[#0A3D73]">{d.doc_number}</TableCell>
                    <TableCell className="text-sm text-slate-600">{fmtDate(d.created_at)}</TableCell>
                    <TableCell className="font-medium text-slate-900">{d.client_name}</TableCell>
                    <TableCell className="text-sm text-slate-500 hidden md:table-cell">{(d.items || []).length} article{(d.items || []).length > 1 ? 's' : ''}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{fmt(d.total)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewDoc(d)} data-testid={`preview-${d._id}`}>
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPdf(d._id)} data-testid={`download-${d._id}`}>
                          <Download className="w-4 h-4 text-[#0A3D73]" />
                        </Button>
                      </div>
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

      <DocForm open={formOpen} docType={docType} onClose={() => setFormOpen(false)} onSaved={fetch} />
      <DocPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} onDownload={downloadPdf} />
    </div>
  );
}

// ============ Document Form ============
function DocForm({ open, docType, onClose, onSaved }) {
  const label = docType === 'facture' ? 'Facture' : 'Bon de livraison';
  const [form, setForm] = useState({ client_name: '', client_phone: '', client_email: '', client_address: '', items: [{ reference: '', name: '', quantity: 1, unit_price: 0 }], discount: 0, notes: '' });
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ client_name: '', client_phone: '', client_email: '', client_address: '', items: [{ reference: '', name: '', quantity: 1, unit_price: 0 }], discount: 0, notes: '' });
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProductResults([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await api.get('/products', { params: { search: productSearch, limit: 6 } }); setProductResults(data.products); }
      catch { setProductResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setItem = (idx, k, v) => { const n = [...form.items]; n[idx] = { ...n[idx], [k]: v }; setForm(p => ({ ...p, items: n })); };
  const addItem = (p) => {
    setForm(prev => ({ ...prev, items: [...prev.items.filter(i => i.reference), { reference: p.reference, name: p.name || p.reference, quantity: 1, unit_price: p.sale_price || 0 }] }));
    setProductSearch(''); setProductResults([]);
  };
  const addBlankLine = () => setForm(p => ({ ...p, items: [...p.items, { reference: '', name: '', quantity: 1, unit_price: 0 }] }));
  const removeLine = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const total = subtotal - (form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) { setError('Client obligatoire'); return; }
    if (!form.items.some(i => i.reference)) { setError('Ajoutez au moins un article'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/documents', { ...form, doc_type: docType, items: form.items.filter(i => i.reference) });
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid={`${docType}-form-dialog`}>
        <DialogHeader><DialogTitle>Nouveau {label}</DialogTitle></DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Nom du client *</Label><Input value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className="border-slate-300" data-testid="doc-client-name" /></div>
            <div className="space-y-1.5"><Label>Téléphone</Label><Input value={form.client_phone} onChange={(e) => set('client_phone', e.target.value)} className="border-slate-300" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.client_email} onChange={(e) => set('client_email', e.target.value)} className="border-slate-300" /></div>
            <div className="space-y-1.5"><Label>Adresse</Label><Input value={form.client_address} onChange={(e) => set('client_address', e.target.value)} className="border-slate-300" /></div>
          </div>

          {/* Product search */}
          <div className="space-y-2">
            <Label>Ajouter un article</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Rechercher par référence..." className="pl-10 border-slate-300" data-testid="doc-product-search" />
              {productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg z-50 mt-1 max-h-40 overflow-y-auto">
                  {productResults.map(p => (
                    <button key={p.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between" onClick={() => addItem(p)}>
                      <span className="font-mono text-[#0A3D73] font-medium">{p.reference}</span>
                      <span className="text-slate-400">{p.brand} | {fmt(p.sale_price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          {form.items.length > 0 && (
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-slate-50">
                  <TableHead className="text-xs w-36">Référence</TableHead>
                  <TableHead className="text-xs">Désignation</TableHead>
                  <TableHead className="text-xs w-20">Qté</TableHead>
                  <TableHead className="text-xs w-28">Prix unit.</TableHead>
                  <TableHead className="text-xs w-24 text-right">Total</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {form.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Input value={item.reference} onChange={(e) => setItem(idx, 'reference', e.target.value)} className="h-7 text-sm border-slate-300" /></TableCell>
                      <TableCell><Input value={item.name} onChange={(e) => setItem(idx, 'name', e.target.value)} className="h-7 text-sm border-slate-300" /></TableCell>
                      <TableCell><Input type="number" min="1" value={item.quantity} onChange={(e) => setItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="h-7 text-sm border-slate-300 w-16" /></TableCell>
                      <TableCell><Input type="number" min="0" step="1" value={item.unit_price} onChange={(e) => setItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="h-7 text-sm border-slate-300 w-24" /></TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmt((item.quantity || 0) * (item.unit_price || 0))}</TableCell>
                      <TableCell><button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">x</button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addBlankLine} className="border-slate-300 text-sm"><Plus className="w-3.5 h-3.5 mr-1" /> Ligne</Button>

          <div className="flex justify-end">
            <div className="w-56 space-y-2 border-t pt-3">
              <div className="flex justify-between text-sm"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm items-center"><span>Remise</span><Input type="number" min="0" value={form.discount} onChange={(e) => set('discount', parseFloat(e.target.value) || 0)} className="w-24 h-7 text-sm text-right border-slate-300" /></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-[#0A3D73]">{fmt(total)}</span></div>
            </div>
          </div>

          <div className="space-y-1.5"><Label>Notes</Label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D73]/50 resize-none" /></div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">Annuler</Button>
            <Button type="submit" disabled={saving} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid={`${docType}-form-submit`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ Document Preview ============
function DocPreview({ doc, onClose, onDownload }) {
  if (!doc) return null;
  const isFacture = doc.doc_type === 'facture';
  const items = doc.items || [];
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);

  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="doc-preview-dialog">
        {/* Preview header */}
        <div className="bg-[#0A3D73] text-white p-6 rounded-t-md -mx-6 -mt-6 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">{isFacture ? 'FACTURE' : 'BON DE LIVRAISON'}</h2>
              <p className="text-white/70 text-sm mt-1">N° {doc.doc_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Date</p>
              <p className="font-medium">{fmtDate(doc.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Client</p>
          <p className="font-semibold text-slate-900">{doc.client_name}</p>
          {doc.client_phone && <p className="text-sm text-slate-600">Tél: {doc.client_phone}</p>}
          {doc.client_email && <p className="text-sm text-slate-600">{doc.client_email}</p>}
          {doc.client_address && <p className="text-sm text-slate-600">{doc.client_address}</p>}
        </div>

        {/* Items */}
        <Table>
          <TableHeader><TableRow className="bg-slate-50">
            <TableHead className="text-xs">#</TableHead>
            <TableHead className="text-xs">Référence</TableHead>
            <TableHead className="text-xs">Désignation</TableHead>
            <TableHead className="text-xs text-center">Qté</TableHead>
            <TableHead className="text-xs text-right">Prix Unit.</TableHead>
            <TableHead className="text-xs text-right">Total</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-sm">{idx + 1}</TableCell>
                <TableCell className="font-mono text-sm text-[#0A3D73] font-medium">{item.reference}</TableCell>
                <TableCell className="text-sm">{item.name || item.description}</TableCell>
                <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                <TableCell className="text-sm text-right">{fmt(item.unit_price)}</TableCell>
                <TableCell className="text-sm text-right font-medium">{fmt((item.quantity || 0) * (item.unit_price || 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-56 space-y-2">
            <div className="flex justify-between text-sm"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
            {doc.discount > 0 && <div className="flex justify-between text-sm"><span>Remise</span><span>-{fmt(doc.discount)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-[#0A3D73]">{fmt(doc.total)}</span></div>
          </div>
        </div>

        {doc.notes && <p className="text-sm text-slate-500 mt-4 italic">Notes: {doc.notes}</p>}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-300">Fermer</Button>
          <Button onClick={() => onDownload(doc._id)} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="preview-download-btn">
            <Download className="w-4 h-4 mr-2" /> Télécharger PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
