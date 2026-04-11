import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoryPage from './pages/CategoryPage';
import VentesPage from './pages/VentesPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import TrashPage from './pages/TrashPage';
import AccountingPage from './pages/AccountingPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#0A3D73]/20 border-t-[#0A3D73] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user === false) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0A3D73]/20 border-t-[#0A3D73] rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/produits" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/categorie/:categoryId" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
          <Route path="/ventes" element={<ProtectedRoute><VentesPage /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/parametres" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/comptabilite" element={<ProtectedRoute><AccountingPage /></ProtectedRoute>} />
          <Route path="/corbeille" element={<ProtectedRoute><TrashPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
