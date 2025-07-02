import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import LoginForm from './components/auth/LoginForm';
import AdminPanel from './components/admin/AdminPanel';
import StudentProfile from './components/student/StudentProfile';
import Layout from './components/common/Layout';
import InvitePage from './components/invite/InvitePage';
import { checkSupabaseConnection } from './utils/checkConnection';

const AppContent: React.FC = () => {
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

  if (!user) {
    return <LoginForm />;
  }

  if (user.isAdmin) {
    return (
      <Layout showSidebar={false}>
        <AdminPanel />
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <StudentProfile />
    </Layout>
  );
};

// Componente para extrair o token da URL
const InviteHandler: React.FC = () => {
  const path = window.location.pathname;
  const tokenMatch = path.match(/\/invite\/([\w-]+)/);
  const token = tokenMatch ? tokenMatch[1] : undefined;
  
  return <InvitePage token={token} />;
};

function App() {
  // Verificar se estamos na rota de convite
  const isInvitePath = window.location.pathname.startsWith('/invite/');
  
  if (isInvitePath) {
    return (
      <AuthProvider>
        <DataProvider>
          <InviteHandler />
        </DataProvider>
      </AuthProvider>
    );
  }
  
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;