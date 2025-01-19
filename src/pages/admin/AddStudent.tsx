import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../services/supabase';
import { toast } from 'react-toastify';
import { User } from '../../types';
import { PhotoUpload } from '../../components/PhotoUpload';

export function AddStudent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    cpf: '',
    rg: '',
    religion: '',
    unit: 'Templo SP',
    is_active: true,
    is_founder: false,
    is_admin: false,
    development_start_date: '',
    internship_start_date: '',
    magista_initiation_date: '',
    not_entry_date: '',
    master_mage_initiation_date: '',
    photo_url: '',
    inactive_since: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validação básica
      if (!formData.full_name || !formData.email) {
        throw new Error('Nome e email são obrigatórios');
      }

      // Verificar se já existe um usuário com este email
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        throw new Error('Já existe um usuário com este email');
      }

      // Se o usuário estiver inativo, definir a data de inativação
      const dataToInsert = {
        ...formData,
        inactive_since: !formData.is_active ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      };

      // Inserir novo usuário
      const { error } = await supabase
        .from('users')
        .insert([dataToInsert]);

      if (error) throw error;

      toast.success('Aluno adicionado com sucesso!');
      navigate('/students');
    } catch (error: any) {
      toast.error('Erro ao adicionar aluno: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePhotoChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      photo_url: url
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Adicionar Novo Aluno</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg">
          {/* Foto do Aluno */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Foto 3x4
            </label>
            <PhotoUpload
              onPhotoChange={handlePhotoChange}
              currentPhotoUrl={formData.photo_url}
            />
          </div>

          {/* Campos Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CPF
              </label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                RG
              </label>
              <input
                type="text"
                name="rg"
                value={formData.rg || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Religião
              </label>
              <input
                type="text"
                name="religion"
                value={formData.religion || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unidade
              </label>
              <select
                name="unit"
                value={formData.unit || 'Templo SP'}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="Templo SP">Templo SP</option>
                <option value="Templo BH">Templo BH</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <label className="text-sm font-medium text-gray-300">
                Aluno Ativo
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_founder"
                checked={formData.is_founder}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <label className="text-sm font-medium text-gray-300">
                É Fundador
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_admin"
                checked={formData.is_admin}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <label className="text-sm font-medium text-gray-300">
                É Administrador
              </label>
            </div>
          </div>

          {/* Datas Importantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início do Desenvolvimento
              </label>
              <input
                type="date"
                name="development_start_date"
                value={formData.development_start_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início do Estágio
              </label>
              <input
                type="date"
                name="internship_start_date"
                value={formData.internship_start_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Iniciação Magista
              </label>
              <input
                type="date"
                name="magista_initiation_date"
                value={formData.magista_initiation_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Entrada NOT
              </label>
              <input
                type="date"
                name="not_entry_date"
                value={formData.not_entry_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Iniciação Mestre Mago
              </label>
              <input
                type="date"
                name="master_mage_initiation_date"
                value={formData.master_mage_initiation_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {!formData.is_active && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Inativação
                </label>
                <input
                  type="date"
                  name="inactive_since"
                  value={formData.inactive_since || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
