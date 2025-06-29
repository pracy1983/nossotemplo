import React, { useState } from 'react';
import { Search, Shield, ShieldCheck, Save, Eye, Filter, User, Users, Crown, AlertTriangle, X, Edit3, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student, FilterUnit, FilterRole, UserRole } from '../../types';
import { DEFAULT_TEMPLES, USER_ROLES, ROLE_COLORS, ROLE_PERMISSIONS } from '../../utils/constants';
import { formatDate, validateEmail, formatPhone, formatCPF } from '../../utils/helpers';
import Modal from '../common/Modal';

const ManageAdmins: React.FC = () => {
  const { students, updateStudent, deleteStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState<FilterUnit>('all');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [roleChanges, setRoleChanges] = useState<Record<string, UserRole>>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string>('');

  // Get all students (including guests for admin management)
  const allUsers = students;

  // Get current role (including pending changes) - moved before filteredUsers
  const getCurrentRole = (student: Student): UserRole => {
    if (roleChanges.hasOwnProperty(student.id)) {
      return roleChanges[student.id];
    }
    
    // Determine role based on current flags
    if (student.isAdmin) return 'admin';
    if (student.role === 'collaborator') return 'collaborator';
    return 'student';
  };

  // Filter students based on search and filters
  const filteredUsers = allUsers.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
    
    // Determine current role (including pending changes)
    const currentRole = getCurrentRole(student);
    const matchesRole = filterRole === 'all' || currentRole === filterRole;
    
    return matchesSearch && matchesUnit && matchesRole;
  });

  // Handle role change
  const handleRoleChange = (studentId: string, newRole: UserRole) => {
    setRoleChanges(prev => ({
      ...prev,
      [studentId]: newRole
    }));
  };

  // Save all role changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      const updatePromises = Object.entries(roleChanges).map(([studentId, newRole]) => {
        const updates: Partial<Student> = {
          role: newRole,
          isAdmin: newRole === 'admin'
        };
        
        return updateStudent(studentId, updates);
      });

      await Promise.all(updatePromises);
      setRoleChanges({});
      alert('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving role changes:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are pending changes
  const hasPendingChanges = Object.keys(roleChanges).length > 0;

  // Handle student click to view profile
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setFormData(student);
    setPhoto(student.photo || '');
    setIsEditing(false);
    setErrors({});
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setFormData({});
    setPhoto('');
    setIsEditing(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm() || !selectedStudent) return;

    setIsSaving(true);
    
    try {
      const updatedData = {
        ...formData,
        photo
      };

      await updateStudent(selectedStudent.id, updatedData);
      
      // Update the selected student with new data
      setSelectedStudent({ ...selectedStudent, ...updatedData });
      setIsEditing(false);
      setErrors({});
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedStudent) return;
    
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await deleteStudent(selectedStudent.id);
        handleCloseModal();
        alert('Usuário excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Erro ao excluir usuário. Tente novamente.');
      }
    }
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'collaborator':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Hierarquia</h1>
          <p className="text-gray-400">
            Gerencie os níveis de acesso: Administrador, Colaborador e Aluno
          </p>
        </div>

        {hasPendingChanges && (
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-6 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        )}
      </div>

      {/* Role Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(USER_ROLES).map(([role, label]) => {
          const count = filteredUsers.filter(user => getCurrentRole(user) === role).length;
          const permissions = ROLE_PERMISSIONS[role as UserRole];
          
          return (
            <div key={role} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                {getRoleIcon(role as UserRole)}
                <div>
                  <h3 className="text-lg font-semibold text-white">{label}</h3>
                  <p className="text-gray-400 text-sm">{count} usuário(s)</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Permissões:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {permissions.slice(0, 3).map((permission, index) => (
                    <li key={index}>• {permission}</li>
                  ))}
                  {permissions.length > 3 && (
                    <li className="text-gray-500">• +{permissions.length - 3} mais...</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value as FilterUnit)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todas as Unidades</option>
              <option value="SP">Templo SP</option>
              <option value="BH">Templo BH</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todas as Funções</option>
              <option value="admin">Administradores</option>
              <option value="collaborator">Colaboradores</option>
              <option value="student">Alunos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Lista de Usuários</h2>
          <div className="text-sm text-gray-400">
            {filteredUsers.length} usuário(s) encontrado(s)
          </div>
        </div>

        <div className="space-y-3">
          {filteredUsers.map(student => {
            const currentRole = getCurrentRole(student);
            const hasChanges = roleChanges.hasOwnProperty(student.id);

            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  hasChanges ? 'ring-2 ring-yellow-600/50 bg-yellow-600/5 border-yellow-600/20' : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                    alt={student.fullName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleStudentClick(student)}
                        className="font-medium text-white hover:text-red-400 transition-colors"
                      >
                        {student.fullName}
                      </button>
                      
                      {student.isFounder && (
                        <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-full">
                          Fundador
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                      <span>{student.email}</span>
                      <span>•</span>
                      <span>{DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES]}</span>
                      <span>•</span>
                      <span className={student.isActive ? 'text-green-400' : 'text-red-400'}>
                        {student.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {hasChanges && (
                    <div className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">
                      {currentRole === 'admin' ? 'Promovendo para Admin' : 
                       currentRole === 'collaborator' ? 'Definindo como Colaborador' : 
                       'Definindo como Aluno'}
                    </div>
                  )}

                  <button
                    onClick={() => handleStudentClick(student)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Função:</span>
                    <select
                      value={currentRole}
                      onChange={(e) => handleRoleChange(student.id, e.target.value as UserRole)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="student">Aluno</option>
                      <option value="collaborator">Colaborador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[currentRole]}`}>
                    {USER_ROLES[currentRole]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>

      {/* Pending Changes Summary */}
      {hasPendingChanges && (
        <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Alterações Pendentes</span>
              </h3>
              <p className="text-gray-300">
                Você tem {Object.keys(roleChanges).length} alteração(ões) de hierarquia não salva(s).
                Clique em "Salvar Alterações" para aplicar.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setRoleChanges({})}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
              
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={handleCloseModal}
          title={isEditing ? 'Editar Perfil' : 'Perfil do Usuário'}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header with Role and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${ROLE_COLORS[getCurrentRole(selectedStudent)]}`}>
                  {USER_ROLES[getCurrentRole(selectedStudent)]}
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedStudent.isActive
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
                }`}>
                  {selectedStudent.isActive ? 'Ativo' : 'Inativo'}
                </div>
                
                {selectedStudent.isFounder && (
                  <div className="bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                    Fundador
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(selectedStudent);
                        setPhoto(selectedStudent.photo || '');
                        setErrors({});
                      }}
                      className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo Section */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={photo || selectedStudent.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                      alt={selectedStudent.fullName}
                      className="w-full h-80 object-cover rounded-lg"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                          <Edit3 className="w-5 h-5 inline mr-2" />
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

              {/* Information Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.fullName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      ) : (
                        <p className="text-white">{selectedStudent.fullName}</p>
                      )}
                      {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      ) : (
                        <p className="text-white">{selectedStudent.email}</p>
                      )}
                      {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Data de Nascimento *
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.birthDate || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      ) : (
                        <p className="text-white">{formatDate(selectedStudent.birthDate)}</p>
                      )}
                      {errors.birthDate && <p className="text-red-400 text-sm mt-1">{errors.birthDate}</p>}
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
                          placeholder="(00) 00000-0000"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      ) : (
                        <p className="text-white">{selectedStudent.phone || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        CPF
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.cpf || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                          placeholder="000.000.000-00"
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      ) : (
                        <p className="text-white">{selectedStudent.cpf || 'Não informado'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unidade
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.unit || 'SP'}
                          onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as 'SP' | 'BH' }))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        >
                          <option value="SP">Templo SP</option>
                          <option value="BH">Templo BH</option>
                        </select>
                      ) : (
                        <p className="text-white">{DEFAULT_TEMPLES[selectedStudent.unit as keyof typeof DEFAULT_TEMPLES]}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Permissões da Função</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {getRoleIcon(getCurrentRole(selectedStudent))}
                      <span className="font-medium text-white">
                        {USER_ROLES[getCurrentRole(selectedStudent)]}
                      </span>
                    </div>
                    
                    <ul className="text-sm text-gray-300 space-y-1">
                      {ROLE_PERMISSIONS[getCurrentRole(selectedStudent)].map((permission, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Spiritual Development Dates */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Desenvolvimento Espiritual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Início de Desenvolvimento:</span>
                      <p className="text-white">
                        {selectedStudent.developmentStartDate ? formatDate(selectedStudent.developmentStartDate) : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Início do Estágio:</span>
                      <p className="text-white">
                        {selectedStudent.internshipStartDate ? formatDate(selectedStudent.internshipStartDate) : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Iniciação como Magista:</span>
                      <p className="text-white">
                        {selectedStudent.magistInitiationDate ? formatDate(selectedStudent.magistInitiationDate) : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Entrada na N.O.T.:</span>
                      <p className="text-white">
                        {selectedStudent.notEntryDate ? formatDate(selectedStudent.notEntryDate) : 'Não informado'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Iniciação como Mestre Mago:</span>
                      <p className="text-white">
                        {selectedStudent.masterMagusInitiationDate ? formatDate(selectedStudent.masterMagusInitiationDate) : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageAdmins;