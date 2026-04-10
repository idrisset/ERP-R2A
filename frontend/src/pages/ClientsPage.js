import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Users, Plus } from 'lucide-react';

export default function ClientsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6" data-testid="clients-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-sm text-slate-500">Gestion des clients et contacts</p>
        </div>
        <Button className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="new-client-btn">
          <Plus className="w-4 h-4 mr-2" /> Nouveau client
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto bg-blue-50 rounded-md flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Module Clients</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          La gestion complète des clients sera disponible dans la prochaine étape. Structure prête.
        </p>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="border-slate-300"
          data-testid="clients-return-btn"
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
