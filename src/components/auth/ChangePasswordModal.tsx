import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string; // Opcional e não utilizado, mantido para compatibilidade
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  // userId não é utilizado
}) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para controlar a visibilidade das senhas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Primeiro, verificamos se a senha atual está correta
      const userEmail = user?.email || '';
      
      if (!userEmail) {
        setError('Não foi possível identificar o email do usuário');
        setIsLoading(false);
        return;
      }
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      
      if (signInError) {
        setError('Senha atual incorreta');
        setIsLoading(false);
        return;
      }
      
      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        // Limpar os campos
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Notificar o componente pai
        onSuccess();
        
        // Fechar o modal após um breve delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      setError('Ocorreu um erro ao alterar sua senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">Alterar Senha</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-600/20 border border-red-600/30 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-600/20 border border-green-600/30 text-green-400 p-3 rounded-lg text-sm">
              Senha alterada com sucesso!
            </div>
          )}
          
          {/* Senha atual */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Confirmar nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg mr-2 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 ${
                isLoading ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition-colors flex items-center`}
              disabled={isLoading}
            >
              {isLoading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
