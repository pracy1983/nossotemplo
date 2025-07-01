import React, { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { generateInviteLink } from '../../utils/emailService';
// @ts-ignore - O arquivo de validação é criado em tempo de execução
import { validateEmail, isServer } from '../../utils/validation';
import StudentInviteTable from './StudentInviteTable';
import StudentDetailsModal from './StudentDetailsModal';
import StudentRejectModal from './StudentRejectModal';
import StudentDeleteModal from './StudentDeleteModal';

const StudentInvites: React.FC = () => {
  const { students, temples, addStudent, updateStudent, deleteStudent } = useData();
  
  // Estados de busca e filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired' | 'rejected'>('all');
  const [filterUnit, setFilterUnit] = useState<'all' | string>('all');
  
  // Estados para modais e visualização de membros
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState<boolean>(false);
  const [rejectingStudent, setRejectingStudent] = useState<Student | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  // Estado para seleção de membros (para ações em massa)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Estado de paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  
  // Estados para o modal de convite
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  
  // Estado de formulário de convite
  const [inviteForm, setInviteForm] = useState<{
    fullName: string;
    email: string;
    unit: string;
    turma: string;
    invitedBy: string;
  }>({
    fullName: '',
    email: '',
    unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
    turma: '',
    invitedBy: 'Administrador'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dados dos filtros e paginação
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
                         student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || student.inviteStatus === filterStatus;
    const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
    return matchesSearch && matchesStatus && matchesUnit && (student.inviteStatus || student.isPendingApproval);
  });

  // Paginação  // Get paginated students
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const paginatedStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  
  // Função para mudar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0); // Rolagem para o topo da página
  };

  // Funções para visualização, rejeição e exclusão de membros
  const handleViewStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    // Definir o estudante para visualização e abrir o modal
    setViewingStudent(student);
    setShowStudentDetailsModal(true);
  };
  
  const handleOpenRejectModal = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    // Definir o estudante para rejeição e abrir o modal
    setRejectingStudent(student);
    setShowRejectModal(true);
  };
  
  const handleOpenDeleteModal = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    // Definir o estudante para exclusão e abrir o modal
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };
  
  // Função para aprovar estudante
  const handleApproveStudent = async (studentId: string) => {
    try {
      const studentToUpdate = students.find(s => s.id === studentId);
      if (studentToUpdate) {
        const updatedStudent = {
          ...studentToUpdate,
          inviteStatus: 'accepted' as const,
          isPendingApproval: false
        };
        await updateStudent(studentId, updatedStudent);
        alert('Membro aprovado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao aprovar membro:', error);
      alert('Erro ao aprovar membro. Tente novamente.');
    }
  };

  
  // Funções auxiliares para status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-white text-gray-800'; // Padronizado para branco
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-white text-gray-800'; // Padronizado para branco
    }
  };
  
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'accepted': return 'Aceito';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  // Função para rejeitar estudante
  const handleRejectStudent = async (studentId: string, reason: string = '') => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      // Criar um novo objeto com as propriedades necessárias
      const updatedStudent: Student = {
        ...student,
        isPendingApproval: false,
        isActive: false,
        inviteStatus: 'rejected' as const,
        rejectReason: reason
      };
      
      await updateStudent(studentId, updatedStudent);
      if (!isServer) {
        console.log(`Email de notificação de rejeição seria enviado para ${student.email} em ambiente de produção`);
      }
      
      alert(`Membro ${student.fullName} rejeitado com sucesso!`);
      
      // Fechar o modal de rejeição se estiver aberto
      if (showRejectModal) {
        setShowRejectModal(false);
        setRejectingStudent(null);
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('Erro ao rejeitar membro. Tente novamente.');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const student = students.find(s => s.id === id);
      if (!student) return;
      
      // Excluir o estudante usando a função do contexto de dados
      await deleteStudent(id);
      
      // Feedback de email (condicional dependendo do ambiente)
      if (!isServer) {
        console.log(`Email de notificação de exclusão seria enviado para o administrador em ambiente de produção`);
      }
      
      alert(`Membro ${student.fullName} excluído com sucesso!`);
      
      // Fechar o modal de exclusão se estiver aberto
      if (showDeleteModal) {
        setShowDeleteModal(false);
        setDeletingStudent(null);
      }
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      alert('Erro ao excluir membro. Tente novamente.');
    }
  };
  
  // Funções para seleção de estudantes
  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      // Se todos já estão selecionados, desseleciona todos
      setSelectedStudents(new Set<string>());
    } else {
      // Seleciona todos os estudantes filtrados
      const newSelected = new Set<string>();
      filteredStudents.forEach(student => {
        if (student && student.id) {
          newSelected.add(student.id);
        }
      });
      setSelectedStudents(newSelected);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };
  
  // Funções para manipulação de convites
  const handleInviteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteForm((prev: any) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Função para validar o formulário de convite
  const validateInviteForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!inviteForm.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }
    
    if (!inviteForm.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(inviteForm.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  // Função para reenviar email de convite
  const handleResendInviteEmail = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      // Gerar novo token de convite se necessário
      if (!student.inviteToken) {
        const updatedStudent = {
          ...student,
          inviteToken: `token-${Date.now()}`
        };
        await updateStudent(studentId, updatedStudent);
      }
      
      // Gerar link de convite
      const inviteLink = generateInviteLink(student?.inviteToken || '');
      
      // Enviar email (simulado em desenvolvimento)
      if (!isServer) {
        console.log('Simulando reenvio de email para:', student.email);
        console.log('Link do convite:', inviteLink);
        alert(`Link de convite gerado para ${student.fullName}. Em ambiente de produção, o email seria enviado automaticamente.`);
      } else {
        alert(`Email reenviado com sucesso para ${student.fullName}!`);
      }
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      alert('Erro ao reenviar email. Tente novamente.');
    }
  };
  
  // Função para lidar com a criação de convite
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInviteForm()) return;
    
    try {
      // Criar um objeto Student com valores padrão
      const newStudent: Student = {
        id: `temp-${Date.now()}`,
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        birthDate: '',
        cpf: '',
        rg: '',
        religion: '',
        phone: '',
        unit: inviteForm.unit,
        isFounder: false,
        isActive: true,
        isAdmin: false,
        isGuest: false,
        role: 'student',
        attendance: [],
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        zipCode: '',
        city: '',
        state: '',
        turma: inviteForm.turma,
        isPendingApproval: true,
        inviteStatus: 'pending',
        inviteToken: `token-${Date.now()}`,
        invitedBy: inviteForm.invitedBy,
        instagramPersonal: '',
        instagramMagicko: '',
        termsAccepted: false,
        imageTermsAccepted: false,
        acceptsImageTerms: false
      };
      
      // Adicionar estudante ao banco de dados
      const addedStudent = await addStudent(newStudent);
      
      if (!addedStudent?.id) {
        throw new Error('Falha ao adicionar estudante');
      }
      
      // Gerar link de convite
      const inviteLink = generateInviteLink(addedStudent?.inviteToken || '');
      
      // Enviar email (simulado em desenvolvimento)
      if (!isServer) {
        console.log('Simulando envio de email para:', newStudent.email);
        console.log('Link do convite:', inviteLink);
      }
      
      // Resetar formulário
      setInviteForm({
        fullName: '',
        email: '',
        unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
        turma: '',
        invitedBy: 'Administrador'
      });
      
      // Mostrar feedback
      alert(`Convite enviado com sucesso para ${inviteForm.fullName}!`);
    } catch (error: any) {
      console.error('Erro ao criar convite:', error);
      
      // Tratamento específico para erro de email já existente
      if (error.message && error.message.includes('existe um aluno com este email')) {
        alert(`Erro: Já existe um aluno cadastrado com o email ${inviteForm.email}. Por favor, use outro email ou reenvie o convite para o aluno existente.`);
      } else {
        alert(`Erro ao criar convite: ${error.message || 'Tente novamente.'}`);
      }
    }
  };
  
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedStudents.size === 0) {
      alert('Selecione pelo menos um membro para realizar esta ação.');
      return;
    }
    
    const confirmMessage = action === 'approve' 
      ? `Tem certeza que deseja aprovar ${selectedStudents.size} membros?`
      : `Tem certeza que deseja rejeitar ${selectedStudents.size} membros?`;
    
    if (confirm(confirmMessage)) {
      try {
        for (const studentId of selectedStudents) {
          const student = students.find(s => s.id === studentId);
          if (!student) continue;
          
          if (action === 'approve') {
            await handleApproveStudent(studentId);
          } else {
            await handleRejectStudent(studentId);
          }
        }
        
        setSelectedStudents(new Set());
        
        const actionText = action === 'approve' ? 'aprovados' : 'rejeitados';
        alert(`Membros ${actionText} com sucesso!`);
      } catch (error) {
        console.error(`Error ${action}ing students:`, error);
        alert(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} membros. Tente novamente.`);
      }
    }
  };
  
  // Renderização do componente
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Convites de Membros</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          title="Criar novo convite"
        >
          <Plus size={16} />
          <span>Novo Convite</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-full md:w-1/3 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome ou email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border border-gray-600 pl-10 pr-4 py-2 rounded-md w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="accepted">Aceitos</option>
            <option value="expired">Expirados</option>
            <option value="rejected">Rejeitados</option>
          </select>

          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="bg-gray-700 border border-gray-600 px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Unidades</option>
            {temples.map((temple) => (
              <option key={temple.id} value={temple.abbreviation}>
                {temple.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto">
          {selectedStudents.size > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md"
                title="Aprovar Selecionados">
                <Check size={18} />
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md"
                title="Rejeitar Selecionados">
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Convites */}
      <StudentInviteTable 
        students={paginatedStudents}
        selectedStudents={selectedStudents}
        onSelectStudent={handleSelectStudent}
        onSelectAll={handleSelectAll}
        onViewDetails={handleViewStudent}
        onReject={handleOpenRejectModal}
        onDelete={handleOpenDeleteModal}
        onResendEmail={handleResendInviteEmail}
        onApprove={handleApproveStudent}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-1 mt-4">
          <button
            onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-800 text-gray-500'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-800 text-gray-500'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modal de detalhes do membro */}
      <StudentDetailsModal
        student={viewingStudent}
        isOpen={showStudentDetailsModal}
        onClose={() => {
          setShowStudentDetailsModal(false);
          setViewingStudent(null);
        }}
      />

      {/* Modal de rejeição de membro */}
      <StudentRejectModal
        student={rejectingStudent}
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectingStudent(null);
        }}
        onReject={(id, reason) => handleRejectStudent(id, reason)}
      />

      {/* Modal de exclusão de membro */}
      <StudentDeleteModal
        student={deletingStudent}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingStudent(null);
        }}
        onDelete={(id) => handleDeleteStudent(id)}
      />

      {/* Modal de convite */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Novo Convite</h3>
            
            <form onSubmit={handleCreateInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={inviteForm.fullName}
                    onChange={handleInviteFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o nome completo"
                    required
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={inviteForm.email}
                    onChange={handleInviteFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o email"
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Unidade *
                  </label>
                  <select
                    name="unit"
                    value={inviteForm.unit}
                    onChange={handleInviteFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {temples.map((temple) => (
                      <option key={temple.id} value={temple.abbreviation}>
                        {temple.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Turma (opcional)
                  </label>
                  <input
                    type="text"
                    name="turma"
                    value={inviteForm.turma}
                    onChange={handleInviteFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a turma"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInvites;
