import React, { useState } from 'react';
import { Search, Grid, List, Eye, Filter, Edit3, Save, X, Upload, Crop, Trash2, AlertTriangle, UserPlus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student, ViewMode, FilterStatus, FilterUnit } from '../../types';
import { DEFAULT_TEMPLES } from '../../utils/constants';
import { validateCPF, validateEmail, formatCPF, formatPhone, formatDate } from '../../utils/helpers';
import Modal from '../common/Modal';

interface StudentListProps {
  onNavigateToAddStudent?: () => void;
}

const StudentList: React.FC<StudentListProps> = ({ onNavigateToAddStudent }) => {
  const { students, updateStudent, deleteStudent } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterUnit, setFilterUnit] = useState<FilterUnit>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string>('');

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    if (student.isGuest) return false; // Don't show guests in student list
    
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && student.isActive) ||
      (filterStatus === 'inactive' && !student.isActive);
    const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
    
    return matchesSearch && matchesStatus && matchesUnit;
  });

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
    } else {
      // Check for duplicate email (only when changing email)
      const existingStudent = students.find(s => 
        s.email.toLowerCase() === formData.email!.toLowerCase() && 
        s.id !== formData.id
      );
      if (existingStudent) {
        newErrors.email = 'Já existe um aluno com este email';
      }
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
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
      alert('Aluno atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      
      if (error.message?.includes('Já existe um aluno com este email') ||
          error.message?.includes('duplicate key value violates unique constraint')) {
        setErrors({ email: 'Já existe um aluno com este email' });
        alert('Erro: Já existe um aluno cadastrado com este email. Use um email diferente.');
      } else {
        alert('Erro ao atualizar aluno. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    
    if (confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
      try {
        await deleteStudent(selectedStudent.id);
        handleCloseModal();
        alert('Aluno excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Erro ao excluir aluno. Tente novamente.');
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

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => (
    <div
      onClick={() => handleStudentClick(student)}
      className={`bg-gray-900 rounded-xl p-6 border border-gray-800 cursor-pointer transition-all hover:border-red-600 hover:shadow-lg ${
        !student.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Photo */}
        <div className="relative">
          <img
            src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
            alt={student.fullName}
            className="w-24 h-32 object-cover rounded-lg"
          />
          {student.isFounder && (
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              Fundador
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="text-center">
          <h3 className="font-semibold text-white mb-1">{student.fullName}</h3>
          <p className="text-gray-400 text-sm">{DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES]}</p>
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
            student.isActive
              ? 'bg-green-600/20 text-green-400'
              : 'bg-red-600/20 text-red-400'
          }`}>
            {student.isActive ? 'Ativo' : `Inativo desde ${student.inactiveSince || 'N/A'}`}
          </div>
        </div>
      </div>
    </div>
  );

  const StudentListItem: React.FC<{ student: Student }> = ({ student }) => (
    <div
      onClick={() => handleStudentClick(student)}
      className={`bg-gray-900 rounded-lg p-4 border border-gray-800 cursor-pointer transition-all hover:border-red-600 flex items-center space-x-4 ${
        !student.isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Photo */}
      <div className="relative flex-shrink-0">
        <img
          src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
          alt={student.fullName}
          className="w-12 h-16 object-cover rounded-lg"
        />
        {student.isFounder && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-white">{student.fullName}</h3>
        <p className="text-gray-400 text-sm">{DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES]}</p>
      </div>
      
      {/* Status */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        student.isActive
          ? 'bg-green-600/20 text-green-400'
          : 'bg-red-600/20 text-red-400'
      }`}>
        {student.isActive ? 'Ativo' : 'Inativo'}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lista de Alunos</h1>
          <p className="text-gray-400">Gerencie todos os alunos cadastrados</p>
        </div>
        
        <button
          onClick={onNavigateToAddStudent}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Adicionar Aluno</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'card' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-gray-400">
        Mostrando {filteredStudents.length} de {students.filter(s => !s.isGuest).length} alunos
      </div>

      {/* Students Grid/List */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map(student => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map(student => (
            <StudentListItem key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Nenhum aluno encontrado
          </h3>
          <p className="text-gray-500">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={handleCloseModal}
          title={isEditing ? 'Editar Aluno' : 'Perfil do Aluno'}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
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
                {selectedStudent.isAdmin && (
                  <div className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                    Administrador
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
                      onClick={handleDelete}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
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
                        <div>
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:ring-1 transition-colors ${
                              errors.email 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                : 'border-gray-700 focus:border-red-600 focus:ring-red-600'
                            }`}
                          />
                          {errors.email && (
                            <div className="flex items-center space-x-2 mt-1">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <p className="text-red-400 text-sm">{errors.email}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-white">{selectedStudent.email}</p>
                      )}
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
                      {errors.cpf && <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        RG
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.rg || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      ) : (
                        <p className="text-white">{selectedStudent.rg || 'Não informado'}</p>
                      )}
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
                        <p className="text-white">{selectedStudent.religion || 'Não informado'}</p>
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

                  {isEditing && (
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.isFounder || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, isFounder: e.target.checked }))}
                          className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                        />
                        <span className="text-gray-300">Fundador</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.isActive ?? true}
                          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded border-gray-700 bg-gray-800 text-green-600 focus:ring-green-600 focus:ring-offset-gray-900"
                        />
                        <span className="text-gray-300">Ativo</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.isAdmin || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                          className="rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-900"
                        />
                        <span className="text-gray-300">Administrador</span>
                      </label>
                    </div>
                  )}
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

export default StudentList;