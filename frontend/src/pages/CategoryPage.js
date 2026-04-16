import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  ArrowLeft, Plus, Search, MoreHorizontal, Pencil, Trash2,
  ChevronLeft, ChevronRight, Package, Archive, Loader2,
  Download, FileUp, CheckSquare, X
} from 'lucide-react';

const CATEGORY_NAMES = {
  automate: 'Automate', variateur: 'Variateur', verin_pneumatique: 'Vérin Pneumatique',
  vapeur: 'Vapeur', relais_securite: 'Relais de sécurité + Capteur', ecran_siemens: 'Ecran SIEMENS',
  hydrolique: 'Hydrolique', pneumatique: 'Pneumatique', encodeur_occasion: 'Encodeur occasion',
  instrument: 'Instrument', compteur: 'Compteur', capteur: 'Capteur',
};

const STATE_LABELS = { neuf: 'Neuf', occasion: 'Occasion', obsolete: 'Obsolète' };
const STATE_COLORS = {
  neuf: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  occasion: 'bg-amber-50 text-amber-700 border-amber-200',
  obsolete: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const categoryName = CATEGORY_NAMES[categoryId] || categoryId;
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const LIMIT = 50;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { category: categoryId, page, limit: LIMIT };
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products); setTotal(data.total); setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [categoryId, page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  // Single delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.delete(`/products/${deleteTarget.id}`); setDeleteTarget(null); fetchProducts(); }
    catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await api.post('/products/bulk-delete', { ids: Array.from(selected) });
      setSelected(new Set()); setBulkDeleteOpen(false); fetchProducts();
    } catch (err) { console.error(err); }
    finally { setBulkDeleting(false); }
  };

  // Selection helpers
  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map(p => p.id)));
  };

  // Export
  const exportCategory = () => {
    const token = localStorage.getItem('access_token');
    window.open(`${process.env.REACT_APP_BACKEND_URL}/api/export/products?category=${categoryId}&token=${token}`, '_blank');
  };

  // Import file
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', categoryId);
      const { data: preview } = await api.post('/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data: result } = await api.post('/import/execute', { items: preview.all_data, category: categoryId, filename: file.name });
      setImportResult(result);
      fetchProducts();
    } catch (err) { console.error(err); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const openAdd = () => { setEditProduct(null); setFormOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setFormOpen(true); };
  const formatPrice = (v) => v == null || v === 0 ? '-' : new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v) + ' DZD';
  const formatDate = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '-'; } };

  return (
    <div className="space-y-4" data-testid="category-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-900" data-testid="category-back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{categoryName}</h1>
            <p className="text-sm text-slate-500">{total} article{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import */}
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImportFile} data-testid="import-file-input" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="border-slate-300 text-slate-600" data-testid="import-btn">
            {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
            {importing ? 'Import...' : 'Importer'}
          </Button>
          {/* Export */}
          <Button variant="outline" onClick={exportCategory} className="border-slate-300 text-slate-600" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" /> Exporter
          </Button>
          {/* Corbeille */}
          <Button variant="outline" onClick={() => navigate('/corbeille')} className="border-slate-300 text-slate-600" data-testid="trash-btn">
            <Archive className="w-4 h-4 mr-2" /> Corbeille
          </Button>
          {/* Ajouter */}
          <Button onClick={openAdd} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center justify-between" data-testid="import-result">
          <span className="text-sm text-emerald-800">
            Import terminé : <strong>{importResult.created}</strong> créés, <strong>{importResult.updated}</strong> mis à jour, <strong>{importResult.error_count}</strong> erreurs
          </span>
          <button onClick={() => setImportResult(null)}><X className="w-4 h-4 text-emerald-600" /></button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-[#0A3D73] text-white rounded-md px-4 py-2.5 flex items-center justify-between" data-testid="bulk-bar">
          <span className="text-sm font-medium">{selected.size} article{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-white/80 hover:text-white hover:bg-white/10 h-8">
              <X className="w-4 h-4 mr-1" /> Annuler
            </Button>
            <Button size="sm" onClick={() => setBulkDeleteOpen(true)} className="bg-red-600 hover:bg-red-700 text-white h-8" data-testid="bulk-delete-btn">
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer ({selected.size})
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher par référence, nom, marque..." className="pl-10 border-slate-300" data-testid="category-search-input" />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4"><Package className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{search ? 'Aucun résultat' : 'Aucun produit'}</h3>
            <p className="text-sm text-slate-500 mb-4">{search ? `Aucun résultat pour "${search}"` : `Ajoutez ou importez des articles`}</p>
            {!search && (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-slate-300"><FileUp className="w-4 h-4 mr-2" /> Importer un fichier</Button>
                <Button onClick={openAdd} className="bg-[#0A3D73] hover:bg-[#082E56] text-white"><Plus className="w-4 h-4 mr-2" /> Ajouter</Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-10">
                      <Checkbox checked={selected.size === products.length && products.length > 0} onCheckedChange={toggleSelectAll} data-testid="select-all" />
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Référence</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Nom</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Marque</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-center">Qté</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Prix vente</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Emplacement</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">État</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const isLow = p.quantity > 0 && p.quantity <= (p.stock_minimum || 5);
                    const isOut = p.quantity === 0;
                    return (
                      <TableRow key={p.id} className={`hover:bg-slate-50/50 ${selected.has(p.id) ? 'bg-blue-50/50' : ''}`} data-testid={`product-row-${p.id}`}>
                        <TableCell>
                          <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium text-[#0A3D73]">{p.reference}</TableCell>
                        <TableCell className="font-medium text-slate-900 max-w-[200px] truncate">{p.name}</TableCell>
                        <TableCell className="text-slate-600 hidden md:table-cell">{p.brand || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-sm font-semibold ${isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'text-slate-900'}`}>
                            {p.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 hidden lg:table-cell">{formatPrice(p.sale_price)}</TableCell>
                        <TableCell className="text-slate-600 hidden lg:table-cell">{p.location || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={`text-xs ${STATE_COLORS[p.state] || ''}`}>{STATE_LABELS[p.state] || p.state}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
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
                <p className="text-sm text-slate-500">Page {page} sur {pages} ({total} résultat{total !== 1 ? 's' : ''})</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="border-slate-300 h-8"><ChevronLeft className="w-4 h-4" /></Button>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    let pn; if (pages <= 5) pn = i + 1; else if (page <= 3) pn = i + 1; else if (page >= pages - 2) pn = pages - 4 + i; else pn = page - 2 + i;
                    return <Button key={pn} variant={pn === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(pn)} className={`h-8 w-8 ${pn === page ? 'bg-[#0A3D73] text-white' : 'border-slate-300'}`}>{pn}</Button>;
                  })}
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="border-slate-300 h-8"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Form */}
      <ProductForm open={formOpen} onClose={() => { setFormOpen(false); setEditProduct(null); }} product={editProduct} defaultCategory={categoryId} onSaved={fetchProducts} />

      {/* Delete single */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription><strong>{deleteTarget?.reference}</strong> ({deleteTarget?.name}) sera déplacé dans la corbeille.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(v) => !v && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer {selected.size} produit{selected.size > 1 ? 's' : ''} ?</AlertDialogTitle>
            <AlertDialogDescription>Ces produits seront déplacés dans la corbeille. Vous pourrez les restaurer ultérieurement.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-red-600 hover:bg-red-700 text-white" data-testid="confirm-bulk-delete">
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Supprimer ({selected.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
