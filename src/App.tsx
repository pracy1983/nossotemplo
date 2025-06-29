import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import LoginForm from './components/auth/LoginForm';
import AdminPanel from './components/admin/AdminPanel';
import StudentProfile from './components/student/StudentProfile';
import Layout from './components/common/Layout';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { loading: dataLoading, error: dataError } = useData();

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
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
            >
              Tentar Novamente
            </button>
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

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;