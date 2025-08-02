import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Função auxiliar para processar o token e inicializar a sessão
  const processToken = async (token: string, type: string, refresh_token: string) => {
    console.log('Processando token de recuperação...');
    console.log('Token recebido:', token);
    console.log('Tipo do token:', type);
    
    try {
      // Verificar se o token é um token JWT válido ou apenas um identificador
      if (token.length < 30) {
        console.log('Token parece ser um identificador simples, não um JWT válido');
        
        // Se for apenas um identificador, podemos tentar usar o token como parte de uma URL de callback
        // que o Supabase possa reconhecer
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!userError && userData?.user) {
          console.log('Usuário já está autenticado:', userData.user);
          setAccessToken(token);
          setTokenVerified(true);
          return true;
        }
        
        console.error('Token não é válido para recuperação de senha');
        setError('Link de redefinição inválido. Solicite um novo link.');
        return false;
      }
      
      // Tentar inicializar a sessão com o token JWT
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refresh_token || ''
      });
      
      if (sessionError) {
        console.error('Erro ao inicializar sessão:', sessionError);
        
        // Verificar se o usuário já está autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!userError && userData?.user) {
          console.log('Usuário já está autenticado:', userData.user);
          setAccessToken(token);
          setTokenVerified(true);
          return true;
        }
        
        setError('Erro ao processar token de recuperação. Por favor, solicite um novo link.');
        return false;
      }
      
      console.log('Sessão inicializada com sucesso!');
      setAccessToken(token);
      setTokenVerified(true);
      setError('');
      return true;
    } catch (error) {
      console.error('Exceção ao processar token de recuperação:', error);
      setError('Erro ao processar token de recuperação. Por favor, solicite um novo link.');
      return false;
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        console.log('Verificando token na URL...');
        console.log('Hash da URL completo:', window.location.hash);
        console.log('Query string completa:', location.search);
        
        // Garantir que estamos processando o hash corretamente
        // O formato padrão do Supabase é #access_token=TOKEN&type=recovery
        let hashString = window.location.hash;
        
        // Se o hash estiver vazio, não há token para processar
        if (!hashString || hashString.length <= 1) {
          console.log('Hash vazio ou inválido, verificando query params');
          
          // Verificar se o token está nos query params (formato alternativo)
          const searchParams = new URLSearchParams(location.search);
          const queryToken = searchParams.get('access_token');
          const queryType = searchParams.get('type');
          
          if (queryToken && queryType === 'recovery') {
            console.log('Token encontrado nos query params');
            const refresh_token = searchParams.get('refresh_token') || '';
            
            // Inicializar sessão com o token dos query params
            await processToken(queryToken, queryType, refresh_token);
            return;
          }
          
          // Não encontramos o token em nenhum lugar
          console.error('Token de acesso não encontrado na URL');
          setError('Link de redefinição inválido. Solicite um novo link.');
          return; // Não redirecionar, apenas mostrar o erro
        }
        
        // Processar o hash (formato padrão do Supabase)
        // Remover o # inicial
        hashString = hashString.substring(1);
        console.log('Hash processado:', hashString);
        
        const hashParams = new URLSearchParams(hashString);
        
        // Extrair os parâmetros do hash
        const token = hashParams.get('access_token');
        const type = hashParams.get('type');
        const refresh_token = hashParams.get('refresh_token') || '';
        
        console.log('Token encontrado no hash:', token ? 'Sim' : 'Não');
        console.log('Tipo do token:', type);
        
        if (!token) {
          console.error('Token de acesso não encontrado no hash');
          setError('Link de redefinição inválido. Solicite um novo link.');
          return; // Não redirecionar, apenas mostrar o erro
        }
        
        if (type !== 'recovery') {
          console.error('Tipo de token incorreto:', type);
          setError('Link de redefinição inválido. Solicite um novo link.');
          return; // Não redirecionar, apenas mostrar o erro
        }
        
        // Processar o token encontrado
        await processToken(token, type, refresh_token);
        
      } catch (error) {
        console.error('Erro ao verificar token de recuperação de senha:', error);
        setError('Erro ao verificar token de recuperação. Por favor, solicite um novo link.');
        // Não redirecionar em caso de erro, apenas mostrar a mensagem
      }
    };
    
    // Função auxiliar para processar o token e inicializar a sessão
    const processToken = async (token: string, type: string, refresh_token: string) => {
      console.log('Processando token de recuperação...');
      console.log('Token recebido:', token);
      console.log('Tipo do token:', type);
      
      try {
        // Usar o método setSession que é compatível com a versão 2.50.3 do Supabase
        console.log('Tentando inicializar sessão com o token...');
        
        // Verificar se o token é um token JWT válido ou apenas um identificador
        if (token.length < 30) {
          console.log('Token parece ser um identificador simples, não um JWT válido');
          
          // Se for apenas um identificador, podemos tentar usar o token como parte de uma URL de callback
          // que o Supabase possa reconhecer
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (!userError && userData?.user) {
            console.log('Usuário já está autenticado:', userData.user);
            setAccessToken(token);
            setTokenVerified(true);
            return true;
          }
          
          console.error('Token não é válido para recuperação de senha');
          setError('Link de redefinição inválido. Solicite um novo link.');
          return false;
        }
        
        // Tentar inicializar a sessão com o token JWT
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: refresh_token || ''
        });
        
        if (sessionError) {
          console.error('Erro ao inicializar sessão:', sessionError);
          
          // Verificar se o usuário já está autenticado
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (!userError && userData?.user) {
            console.log('Usuário já está autenticado:', userData.user);
            setAccessToken(token);
            setTokenVerified(true);
            return true;
          }
          
          setError('Erro ao processar token de recuperação. Por favor, solicite um novo link.');
          return false;
        }
        
        console.log('Sessão inicializada com sucesso!');
        setAccessToken(token);
        setTokenVerified(true);
        setError('');
        return true;
      } catch (error) {
        console.error('Exceção ao processar token de recuperação:', error);
        setError('Erro ao processar token de recuperação. Por favor, solicite um novo link.');
        return false;
      }
    };

    verifyToken();
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setIsLoading(true);

    try {
      if (!tokenVerified || !accessToken) {
        setError('O token de redefinição não foi verificado. Por favor, solicite um novo link.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        setError('Erro ao redefinir senha: ' + error.message);
        setIsLoading(false);
        return;
      }

      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);

      if (error.message) {
        setError('Erro ao redefinir senha: ' + error.message);
      } else {
        setError('Erro ao redefinir senha. Por favor, tente novamente.');
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Redefinir Senha
          </h2>
        </div>
        
        {tokenVerified ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="password" className="sr-only">Nova Senha</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="sr-only">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirme a nova senha"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processando...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4">Verificando token de redefinição...</p>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Voltar para o Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
