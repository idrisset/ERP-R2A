import { useState, useCallback } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import {
  FileUp, FileSpreadsheet, CheckCircle, AlertTriangle, RefreshCw,
  Loader2, ArrowRight, X, Download, History, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORIES = [
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

const CAT_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

export default function ImportPage() {
  const [step, setStep] = useState('upload'); // upload, preview, result
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Format non supporté. Utilisez .xlsx ou .csv');
      return;
    }
    setFile(f);
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', f);
      if (category) formData.append('category', category);
      const { data } = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data);
      if (!category) setCategory(data.detected_category);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'analyse du fichier');
    } finally {
      setUploading(false);
    }
  }, [category]);

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setError('');
    try {
      const { data } = await api.post('/import/execute', {
        items: preview.all_data,
        category: category || preview.detected_category,
        filename: preview.filename,
      });
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/import/history');
      setHistory(data.items);
      setShowHistory(true);
    } catch (err) { console.error(err); }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setCategory('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-6" data-testid="import-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Import Excel / CSV</h1>
          <p className="text-sm text-slate-500">Importez vos fichiers de pièces en masse</p>
        </div>
        <Button variant="outline" onClick={fetchHistory} className="border-slate-300" data-testid="import-history-btn">
          <History className="w-4 h-4 mr-2" /> Historique
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center justify-between" data-testid="import-error">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Category pre-select */}
          <div className="max-w-xs">
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Catégorie cible (optionnel)</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-slate-300" data-testid="import-category-select">
                <SelectValue placeholder="Détection auto" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-md p-12 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-[#0A3D73] bg-blue-50/50' : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
            data-testid="import-dropzone"
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              data-testid="import-file-input"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-[#0A3D73] animate-spin" />
                <p className="text-sm text-slate-600">Analyse du fichier en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center">
                  <FileUp className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-base font-medium text-slate-900">Glissez votre fichier ici</p>
                  <p className="text-sm text-slate-500 mt-1">ou cliquez pour sélectionner (.xlsx, .csv)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* File info */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-[#0A3D73]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{preview.filename}</p>
                <p className="text-xs text-slate-500">{preview.total_rows} lignes détectées</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mr-2">
                  {preview.new_count} nouveaux
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {preview.update_count} mises à jour
                </Badge>
              </div>
            </div>
          </div>

          {/* Category selector */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Catégorie</label>
              <Select value={category || preview.detected_category} onValueChange={setCategory}>
                <SelectTrigger className="w-48 border-slate-300" data-testid="preview-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-slate-500 mt-6">
              Catégorie détectée : <strong>{CAT_LABELS[preview.detected_category] || preview.detected_category}</strong>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b text-sm font-medium text-slate-700">
              Aperçu ({Math.min(preview.preview.length, 100)} premières lignes sur {preview.total_rows})
            </div>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700 w-12">#</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700">Référence</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700">Marque</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700 text-center">Qté</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-700">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.preview.map((row, idx) => (
                    <TableRow key={idx} className={row.is_duplicate ? 'bg-amber-50/30' : ''} data-testid={`preview-row-${idx}`}>
                      <TableCell className="text-xs text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-medium text-slate-900">{row.reference}</TableCell>
                      <TableCell className="text-sm text-slate-600">{row.brand || '-'}</TableCell>
                      <TableCell className="text-sm text-slate-600 text-center">{row.quantity}</TableCell>
                      <TableCell>
                        {row.is_duplicate ? (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <RefreshCw className="w-3 h-3 mr-1" /> Mise à jour
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Nouveau
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={reset} className="border-slate-300" data-testid="import-cancel-btn">
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing}
              className="bg-[#0A3D73] hover:bg-[#082E56] text-white"
              data-testid="import-confirm-btn"
            >
              {importing ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Import en cours...</span>
              ) : (
                <span className="flex items-center gap-2">
                  Importer {preview.total_rows} articles <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Result */}
      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2" data-testid="import-success-title">Import terminé</h2>
            <p className="text-sm text-slate-500 mb-6">{result.total} articles traités</p>

            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600" data-testid="import-created-count">{result.created}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Créés</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600" data-testid="import-updated-count">{result.updated}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Mis à jour</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600" data-testid="import-error-count">{result.error_count}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Erreurs</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="text-left mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm font-medium text-red-700 mb-2">Erreurs détectées :</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono">
                      {err.reference}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={reset} className="bg-[#0A3D73] hover:bg-[#082E56] text-white mt-4" data-testid="import-new-btn">
              Nouvel import
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Historique des imports</h3>
            <button onClick={() => setShowHistory(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          {history.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">Aucun import effectué</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase">Date</TableHead>
                    <TableHead className="text-xs uppercase">Fichier</TableHead>
                    <TableHead className="text-xs uppercase">Catégorie</TableHead>
                    <TableHead className="text-xs uppercase text-center">Créés</TableHead>
                    <TableHead className="text-xs uppercase text-center">MàJ</TableHead>
                    <TableHead className="text-xs uppercase text-center">Erreurs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm text-slate-600">{new Date(h.timestamp).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-900">{h.filename}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{CAT_LABELS[h.category] || h.category}</Badge></TableCell>
                      <TableCell className="text-center text-emerald-700 font-semibold">{h.created}</TableCell>
                      <TableCell className="text-center text-amber-700 font-semibold">{h.updated}</TableCell>
                      <TableCell className="text-center text-red-700 font-semibold">{h.errors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
