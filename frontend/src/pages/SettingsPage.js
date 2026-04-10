import { useAuth } from '../contexts/AuthContext';
import { Settings, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-sm text-slate-500">Configuration du compte et de l'application</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#0A3D73]" /> Informations du compte
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Nom</p>
              <p className="text-sm text-slate-900 font-medium" data-testid="settings-name">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-slate-900 font-medium" data-testid="settings-email">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Rôle</p>
              <p className="text-sm text-slate-900 font-medium capitalize flex items-center gap-2" data-testid="settings-role">
                <Shield className="w-4 h-4 text-[#0A3D73]" />
                {user?.role || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-slate-400" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Configuration avancée</h3>
            <p className="text-sm text-slate-500">Les paramètres avancés seront disponibles dans la prochaine version.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
