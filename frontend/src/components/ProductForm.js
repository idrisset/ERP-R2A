import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const CATEGORY_OPTIONS = [
  { value: 'automate', label: 'Automate' },
  { value: 'variateur', label: 'Variateur' },
  { value: 'verin_pneumatique', label: 'Vérin Pneumatique' },
  { value: 'vapeur', label: 'Vapeur' },
  { value: 'relais_securite', label: 'Relais de sécurité + Capteur' },
  { value: 'ecran_siemens', label: 'Ecran SIEMENS' },
  { value: 'hydrolique', label: 'Hydrolique' },
  { value: 'pneumatique', label: 'Pneumatique' },
  { value: 'encodeur_occasion', label: 'Encodeur occasion' },
  { value: 'instrument', label: 'Instrument' },
  { value: 'compteur', label: 'Compteur' },
  { value: 'capteur', label: 'Capteur' },
];

const STATE_OPTIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'obsolete', label: 'Obsolète' },
];

const STATUS_OPTIONS = [
  { value: 'en_stock', label: 'En stock' },
  { value: 'rupture', label: 'Rupture' },
  { value: 'sur_commande', label: 'Sur commande' },
];

const EMPTY_FORM = {
  reference: '', name: '', category: '', quantity: 0, stock_minimum: 5,
  purchase_price: 0, sale_price: 0, supplier: '', location: '',
  brand: '', description: '', state: 'neuf', status: 'en_stock',
};

export default function ProductForm({ open, onClose, product, defaultCategory, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        reference: product.reference || '',
        name: product.name || '',
        category: product.category || defaultCategory || '',
        quantity: product.quantity ?? 0,
        stock_minimum: product.stock_minimum ?? 5,
        purchase_price: product.purchase_price ?? 0,
        sale_price: product.sale_price ?? 0,
        supplier: product.supplier || '',
        location: product.location || '',
        brand: product.brand || '',
        description: product.description || '',
        state: product.state || 'neuf',
        status: product.status || 'en_stock',
      });
    } else {
      setForm({ ...EMPTY_FORM, category: defaultCategory || '' });
    }
    setError('');
  }, [product, defaultCategory, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.reference.trim()) {
      setError('La référence est obligatoire');
      return;
    }
    if (!form.name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${product.id}`, form);
      } else {
        await api.post('/products', form);
      }
      onSaved();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="product-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900" data-testid="product-form-title">
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" data-testid="product-form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Reference + Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Référence *</Label>
              <Input
                value={form.reference}
                onChange={(e) => handleChange('reference', e.target.value)}
                placeholder="REF-001"
                className="border-slate-300"
                data-testid="product-reference-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom du produit"
                className="border-slate-300"
                data-testid="product-name-input"
              />
            </div>
          </div>

          {/* Row 2: Category + Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger className="border-slate-300" data-testid="product-category-select">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Marque</Label>
              <Input
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Ex: Siemens, Schneider..."
                className="border-slate-300"
                data-testid="product-brand-input"
              />
            </div>
          </div>

          {/* Row 3: Quantity + Stock minimum */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Quantité</Label>
              <Input
                type="number" min="0"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                className="border-slate-300"
                data-testid="product-quantity-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Stock min.</Label>
              <Input
                type="number" min="0"
                value={form.stock_minimum}
                onChange={(e) => handleChange('stock_minimum', parseInt(e.target.value) || 0)}
                className="border-slate-300"
                data-testid="product-stock-min-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Prix achat</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.purchase_price}
                onChange={(e) => handleChange('purchase_price', parseFloat(e.target.value) || 0)}
                className="border-slate-300"
                data-testid="product-purchase-price-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Prix vente</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.sale_price}
                onChange={(e) => handleChange('sale_price', parseFloat(e.target.value) || 0)}
                className="border-slate-300"
                data-testid="product-sale-price-input"
              />
            </div>
          </div>

          {/* Row 4: Supplier + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Fournisseur</Label>
              <Input
                value={form.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                placeholder="Nom du fournisseur"
                className="border-slate-300"
                data-testid="product-supplier-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Emplacement</Label>
              <Input
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ex: Étagère A-12"
                className="border-slate-300"
                data-testid="product-location-input"
              />
            </div>
          </div>

          {/* Row 5: State + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">État</Label>
              <Select value={form.state} onValueChange={(v) => handleChange('state', v)}>
                <SelectTrigger className="border-slate-300" data-testid="product-state-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Statut</Label>
              <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className="border-slate-300" data-testid="product-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 6: Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du produit..."
              rows={2}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D73]/50 focus:border-[#0A3D73] resize-none"
              data-testid="product-description-input"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300" data-testid="product-form-cancel">
              Annuler
            </Button>
            <Button
              type="submit" disabled={saving}
              className="bg-[#0A3D73] hover:bg-[#082E56] text-white"
              data-testid="product-form-submit"
            >
              {saving ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</span>
              ) : (
                isEdit ? 'Enregistrer' : 'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
