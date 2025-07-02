import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Student } from '../../types';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface InvitePageProps {
  token?: string;
}

const InvitePage: React.FC<InvitePageProps> = ({ token }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [student, setStudent] = useState<Partial<Student> | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    termsAccepted: false,
    imageTermsAccepted: false,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!student?.id) {
        throw new Error('Dados do estudante não encontrados.');
      }

      // Validar dados obrigatórios
      if (!formData.fullName || !formData.email || !formData.phone || !formData.birthDate) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }

      if (!formData.termsAccepted) {
        throw new Error('Você precisa aceitar os termos de uso para continuar.');
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

      setSuccess(true);
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
