import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  ArrowLeft, Search, RotateCcw, Trash2, Loader2, Archive,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const CATEGORY_NAMES = {
  hydraulique: 'Hydraulique', pneumatique: 'Pneumatique', electrique: 'Électrique',
  automatisme: 'Automatisme', roulements: 'Roulements', moteurs: 'Moteurs',
  capteurs: 'Capteurs', variateurs: 'Variateurs', outillage: 'Outillage',
  quincaillerie: 'Quincaillerie', securite: 'Sécurité', maintenance: 'Maintenance',
};

export default function TrashPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const LIMIT = 50;

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const params = { archived: true, page, limit: LIMIT };
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Erreur chargement corbeille:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchTrash(); }, [fetchTrash]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await api.post(`/products/${restoreTarget.id}/restore`);
      setRestoreTarget(null);
      fetchTrash();
    } catch (err) {
      console.error('Erreur restauration:', err);
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '-'; }
  };

  return (
    <div className="space-y-5" data-testid="trash-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900"
            data-testid="trash-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <Archive className="w-6 h-6 text-slate-500" /> Corbeille
            </h1>
            <p className="text-sm text-slate-500">{total} produit{total !== 1 ? 's' : ''} archivé{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher dans la corbeille..."
          className="pl-10 border-slate-300"
          data-testid="trash-search-input"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#0A3D73]" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4">
              <Archive className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Corbeille vide</h3>
            <p className="text-sm text-slate-500">Aucun produit supprimé</p>
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
                    <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Supprimé le</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/50" data-testid={`trash-row-${p.id}`}>
                      <TableCell className="font-mono text-sm font-medium text-slate-600">{p.reference}</TableCell>
                      <TableCell className="text-slate-900">{p.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs border-slate-200">
                          {CATEGORY_NAMES[p.category] || p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm hidden md:table-cell">{formatDate(p.archived_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setRestoreTarget(p)}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
                          data-testid={`restore-btn-${p.id}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restaurer
                        </Button>
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
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="border-slate-300 h-8" data-testid="trash-pagination-prev">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="border-slate-300 h-8" data-testid="trash-pagination-next">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(v) => !v && setRestoreTarget(null)}>
        <AlertDialogContent data-testid="restore-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le produit <strong>{restoreTarget?.reference}</strong> ({restoreTarget?.name}) sera restauré et remis en stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300" data-testid="restore-cancel-btn">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoring}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="restore-confirm-btn"
            >
              {restoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
