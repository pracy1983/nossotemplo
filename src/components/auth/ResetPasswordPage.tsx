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

  verifyToken();
}, [navigate, location]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
              {isLoading ? 'Processando...' : 'Redefinir Senha'}
            </button>
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
