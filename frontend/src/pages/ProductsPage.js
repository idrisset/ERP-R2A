import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2,
  ChevronLeft, ChevronRight, Package, Archive, Loader2
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

export default function ProductsPage() {
  const navigate = useNavigate();
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

  const LIMIT = 50;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  const formatPrice = (v) => {
    if (v == null || v === 0) return '-';
    return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v) + ' DZD';
  };

  return (
    <div className="space-y-5" data-testid="products-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Tous les Produits</h1>
          <p className="text-sm text-slate-500">{total} article{total !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/corbeille')} className="border-slate-300 text-slate-600" data-testid="all-trash-btn">
            <Archive className="w-4 h-4 mr-2" /> Corbeille
          </Button>
          <Button onClick={() => { setEditProduct(null); setFormOpen(true); }} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="add-product-global-btn">
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Rechercher par référence, nom, marque..." className="pl-10 border-slate-300" data-testid="products-search-input" />
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" /></div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4"><Package className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{search ? 'Aucun résultat' : 'Aucun produit'}</h3>
            <p className="text-sm text-slate-500 mb-4">{search ? `Aucun produit ne correspond à "${search}"` : 'Ajoutez votre premier produit'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Référence</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Nom</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Catégorie</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Marque</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-center">Qté</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden lg:table-cell">Prix vente</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">État</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const isLow = p.quantity > 0 && p.quantity <= (p.stock_minimum || 5);
                    const isOut = p.quantity === 0;
                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-sm font-medium text-[#0A3D73]">{p.reference}</TableCell>
                        <TableCell className="font-medium text-slate-900 max-w-[200px] truncate">{p.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs border-slate-200">{CATEGORY_NAMES[p.category] || p.category}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 hidden md:table-cell">{p.brand || '-'}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-sm font-semibold ${isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'text-slate-900'}`}>{p.quantity}</span>
                        </TableCell>
                        <TableCell className="text-slate-600 hidden lg:table-cell">{formatPrice(p.sale_price)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={`text-xs ${STATE_COLORS[p.state] || ''}`}>{STATE_LABELS[p.state] || p.state}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditProduct(p); setFormOpen(true); }}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
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
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="border-slate-300 h-8"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProductForm open={formOpen} onClose={() => { setFormOpen(false); setEditProduct(null); }} product={editProduct} defaultCategory="" onSaved={fetchProducts} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>Le produit <strong>{deleteTarget?.reference}</strong> sera déplacé dans la corbeille.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
