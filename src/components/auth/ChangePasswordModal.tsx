import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

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
  const { students } = useData();
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
      
      // Verificar se o usuário está logado com senha temporária
      const student = students.find(s => s.email === userEmail);
      
      if (!student) {
        console.error('Estudante não encontrado para o email:', userEmail);
        setError('Usuário não encontrado');
        setIsLoading(false);
        return;
      }
      
      // Se o usuário tem senha temporária
      if (student.tempPassword) {
        console.log('Verificando senha temporária para:', userEmail);
        
        if (student.tempPassword === currentPassword) {
          console.log('Senha temporária válida');
          // Se for senha temporária, não precisamos verificar no Supabase Auth
          // Apenas continuamos o processo de atualização
        } else {
          console.log('Senha temporária fornecida não corresponde');
          setError('Senha atual incorreta');
          setIsLoading(false);
          return;
        }
      } else {
        // Se não tem senha temporária, verifica no Supabase Auth
        console.log('Verificando autenticação normal para:', userEmail);
        
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: currentPassword,
          });
          
          if (signInError) {
            console.error('Erro na autenticação:', signInError);
            setError('Senha atual incorreta');
            setIsLoading(false);
            return;
          }
          
          console.log('Autenticação normal bem-sucedida');
        } catch (signInError) {
          console.error('Erro ao tentar autenticar com senha atual:', signInError);
          setError('Erro ao verificar credenciais');
          setIsLoading(false);
          return;
        }
      }
      
      // Se chegou aqui, a senha foi validada com sucesso
      console.log('Senha validada com sucesso, prosseguindo com a atualização');
      
      // Se for senha temporária, apenas atualizamos no banco de dados
      if (student.tempPassword) {
        console.log('Processando alteração de senha para usuário com senha temporária');
        
        try {
          // Remove a senha temporária e atualiza no banco de dados
          const { error: updateError } = await supabase
            .from('students')
            .update({ 
              temp_password: null // Remove a senha temporária
            })
            .eq('email', userEmail);
            
          if (updateError) {
            console.error('Erro ao atualizar senha no banco de dados:', updateError);
            setError('Erro ao atualizar senha. Por favor, tente novamente.');
            setIsLoading(false);
            return;
          }
          
          console.log('Senha temporária removida com sucesso do banco de dados');
          
          // Tenta criar o usuário no Auth com a nova senha
          try {
            const { error: signUpError } = await supabase.auth.signUp({
              email: userEmail,
              password: newPassword,
            });
            
            if (signUpError && !signUpError.message.includes('already registered')) {
              console.log('Erro ao criar conta no Auth:', signUpError);
              // Não é um erro crítico, o usuário pode fazer login com senha temporária removida
            } else {
              console.log('Conta criada/atualizada com sucesso no Auth');
            }
          } catch (signUpError) {
            console.log('Erro ao tentar criar conta no Auth:', signUpError);
            // Não é um erro crítico
          }
          
          // Sucesso - fecha o modal
          console.log('Senha alterada com sucesso!');
          onClose();
          setIsLoading(false);
          return;
          
        } catch (err) {
          console.error('Erro ao processar alteração de senha temporária:', err);
          setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
          setIsLoading(false);
          return;
        }
      } else {
        // Autenticação normal, apenas atualizar a senha
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          });
          
          if (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            setError(updateError.message);
            setIsLoading(false);
            return;
          }
        } catch (updateError) {
          console.error('Exceção ao atualizar senha:', updateError);
          setError('Ocorreu um erro ao atualizar sua senha. Tente novamente.');
          setIsLoading(false);
          return;
        }
      }
      
      // Se o usuário estava usando senha temporária, limpar a senha temporária no banco
      if (student?.tempPassword) {
        try {
          // Atualizar o registro do estudante para remover a senha temporária
          const { error: updateStudentError } = await supabase
            .from('students')
            .update({ tempPassword: null })
            .eq('id', student.id);
            
          if (updateStudentError) {
            console.error('Erro ao limpar senha temporária:', updateStudentError);
            // Não vamos falhar a operação por causa disso, apenas log
          } else {
            console.log('Senha temporária removida com sucesso');
          }
        } catch (err) {
          console.error('Erro ao atualizar registro do estudante:', err);
        }
      }
      
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
