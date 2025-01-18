import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, UserPlus, Shield, Calendar, CheckSquare, Upload, BarChart3, School } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: School },
    { path: '/students', label: 'Lista de Alunos', icon: Users },
    { path: '/students/add', label: 'Adicionar Aluno', icon: UserPlus },
    { path: '/admins', label: 'Gerenciar Admins', icon: Shield },
    { path: '/events', label: 'Eventos', icon: Calendar },
    { path: '/attendance', label: 'Marcar Presença', icon: CheckSquare },
    { path: '/import', label: 'Importar Alunos', icon: Upload },
    { path: '/statistics', label: 'Estatísticas', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="flex items-center justify-center mb-8">
          <School className="w-8 h-8 text-red-600 mr-2" />
          <h1 className="text-xl font-bold">Nosso Templo</h1>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-2 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => {/* Implementar logout */}}
          className="w-full flex items-center px-4 py-2 mt-8 text-gray-300 hover:bg-gray-800 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}