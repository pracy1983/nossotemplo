import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseManager } from '../../../lib/supabaseClient';
import { toast } from 'react-toastify';
import { Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

const ConvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState<string>('');
  
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
  
  // Validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Lidar com mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const supabase = await supabaseManager.getClient();
      
      // Atualizar o status do convite e definir a senha
      const { error } = await supabase
        .from('students')
        .update({
          invite_status: 'accepted',
          password: formData.password, // Nota: Em produção, isso deve ser feito com hash seguro
          updated_at: new Date().toISOString()
        })
        .eq('invite_token', token);
      
      if (error) {
        throw error;
      }
      
      toast.success('Senha definida com sucesso! Você pode fazer login agora.');
      
      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro ao definir senha:', error);
      toast.error(`Erro ao definir senha: ${error.message || 'Ocorreu um erro desconhecido'}`);
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
  
  // Renderizar formulário de definição de senha
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
        <div className="text-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Convite Aceito</h2>
          <p className="text-gray-300 mb-1">Olá, {studentName}!</p>
          <p className="text-gray-400">
            Seu convite foi validado. Por favor, defina uma senha para acessar sua conta.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full bg-gray-800 border ${errors.password ? 'border-red-500' : 'border-gray-700'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full bg-gray-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Confirme sua senha"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Processando...
              </>
            ) : (
              'Definir Senha e Acessar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConvitePage;
