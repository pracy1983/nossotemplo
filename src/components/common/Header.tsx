import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-black border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="/logo.jpg" 
            alt="Nosso Templo" 
            className="h-12 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-2 text-white">
                <User className="w-5 h-5" />
                <span className="text-sm">
                  {user.isAdmin ? 'Administrador' : 'Aluno'}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;