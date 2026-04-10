import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Package, Search, Plus } from 'lucide-react';
import { Input } from '../components/ui/input';

const CATEGORY_NAMES = {
  hydraulique: 'Hydraulique',
  pneumatique: 'Pneumatique',
  electrique: 'Électrique',
  automatisme: 'Automatisme',
  roulements: 'Roulements',
  moteurs: 'Moteurs',
  capteurs: 'Capteurs',
  variateurs: 'Variateurs',
  outillage: 'Outillage',
  quincaillerie: 'Quincaillerie',
  securite: 'Sécurité',
  maintenance: 'Maintenance',
};

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const categoryName = CATEGORY_NAMES[categoryId] || categoryId;

  return (
    <div className="space-y-6" data-testid="category-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900"
            data-testid="category-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{categoryName}</h1>
            <p className="text-sm text-slate-500">Pièces de rechange - {categoryName}</p>
          </div>
        </div>
        <Button className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="add-product-btn">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un produit
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher par référence, nom, marque..."
          className="pl-10 border-slate-300"
          data-testid="category-search-input"
        />
      </div>

      {/* Empty state */}
      <div className="bg-white border border-slate-200 rounded-md p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-md flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun produit pour le moment</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          La gestion détaillée des produits sera disponible dans la prochaine étape. Structure prête.
        </p>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="border-slate-300"
          data-testid="category-return-btn"
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
