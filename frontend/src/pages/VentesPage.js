import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShoppingCart, Plus } from 'lucide-react';

export default function VentesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6" data-testid="ventes-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ventes</h1>
          <p className="text-sm text-slate-500">Gestion des ventes et facturation</p>
        </div>
        <Button className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="new-sale-btn">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle vente
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto bg-green-50 rounded-md flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Module Ventes</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          La gestion complète des ventes sera disponible dans la prochaine étape. Structure prête.
        </p>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="border-slate-300"
          data-testid="ventes-return-btn"
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
