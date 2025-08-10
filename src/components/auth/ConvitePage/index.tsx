import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseManager } from '../../../lib/supabaseClient';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const ConvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('');
  
  // Detectar e redirecionar tokens de redefinição de senha
  useEffect(() => {
    // Verificar se o token está no formato de token de redefinição de senha
    if (token && token.startsWith('token-')) {
      console.log('Detectado token de redefinição de senha no formato incorreto:', token);
      
      // Extrair o token numérico
      const tokenValue = token.replace('token-', '');
      console.log('Valor do token extraído:', tokenValue);
      
      // Redirecionar para a página de redefinição de senha com o formato correto
      const redirectUrl = `/redefinir-senha#access_token=${tokenValue}&type=recovery`;
      console.log('Redirecionando para:', redirectUrl);
      
      // Usar window.location para garantir um redirecionamento completo
      window.location.href = redirectUrl;
      return;
    }
  }, [token]);
  
  // Verificar o token do convite
  useEffect(() => {
    const validateInviteToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const supabase = await supabaseManager.getClient();
        
        // Buscar o convite pelo token
        const { data, error } = await supabase
          .from('students')
          .select('full_name, invite_status, invite_token')
          .eq('invite_token', token)
          .single();
        
        if (error || !data) {
          console.error('Erro ao validar token:', error);
          setIsValidToken(false);
          return;
        }
        
        // Verificar se o convite é válido (status pending)
        if (data.invite_status !== 'pending') {
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
          setStudentName(data.full_name);
        }
      } catch (error) {
        console.error('Erro ao processar convite:', error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    validateInviteToken();
  }, [token]);
  
  // Não precisamos mais da validação de formulário de senha
  
  // Não precisamos mais do manipulador de mudanças no formulário
  
  // Processar o convite
  const handleProcessInvite = async () => {
    setIsSubmitting(true);
    
    try {
      const supabase = await supabaseManager.getClient();
      
      // Buscar email E senha temporária do usuário associado ao token
      const { data: userData, error: userError } = await supabase
        .from('students')
        .select('email, temp_password')
        .eq('invite_token', token)
        .single();

      if (userError || !userData) {
        throw new Error('Não foi possível encontrar o usuário associado a este convite.');
      }

      // Verificar se o usuário já existe no sistema de autenticação
      let userExists = false;

      try {
        const { error: authCheckError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: 'placeholder-password-that-will-fail'
        });
        userExists = authCheckError && authCheckError.message.includes('Invalid login credentials');
      } catch (error) {
        console.log('Erro ao verificar existência do usuário:', error);
        userExists = false;
      }

      // Se o usuário não existe, criar no Auth com senha temporária
      if (!userExists) {
        if (!userData.temp_password) {
          throw new Error('Senha temporária não encontrada para este convite.');
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.temp_password
        });
        if (signUpError) {
          throw new Error('Erro ao criar usuário Auth: ' + signUpError.message);
        }
        // Atualizar status do convite para 'accepted'
        await supabase
          .from('students')
          .update({ invite_status: 'accepted', updated_at: new Date().toISOString() })
          .eq('invite_token', token);
        toast.success('Conta criada! Use a senha temporária recebida por e-mail para acessar e troque sua senha no primeiro acesso.');
        setTimeout(() => {
          navigate('/login?email=' + encodeURIComponent(userData.email));
        }, 2000);
        return;
      }

      // Se o usuário já existe, podemos usar o fluxo de redefinição de senha
      // Atualizar o status do convite para 'accepted'
      const { error: updateError } = await supabase
        .from('students')
        .update({
          invite_status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('invite_token', token);
        
      if (updateError) {
        console.error('Erro ao atualizar status do convite:', updateError);
        throw updateError;
      }
      
      // Nota: Como não temos acesso direto ao método resetPasswordForEmail,
      // vamos informar ao usuário para usar o fluxo "Esqueci minha senha" na página de login
      toast.success('Convite aceito! Por favor, use a opção "Esqueci minha senha" na página de login para definir sua senha.');
      
      // Redirecionar para a página de login após um breve delay
      setTimeout(() => {
        navigate('/login?email=' + encodeURIComponent(userData.email));
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao processar convite:', error);
      toast.error(`Erro ao processar convite: ${error.message || 'Ocorreu um erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Verificando convite...</p>
        </div>
      </div>
    );
  }
  
  // Renderizar convite inválido
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
          <div className="text-center mb-6">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Convite Inválido</h2>
            <p className="text-gray-400">
              Este convite não é válido ou já foi utilizado. Por favor, solicite um novo convite ao administrador.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Renderizar página de convite aceito
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
        <div className="text-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Convite Aceito</h2>
          <p className="text-gray-300 mb-1">Olá, {studentName}!</p>
          <p className="text-gray-400">
            Seu convite foi validado. Clique no botão abaixo para aceitar o convite e configurar sua conta.
          </p>
        </div>
        
        <button
          onClick={handleProcessInvite}
          disabled={isSubmitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center mt-6"
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin mr-2" size={20} />
              Processando...
            </>
          ) : (
            'Aceitar Convite'
          )}
        </button>
      </div>
    </div>
  );
};

export default ConvitePage;
