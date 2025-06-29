import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Info, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  
  const { login } = useAuth();

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

  const fillDemoCredentials = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setEmail('paularacy@gmail.com');
      setPassword('adm@123');
    } else {
      setEmail('joao.silva@email.com');
      setPassword('123456');
    }
    setError('');
    setShowSetupInfo(false);
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
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="bg-blue-600/10 border border-blue-600 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-sm font-medium mb-2">
                    Credenciais para demonstração:
                  </p>
                  <p className="text-xs text-blue-300 mb-3">
                    Clique nos botões abaixo para preencher automaticamente as credenciais de teste.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('student')}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                Aluno Demo
              </button>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1 mt-3">
              <p><strong>Admin:</strong> paularacy@gmail.com</p>
              <p><strong>Aluno:</strong> joao.silva@email.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;