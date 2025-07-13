import React, { useState } from 'react';
import { Edit3, Save, X, Upload } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { DEFAULT_TEMPLES } from '../../utils/constants';
import { formatDate, validateEmail, formatPhone } from '../../utils/helpers';

interface StudentProfileProps {
  student: Student;
}

const StudentProfileEdit: React.FC<StudentProfileProps> = ({ student }) => {
  const { updateStudent } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>(student);
  const [photo, setPhoto] = useState<string>(student.photo || '');

  const handleSave = async () => {
    if (!formData.fullName || !formData.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    if (!validateEmail(formData.email)) {
      alert('Email inválido');
      return;
    }

    try {
      await updateStudent(student.id, { ...formData, photo });
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setPhoto(student.photo || '');
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Meu Perfil</h2>
          <p className="text-gray-400">Visualize e edite suas informações pessoais</p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Section */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Foto do Perfil</h3>
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={photo || student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                  alt={student.fullName}
                  className="w-full h-80 object-cover rounded-lg"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                      <Upload className="w-5 h-5 inline mr-2" />
                      Alterar Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.fullName}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Mágicko (Artístico, apelido, etc)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.magickoName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, magickoName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.magickoName || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.phone || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Nascimento
                </label>
                <p className="text-white">{formatDate(student.birthDate)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unidade
                </label>
                <p className="text-white">{DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES] || `Templo ${student.unit}`}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Religião
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.religion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, religion: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.religion || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF
                </label>
                {isEditing && !student.cpf ? (
                  <input
                    type="text"
                    value={formData.cpf || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.cpf || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RG
                </label>
                {isEditing && !student.rg ? (
                  <input
                    type="text"
                    value={formData.rg || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.rg || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CEP
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.zipCode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                    placeholder="00000-000"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.zipCode || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cidade
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.city || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                {isEditing ? (
                  <select
                    value={formData.state || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  >
                    <option value="">Selecione o estado</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="PR">Paraná</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="BA">Bahia</option>
                    <option value="GO">Goiás</option>
                    <option value="PE">Pernambuco</option>
                    <option value="CE">Ceará</option>
                  </select>
                ) : (
                  <p className="text-white">{student.state || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rua
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.street || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.street || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.number || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Complemento
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.complement || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                    placeholder="Apto, sala, etc."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.complement || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bairro
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.neighborhood || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.neighborhood || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Spiritual Development Dates */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Histórico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Início de Desenvolvimento
                </label>
                {isEditing && (student.role === 'admin' || student.role === 'collaborator') ? (
                  <input
                    type="date"
                    value={formData.developmentStartDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, developmentStartDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.developmentStartDate ? formatDate(student.developmentStartDate) : 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Início do Estágio
                </label>
                {isEditing && (student.role === 'admin' || student.role === 'collaborator') ? (
                  <input
                    type="date"
                    value={formData.internshipStartDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, internshipStartDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.internshipStartDate ? formatDate(student.internshipStartDate) : 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Iniciação como Magista
                </label>
                {isEditing && (student.role === 'admin' || student.role === 'collaborator') ? (
                  <input
                    type="date"
                    value={formData.magistInitiationDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, magistInitiationDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.magistInitiationDate ? formatDate(student.magistInitiationDate) : 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Entrada na N.O.T.
                </label>
                {isEditing && (student.role === 'admin' || student.role === 'collaborator') ? (
                  <input
                    type="date"
                    value={formData.notEntryDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notEntryDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.notEntryDate ? formatDate(student.notEntryDate) : 'Não informado'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Iniciação como Mestre Mago
                </label>
                {isEditing && (student.role === 'admin' || student.role === 'collaborator') ? (
                  <input
                    type="date"
                    value={formData.masterMagusInitiationDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, masterMagusInitiationDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.masterMagusInitiationDate ? formatDate(student.masterMagusInitiationDate) : 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Social Media and Additional Information */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram Pessoal
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.instagramPersonal || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagramPersonal: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.instagramPersonal || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram Mágicko
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.instagramMagicko || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagramMagicko: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.instagramMagicko || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Como conheceu o templo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.howFoundTemple || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, howFoundTemple: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                ) : (
                  <p className="text-white">{student.howFoundTemple || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Termos de uso de imagem
                </label>
                {isEditing && !student.acceptsImageTerms ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.acceptsImageTerms || false}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        acceptsImageTerms: e.target.checked,
                        imageTermsAcceptedAt: e.target.checked ? new Date().toISOString() : undefined
                      }))}
                      className="w-5 h-5 bg-gray-800 border border-gray-700 rounded text-red-600 focus:ring-red-600"
                    />
                    <span className="text-white">Aceito os termos de uso de imagem</span>
                  </div>
                ) : (
                  <p className="text-white">
                    {student.acceptsImageTerms || formData.acceptsImageTerms ? 
                      <span className="text-green-400 font-medium">Aceitou os termos de uso de imagem {student.imageTermsAcceptedAt ? ' em ' + formatDate(student.imageTermsAcceptedAt) : ''}</span> : 
                      'Não aceito'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileEdit;