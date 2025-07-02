import React, { useState, useEffect } from 'react';
import { Student } from '../../types';
import { CheckCircle, XCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Criando cliente Supabase diretamente
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface InvitePageProps {
  token?: string;
}

const InvitePage: React.FC<InvitePageProps> = ({ token }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [student, setStudent] = useState<Partial<Student> | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    imageTermsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token de convite inválido ou ausente.');
        setLoading(false);
        return;
      }

      try {
        // Buscar o estudante pelo token de convite
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('invite_token', token)
          .single();

        if (error) {
          throw new Error('Erro ao verificar convite: ' + error.message);
        }

        if (!data) {
          setError('Convite não encontrado ou expirado.');
          setLoading(false);
          return;
        }

        // Verificar se o convite está pendente
        if (data.invite_status !== 'pending') {
          setError(`Este convite já foi ${data.invite_status === 'accepted' ? 'aceito' : 'rejeitado ou expirado'}.`);
          setLoading(false);
          return;
        }

        // Preencher dados do formulário com informações do convite
        setStudent({
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          unit: data.unit,
          turma: data.turma,
          inviteStatus: data.invite_status,
          inviteToken: data.invite_token,
          invitedAt: data.invited_at,
          invitedBy: data.invited_by,
        });

        setFormData({
          ...formData,
          fullName: data.full_name || '',
          email: data.email || '',
        });

        setLoading(false);
      } catch (err) {
        console.error('Erro ao verificar token:', err);
        setError('Erro ao verificar convite. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validateInviteForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Telefone é obrigatório';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'Você precisa aceitar os termos de uso';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!student?.id) {
        throw new Error('Dados do estudante não encontrados.');
      }

      if (!validateInviteForm()) {
        setLoading(false);
        return;
      }

      // Criar usuário no Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (signUpError) {
        throw new Error('Erro ao criar conta: ' + signUpError.message);
      }

      // Atualizar o registro do estudante
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birthDate,
          terms_accepted: formData.termsAccepted,
          image_terms_accepted: formData.imageTermsAccepted,
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', student.id);

      if (error) {
        throw new Error('Erro ao aceitar convite: ' + error.message);
      }

      // Fazer login automático
      const loginSuccess = await login(formData.email, formData.password);
      
      if (!loginSuccess) {
        // Se o login falhar, ainda consideramos o cadastro como sucesso
        console.error('Erro ao fazer login automático');
        setSuccess(true);
      } else {
        // Redirecionar para a página de edição de perfil
        window.location.href = '/profile/edit';
      }

      setLoading(false);
    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Verificando convite...</h2>
          <p className="text-gray-400">Aguarde enquanto verificamos seu convite.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white text-center mb-4">Erro no Convite</h2>
          <p className="text-gray-300 text-center mb-6">{error}</p>
          <div className="text-center">
            <a 
              href="/" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              Voltar para a página inicial
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white text-center mb-4">Convite Aceito!</h2>
          <p className="text-gray-300 text-center mb-6">
            Parabéns! Seu cadastro foi concluído com sucesso. Você agora é membro do Nosso Templo.
          </p>
          <div className="text-center">
            <a 
              href="/login" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              Fazer Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Complete seu Cadastro</h2>
        
        <p className="text-gray-300 mb-6">
          Olá, <span className="font-semibold">{student?.fullName}</span>! Você foi convidado para se juntar ao Nosso Templo. 
          Por favor, complete seu cadastro abaixo para aceitar o convite.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(00) 00000-0000"
              required
            />
          </div>
          
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300 mb-1">
              Data de Nascimento *
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button 
                type="button" 
                className="absolute right-2 top-2.5 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repita sua senha"
                required
              />
              <button 
                type="button" 
                className="absolute right-2 top-2.5 text-gray-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-start mt-6">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500"
              required
            />
            <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-300">
              Eu aceito os <a href="/termos" className="text-blue-400 hover:underline">termos de uso</a> e <a href="/privacidade" className="text-blue-400 hover:underline">política de privacidade</a> *
            </label>
          </div>
          
          <div className="flex items-start">
            <input
              type="checkbox"
              id="imageTermsAccepted"
              name="imageTermsAccepted"
              checked={formData.imageTermsAccepted}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500"
            />
            <label htmlFor="imageTermsAccepted" className="ml-2 block text-sm text-gray-300">
              Eu autorizo o uso da minha imagem em fotos e vídeos de eventos
            </label>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Aceitar Convite e Concluir Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvitePage;
