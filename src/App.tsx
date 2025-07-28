import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import LoginForm from './components/auth/LoginForm';
import AdminPanel from './components/admin/AdminPanel';
import StudentProfile from './components/student/StudentProfile';
import ConvitePage from './components/auth/ConvitePage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import Layout from './components/common/Layout';
import { checkSupabaseConnection } from './utils/checkConnection';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './components/auth/PrivateRoute';

/**
 * Dashboard - Componente principal para usuários autenticados
 * Renderiza AdminPanel para admins ou StudentProfile para alunos
 */
const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { loading: dataLoading, error: dataError } = useData();
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean; message: string; details?: any}>({ success: false, message: 'Verificando conexão...' });
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  // Verificar conexão com o Supabase
  const verifyConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const result = await checkSupabaseConnection();
      setConnectionStatus({
        success: result.success,
        message: result.message,
        details: result.success ? result.data : result.error
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `Erro ao verificar conexão: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Erro de Conexão</h2>
            <p className="text-gray-300 mb-4">{dataError}</p>
            <p className="text-gray-400 text-sm">
              Verifique se o Supabase está configurado corretamente e tente novamente.
            </p>
            <div className="mt-4 flex flex-col space-y-2">
              <button 
                onClick={verifyConnection} 
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white flex items-center justify-center"
                disabled={isCheckingConnection}
              >
                {isCheckingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </>
                ) : 'Verificar Conexão'}
              </button>
              
              {connectionStatus.message && (
                <div className={`mt-2 p-3 rounded-lg text-sm text-left ${connectionStatus.success ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                  <p className="font-medium">{connectionStatus.message}</p>
                  {connectionStatus.details && (
                    <pre className="mt-2 overflow-x-auto text-xs opacity-80">
                      {JSON.stringify(connectionStatus.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Usuário está autenticado, verificar tipo
  if (user?.isAdmin) {
    return (
      <Layout showSidebar={false}>
        <AdminPanel />
      </Layout>
    );
  }

  // Usuário comum (aluno)
  return (
    <Layout showSidebar={false}>
      <StudentProfile />
    </Layout>
  );
};

/**
 * NotFoundPage - Página 404 para rotas não encontradas
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Página não encontrada</h2>
          <p className="text-gray-300 mb-6">A página que você está procurando não existe.</p>
          <a 
            href="/" 
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white inline-block"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Rotas públicas - acessíveis sem autenticação */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/convite/:token" element={<ConvitePage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            
            {/* Rota inicial - redireciona para dashboard se autenticado, ou login se não */}
            <Route path="/" element={
              <PrivateRoute>
                <Navigate to="/dashboard" replace />
              </PrivateRoute>
            } />
            
            {/* Rotas privadas - protegidas por autenticação */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/*" element={
              <PrivateRoute>
                <Layout showSidebar={false}>
                  <AdminPanel />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/perfil" element={
              <PrivateRoute>
                <Layout showSidebar={false}>
                  <StudentProfile />
                </Layout>
              </PrivateRoute>
            } />
            
            {/* Página 404 para rotas não encontradas */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={5000} />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;