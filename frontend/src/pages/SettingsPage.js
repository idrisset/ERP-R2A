import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Settings, User, Shield, Users, Plus, Loader2, Lock, UserCheck, UserX,
  Activity, ChevronLeft, ChevronRight, Search, Download
} from 'lucide-react';

const fmt = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '-'; } };

const ACTION_LABELS = {
  login: 'Connexion', product_create: 'Produit créé', product_update: 'Produit modifié',
  product_archive: 'Produit archivé', product_restore: 'Produit restauré', product_delete: 'Produit supprimé',
  client_create: 'Client créé', client_update: 'Client modifié', client_archive: 'Client archivé',
  sale_create: 'Vente', import: 'Import', revenue_create: 'Revenu', expense_create: 'Dépense',
  invoice_create: 'Facture', user_create: 'Utilisateur créé', user_update: 'Utilisateur modifié',
};

const ACTION_COLORS = {
  login: 'bg-blue-50 text-blue-700', sale_create: 'bg-emerald-50 text-emerald-700',
  product_archive: 'bg-red-50 text-red-700', product_delete: 'bg-red-50 text-red-700',
  import: 'bg-purple-50 text-purple-700',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-sm text-slate-500">Configuration et administration</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-slate-100 border border-slate-200">
          <TabsTrigger value="account" className="data-[state=active]:bg-white"><User className="w-4 h-4 mr-1.5" /> Mon compte</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="data-[state=active]:bg-white"><Users className="w-4 h-4 mr-1.5" /> Utilisateurs</TabsTrigger>}
          {isAdmin && <TabsTrigger value="activity" className="data-[state=active]:bg-white"><Activity className="w-4 h-4 mr-1.5" /> Activité</TabsTrigger>}
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <AccountTab user={user} />
        </TabsContent>
        {isAdmin && <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>}
        {isAdmin && <TabsContent value="activity" className="mt-4"><ActivityTab /></TabsContent>}
      </Tabs>
    </div>
  );
}

function AccountTab({ user }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2"><User className="w-5 h-5 text-[#0A3D73]" /> Informations du compte</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><p className="text-xs font-medium text-slate-500 uppercase mb-1">Nom</p><p className="text-sm font-medium text-slate-900">{user?.name}</p></div>
        <div><p className="text-xs font-medium text-slate-500 uppercase mb-1">Email</p><p className="text-sm font-medium text-slate-900">{user?.email}</p></div>
        <div><p className="text-xs font-medium text-slate-500 uppercase mb-1">Rôle</p><p className="text-sm font-medium text-slate-900 flex items-center gap-2"><Shield className="w-4 h-4 text-[#0A3D73]" />{user?.role === 'admin' ? 'Administrateur' : 'Employé'}</p></div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/users'); setUsers(data.items); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { active: !u.active });
      fetch();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="add-user-btn">
          <Plus className="w-4 h-4 mr-2" /> Nouvel utilisateur
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73] mx-auto" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="bg-slate-50">
              <TableHead className="text-xs uppercase font-semibold text-slate-700">Nom</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-slate-700">Email</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-slate-700">Rôle</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-slate-700">Statut</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                  <TableCell className="text-slate-600">{u.email}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${u.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-slate-200'}`}>{u.role === 'admin' ? 'Admin' : 'Employé'}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${u.active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {u.active !== false ? 'Actif' : 'Désactivé'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(u)} className="h-7 text-xs" data-testid={`toggle-user-${u._id}`}>
                      {u.active !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* New user form */}
      <NewUserForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetch} />
    </div>
  );
}

function NewUserForm({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'employee' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm({ email: '', password: '', name: '', role: 'employee' }); setError(''); } }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) { setError('Tous les champs sont obligatoires'); return; }
    setSaving(true);
    try { await api.post('/users', form); onSaved(); onClose(); }
    catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nouvel utilisateur</DialogTitle></DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="border-slate-300" data-testid="new-user-name" /></div>
          <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="border-slate-300" data-testid="new-user-email" /></div>
          <div className="space-y-1.5"><Label>Mot de passe *</Label><Input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} className="border-slate-300" data-testid="new-user-password" /></div>
          <div className="space-y-1.5"><Label>Rôle</Label>
            <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="employee">Employé</SelectItem><SelectItem value="admin">Administrateur</SelectItem></SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">Annuler</Button>
            <Button type="submit" disabled={saving} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="new-user-submit">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActivityTab() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/activity', { params: { page, limit: 50 } });
      setLogs(data.items); setTotal(data.total); setPages(data.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4" /> Rapport d'activité ({total} actions)</h3>
        </div>
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#0A3D73] mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs uppercase">Date</TableHead>
                <TableHead className="text-xs uppercase">Utilisateur</TableHead>
                <TableHead className="text-xs uppercase">Action</TableHead>
                <TableHead className="text-xs uppercase">Détails</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {logs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm text-slate-600 whitespace-nowrap">{fmt(log.timestamp)}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">{log.user_name || log.user_id?.substring(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${ACTION_COLORS[log.action] || 'border-slate-200'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-[300px] truncate">{log.details}</TableCell>
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
    </div>
  );
}
