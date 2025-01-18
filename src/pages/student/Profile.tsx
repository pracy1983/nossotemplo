import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../../components/LoadingScreen';
import { AttendanceCalendar } from '../../components/AttendanceCalendar';

export function StudentProfile() {
  const { user, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    religion: '',
  });

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definido';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      religion: user.religion || '',
    });
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Header with Photo */}
          <div className="relative h-48 bg-gradient-to-b from-red-600/20 to-gray-900">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <img
                  src={user.photo_url || 'https://via.placeholder.com/120'}
                  alt={user.full_name}
                  className="w-32 h-40 object-cover rounded-lg border-4 border-gray-900"
                />
                {user.is_founder && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">F</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`px-8 py-2 mt-20 ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
            <span className="font-semibold">
              {user.is_active 
                ? 'Ativo' 
                : `Inativo desde ${formatDate(user.inactive_since)}`}
            </span>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">Informações Pessoais</h2>
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400">Nome Completo</label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full bg-gray-800 rounded-lg px-3 py-2 mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-gray-800 rounded-lg px-3 py-2 mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400">Telefone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-gray-800 rounded-lg px-3 py-2 mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400">Religião</label>
                        <input
                          type="text"
                          value={formData.religion}
                          onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                          className="w-full bg-gray-800 rounded-lg px-3 py-2 mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-sm text-gray-400">Email</span>
                        <span>{user.email}</span>
                      </div>
                      <div>
                        <span className="block text-sm text-gray-400">Telefone</span>
                        <span>{user.phone || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="block text-sm text-gray-400">Religião</span>
                        <span>{user.religion || 'Não informado'}</span>
                      </div>
                      <div>
                        <span className="block text-sm text-gray-400">Unidade</span>
                        <span>{user.unit}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Datas Importantes</h2>
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm text-gray-400">Início do Desenvolvimento</span>
                    <span>{formatDate(user.development_start_date)}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-400">Início do Estágio</span>
                    <span>{formatDate(user.internship_start_date)}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-400">Iniciação como Magista</span>
                    <span>{formatDate(user.magista_initiation_date)}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-400">Entrada na N.O.T.</span>
                    <span>{formatDate(user.not_entry_date)}</span>
                  </div>
                  <div>
                    <span className="block text-sm text-gray-400">Iniciação como Mestre Mago</span>
                    <span>{formatDate(user.master_mage_initiation_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Calendar */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Quadro de Frequência</h2>
              <AttendanceCalendar userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}