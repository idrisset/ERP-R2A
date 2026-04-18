import { useState, useEffect } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import {
  BarChart3, Send, Loader2, Package, TrendingUp, AlertTriangle,
  Users, ShoppingCart, CheckCircle, XCircle, Trophy, Activity
} from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(v || 0) + ' DZD';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/reports/monthly'); setReport(data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSendEmail = async () => {
    setSending(true); setSendResult(null); setConfirmSend(false);
    try {
      const { data } = await api.post('/reports/send-email');
      setSendResult({ success: true, message: data.message });
    } catch (err) {
      setSendResult({ success: false, message: err.response?.data?.detail || 'Erreur d\'envoi' });
    } finally { setSending(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0A3D73]" /></div>;
  if (!report) return <div className="text-center py-20 text-slate-500">Erreur de chargement du rapport</div>;

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Rapport Mensuel</h1>
          <p className="text-sm text-slate-500">{report.month}</p>
        </div>
        <Button onClick={() => setConfirmSend(true)} disabled={sending} className="bg-[#0A3D73] hover:bg-[#082E56] text-white" data-testid="send-report-btn">
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Envoyer par email
        </Button>
      </div>

      {sendResult && (
        <div className={`p-3 rounded-md border text-sm flex items-center gap-2 ${sendResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`} data-testid="send-result">
          {sendResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {sendResult.message}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Ventes du mois', value: report.sales_count, icon: ShoppingCart, color: '#0A3D73', bg: '#EFF6FF' },
          { label: 'Chiffre d\'affaires', value: fmt(report.sales_total), icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4', raw: true },
          { label: 'Total articles', value: report.total_products, icon: Package, color: '#0A3D73', bg: '#EFF6FF' },
          { label: 'En rupture', value: report.out_of_stock, icon: XCircle, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Total clients', value: report.total_clients, icon: Users, color: '#2563EB', bg: '#EFF6FF' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
              <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.raw ? s.value : s.value?.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">Top articles vendus</h3>
          </div>
          {report.top_products?.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Référence</TableHead><TableHead className="text-xs text-center">Qté vendue</TableHead></TableRow></TableHeader>
              <TableBody>
                {report.top_products.map((p, i) => (
                  <TableRow key={i}><TableCell className="font-mono text-sm">{p._id}</TableCell><TableCell className="text-center font-semibold text-[#0A3D73]">{p.total_qty}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="p-6 text-sm text-slate-500 text-center">Aucune vente ce mois</p>}
        </div>

        {/* Low stock */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">Stock faible ({report.low_stock_count})</h3>
          </div>
          {report.low_stock_items?.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="text-xs">Référence</TableHead><TableHead className="text-xs">Nom</TableHead><TableHead className="text-xs text-center">Qté</TableHead></TableRow></TableHeader>
                <TableBody>
                  {report.low_stock_items.map((p, i) => (
                    <TableRow key={i}><TableCell className="font-mono text-sm">{p.reference}</TableCell><TableCell className="text-sm">{p.name}</TableCell><TableCell className="text-center font-semibold text-amber-600">{p.quantity}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : <p className="p-6 text-sm text-slate-500 text-center">Aucun article en stock faible</p>}
        </div>
      </div>

      {/* User activity */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0A3D73]" />
          <h3 className="text-sm font-semibold text-slate-700">Activité des utilisateurs ce mois</h3>
        </div>
        {report.user_activity?.length > 0 ? (
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Utilisateur</TableHead><TableHead className="text-xs text-center">Nombre d'actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.user_activity.map((u, i) => (
                <TableRow key={i}><TableCell className="font-medium text-slate-900">{u._id || 'Système'}</TableCell><TableCell className="text-center"><Badge variant="outline" className="text-xs">{u.count}</Badge></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <p className="p-6 text-sm text-slate-500 text-center">Aucune activité ce mois</p>}
      </div>

      {/* Recent logs */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b"><h3 className="text-sm font-semibold text-slate-700">Dernières actions</h3></div>
        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Utilisateur</TableHead><TableHead className="text-xs">Action</TableHead><TableHead className="text-xs">Détails</TableHead></TableRow></TableHeader>
            <TableBody>
              {(report.recent_logs || []).map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{l.timestamp ? new Date(l.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                  <TableCell className="text-sm font-medium">{l.user_name || '-'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.action}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-[250px] truncate">{l.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirm send dialog */}
      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Envoyer le rapport par email ?</AlertDialogTitle>
            <AlertDialogDescription>Le rapport mensuel sera envoyé à l'adresse configurée (boukhalfarabah23@gmail.com).</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail} className="bg-[#0A3D73] hover:bg-[#082E56] text-white"><Send className="w-4 h-4 mr-2" /> Envoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
