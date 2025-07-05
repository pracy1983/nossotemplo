import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  
  const { login } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu email para redefinir a senha.');
      return;
    }

    console.log('[ResetPassword] Iniciando processo de redefinição para:', email);
    // Garantir que a URL de redirecionamento esteja completa e correta
    const redirectUrl = `${window.location.origin}/redefinir-senha`;
    console.log('[ResetPassword] URL de redirecionamento:', redirectUrl);
    
    setIsResettingPassword(true);
    setError('');

    try {
      // Primeiro, verificar se o email existe no sistema
      console.log('[ResetPassword] Verificando se o email existe no sistema...');
      const { data: userData, error: userError } = await supabase
        .from('students')
        .select('email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error('[ResetPassword] Email não encontrado no sistema:', email);
        // Não revelar que o email não existe por questões de segurança
        toast.success('Se o email estiver cadastrado, você receberá um link para redefinir sua senha.');
        return;
      }

      console.log('[ResetPassword] Email encontrado, enviando link de redefinição...');
      
      // Enviar o email de redefinição de senha
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      console.log('[ResetPassword] Resposta do Supabase:', { data, error });

      if (error) {
        console.error('[ResetPassword] Erro retornado pelo Supabase:', error);
        
        // Tratar erros específicos
        if (error.message.includes('rate limit')) {
          throw new Error('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else if (error.message.includes('email not found')) {
          // Não revelar que o email não existe por questões de segurança
          console.log('[ResetPassword] Email não encontrado no Supabase Auth');
        } else {
          throw error;
        }
      }

      console.log('[ResetPassword] Email enviado com sucesso!');
      toast.success('Se o email estiver cadastrado, você receberá um link para redefinir sua senha em instantes.');
    } catch (error: any) {
      console.error('[ResetPassword] Erro ao solicitar redefinição de senha:', error);
      console.error('[ResetPassword] Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      setError(`Erro ao solicitar redefinição de senha: ${error.message}`);
    } finally {
      setIsResettingPassword(false);
      console.log('[ResetPassword] Processo finalizado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (!success) {
        setError('Email ou senha incorretos');
        setShowSetupInfo(true);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error messages
      if (error.message?.includes('Invalid login credentials') || 
          error.message?.includes('invalid_credentials')) {
        setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
        setShowSetupInfo(true);
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada.');
      } else if (error.message?.includes('Too many requests')) {
        setError('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
      } else if (error.message?.includes('Erro ao buscar dados do usuário')) {
        setError('Usuário não encontrado no sistema. Entre em contato com o administrador.');
        setShowSetupInfo(true);
      } else {
        setError('Erro ao fazer login. Verifique sua conexão e tente novamente.');
      }
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

        {/* Login Form */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Entrar no Sistema
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  placeholder="Digite seu email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  placeholder="Digite sua senha"
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-600/10 border border-red-600 rounded-lg p-3 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Setup Information */}
            {showSetupInfo && (
              <div className="bg-yellow-600/10 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <UserPlus className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 text-sm font-medium mb-2">
                      Configuração Necessária
                    </p>
                    <p className="text-yellow-300 text-xs mb-3">
                      Os usuários de demonstração precisam ser criados no Supabase. Para configurar:
                    </p>
                    <ol className="text-xs text-yellow-300 space-y-1 list-decimal list-inside">
                      <li>Acesse o painel do Supabase</li>
                      <li>Vá para Authentication → Users</li>
                      <li>Crie os usuários de demonstração:</li>
                      <li className="ml-4">• paularacy@gmail.com (senha: adm@123)</li>
                      <li className="ml-4">• joao.silva@email.com (senha: 123456)</li>
                      <li>Certifique-se de que existem registros correspondentes na tabela 'students'</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
            
            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {isResettingPassword ? 'Enviando...' : 'Esqueci minha senha'}
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>
  );
};

export default LoginForm;