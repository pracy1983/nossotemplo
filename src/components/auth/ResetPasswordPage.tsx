import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se o usuário está autenticado com um token de redefinição de senha
  useEffect(() => {
  // DEBUG: Diagnóstico detalhado do fluxo de redefinição
  console.log('=== DEBUG RESET PASSWORD ===');
  console.log('Current URL:', window.location.href);
  console.log('Search params:', location.search);
  console.log('Hash params:', window.location.hash);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  console.log('Access token:', hashParams.get('access_token'));
  console.log('Type:', hashParams.get('type'));
  console.log('================================');
    const verifyToken = async () => {
      console.log('Verificando token de redefinição...');
      console.log('URL atual:', window.location.href);
      console.log('Search params:', location.search);
      console.log('Hash da URL:', location.hash);
      
      try {
        // Extrair o token da URL
        const searchParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.replace('#', ''));
        
        // Verificar se temos um token de acesso na URL
        const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = searchParams.get('type') || hashParams.get('type');
        
        console.log('Parâmetros encontrados:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        if (type === 'recovery') {
          console.log('Token de recuperação encontrado na URL');
          
          // Verificar se há uma sessão ativa
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Erro ao verificar sessão:', error);
            throw error;
          }
          
          console.log('Dados da sessão:', data);
          
          if (data.session) {
            console.log('Sessão ativa encontrada');
            setTokenVerified(true);
            return;
          }
          
          // Se não houver sessão mas temos tokens na URL, tentar estabelecer uma sessão
          if (accessToken) {
            console.log('Tentando estabelecer sessão com o token de acesso...');
            
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error('Erro ao estabelecer sessão com token:', sessionError);
              throw sessionError;
            }
            
            if (sessionData.session) {
              console.log('Sessão estabelecida com sucesso usando token da URL');
              setTokenVerified(true);
              return;
            }
          }
          
          // Se chegamos aqui, não conseguimos estabelecer uma sessão
          throw new Error('Não foi possível verificar o token de recuperação');
        } else {
          // Verificar se há um token de recuperação no hash (formato antigo)
          if (location.hash.includes('type=recovery')) {
            console.log('Token de recuperação encontrado no formato antigo');
            
            // Verificar a sessão
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Erro ao verificar sessão:', error);
              throw error;
            }
            
            if (data.session) {
              console.log('Sessão ativa encontrada');
              setTokenVerified(true);
              return;
            }
          }
          
          console.error('Token de recuperação não encontrado na URL');
          throw new Error('Link de redefinição de senha inválido');
        }
      } catch (error: any) {
        console.error('Erro ao verificar token de recuperação de senha:', error);
        toast.error('Link de redefinição de senha expirado ou inválido.');
        navigate('/login');
      }
    };
    
    verifyToken();
  }, [navigate, location]);

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar senhas
    if (!validatePassword(password)) return;
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    console.log('Iniciando processo de redefinição de senha...');

    try {
      if (!tokenVerified) {
        console.error('Token não verificado');
        throw new Error('Token de redefinição não verificado. Por favor, solicite um novo link.');
      }
      
      // Verificar a sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        throw new Error('Não foi possível verificar a sessão. Tente novamente.');
      }
      
      if (!sessionData.session) {
        console.error('Nenhuma sessão ativa encontrada');
        throw new Error('Sessão expirada. Por favor, solicite um novo link de redefinição de senha.');
      }
      
      console.log('Sessão válida encontrada, atualizando senha...');
      
      // Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erro ao atualizar a senha:', updateError);
        throw updateError;
      }

      console.log('Senha atualizada com sucesso!');
      toast.success('Senha redefinida com sucesso!');
      
      // Fazer logout para limpar a sessão
      await supabase.auth.signOut();
      
      // Redirecionar para o login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Ocorreu um erro ao redefinir sua senha.';
      
      if (error.message.includes('Auth session missing')) {
        errorMessage = 'Sessão expirada. Por favor, solicite um novo link de redefinição de senha.';
      } else if (error.message.includes('password')) {
        errorMessage = 'A senha fornecida não atende aos requisitos de segurança.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.jpg" 
            alt="Nosso Templo" 
            className="h-20 w-auto mx-auto mb-4 object-contain"
          />
          <p className="text-gray-400">
            Sistema de Gerenciamento
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Redefinir Senha
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  placeholder="Digite sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  placeholder="Confirme sua nova senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-600/10 border border-red-600 rounded-lg p-3 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {isLoading ? 'Processando...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
