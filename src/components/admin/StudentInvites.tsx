import React, { useState, useEffect } from 'react';
import { Mail, Send, Copy, Check, Plus, Search, Link, ChevronLeft, ChevronRight, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { InviteData, Student } from '../../types';
import { generateId, validateEmail, generateTempPassword } from '../../utils/helpers';
import { sendInviteEmail } from '../../services/emailServiceFrontend';
import { toast } from 'react-toastify';
import Modal from '../common/Modal';

interface StudentInvitesProps {
  onNavigateToAddStudent?: () => void;
}

const StudentInvites: React.FC<StudentInvitesProps> = ({ onNavigateToAddStudent }) => {
  const { students: initialStudents, temples, addStudent, deleteStudent } = useData();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
  const [filterUnit, setFilterUnit] = useState<'all' | string>('all');
  const [isSending, setIsSending] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Variáveis de estado para as funcionalidades solicitadas
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Convite para o Nosso Templo',
    body: 'Olá {nome},\n\nVocê foi convidado para participar do Nosso Templo.\n\nClique no link abaixo para aceitar o convite:\n{link}\n\nAtenciosamente,\nEquipe Nosso Templo'
  });
  const [showSendEmailsModal, setShowSendEmailsModal] = useState(false);

  const [inviteForm, setInviteForm] = useState<InviteData>({
    fullName: '',
    email: '',
    unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
    turma: '',
    invitedBy: 'Administrador'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  // Estado para controlar menu de ações aberto
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        setActionMenuOpenId(null);
      }
    };
    if (actionMenuOpenId) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [actionMenuOpenId]);

  // Update local state when initialStudents changes
  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Get students with invite information
  const invitedStudents = students.filter(student => 
    student.inviteStatus || student.isPendingApproval
  );

  // Filter invited students
  const filteredInvites = invitedStudents.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || student.inviteStatus === filterStatus;
    const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
    
    return matchesSearch && matchesStatus && matchesUnit;
  });

  // Paginação dos estudantes filtrados
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedStudents = filteredInvites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvites.length / itemsPerPage);

  // Funções para seleção de estudantes
  const handleSelectAll = (students: Student[]) => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      const newSelected = new Set<string>();
      students.forEach(student => {
        if (student.id) {
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
  
  // Funções para paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedStudents(new Set()); // Limpa seleções ao mudar de página
  };
  
  // Funções para ações em massa
  const handleBulkApprove = () => {
    if (selectedStudents.size === 0) return;
    
    if (confirm(`Deseja aprovar ${selectedStudents.size} membros selecionados?`)) {
      // Implementar a lógica de aprovação em massa
      selectedStudents.forEach(id => {
        handleApproveStudent(id);
      });
      setSelectedStudents(new Set());
    }
  };
  
  const handleBulkReject = () => {
    if (selectedStudents.size === 0) return;
    
    if (confirm(`Deseja rejeitar ${selectedStudents.size} membros selecionados?`)) {
      // Implementar a lógica de rejeição em massa
      selectedStudents.forEach(id => {
        handleRejectStudent(id);
      });
      setSelectedStudents(new Set());
    }
  };
  
  const handleBulkSendEmails = () => {
    if (selectedStudents.size === 0) return;
    setShowSendEmailsModal(true);
  };
  
  const handleSendBulkEmails = async () => {
    if (selectedStudents.size === 0) return;
    
    setIsSending(true);
    
    try {
      // Obter os estudantes selecionados
      const selectedStudentsList = students.filter(student => selectedStudents.has(student.id));
      let successCount = 0;
      let failCount = 0;
      
      // Enviar emails para cada estudante selecionado
      for (const student of selectedStudentsList) {
        const inviteUrl = `${window.location.origin}/convite/${student.inviteToken}`;
        
        try {
          // Usar a senha temporária existente ou gerar uma nova se não existir
          const tempPassword = student.tempPassword || generateTempPassword();
          await sendInviteEmail(student.email, inviteUrl, student.fullName, tempPassword);
          successCount++;
        } catch (error) {
          console.error(`Erro ao enviar email para ${student.email}:`, error);
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} email(s) enviado(s) com sucesso`);
      }
      
      if (failCount > 0) {
        toast.warning(`${failCount} email(s) não puderam ser enviados, mas foram simulados no console`);
      }
      
      setShowSendEmailsModal(false);
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Erro ao enviar emails em massa:', error);
      toast.error('Ocorreu um erro ao enviar os emails');
    } finally {
      setIsSending(false);
    }
  };

  const validateInviteForm = () => {
    const newErrors: Record<string, string> = {};

    if (!inviteForm.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!inviteForm.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(inviteForm.email)) {
      newErrors.email = 'Email inválido';
    } else {
      // Check for duplicate email
      const existingStudent = students.find(s => 
        s.email.toLowerCase() === inviteForm.email.toLowerCase()
      );
      if (existingStudent) {
        newErrors.email = 'Já existe um membro com este email';
      }
    }

    if (!inviteForm.unit) {
      newErrors.unit = 'Templo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateInviteToken = () => {
    // Gera um UUID v4 válido
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleGenerateLink = async () => {
    if (!validateInviteForm()) return;

    setIsSending(true);

    try {
      const inviteToken = generateInviteToken();
      const inviteUrl = `${window.location.origin}/convite/${inviteToken}`;
      const tempPassword = generateTempPassword();

      const newStudent: Student = {
        id: generateId(),
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        unit: inviteForm.unit,
        turma: inviteForm.turma,
        birthDate: '1900-01-01', // Placeholder date for invites
        cpf: '',
        rg: '',
        phone: '',
        religion: '',
        isFounder: false,
        isActive: false, // Will be activated after approval
        attendance: [],
        isAdmin: false,
        isGuest: false,
        role: 'student',
        inviteStatus: 'accepted',
        inviteToken,
        invitedAt: new Date().toISOString(),
        invitedBy: inviteForm.invitedBy,
        isPendingApproval: false,
        tempPassword: tempPassword
      };

      await addStudent(newStudent);

      // Set the generated link for display
      setGeneratedLink(inviteUrl);
      setShowLinkModal(true);

      // Reset form
      setInviteForm({
        fullName: '',
        email: '',
        unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
        turma: '',
        invitedBy: 'Administrador'
      });
      setErrors({});
      setShowInviteModal(false);

    } catch (error: any) {
      console.error('Error generating invite link:', error);
      toast.error('Erro ao gerar link de convite. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendInvite = async () => {
    if (!validateInviteForm()) return;

    setIsSending(true);

    try {
      const inviteToken = generateInviteToken();
      const inviteUrl = `${window.location.origin}/convite/${inviteToken}`;
      const tempPassword = generateTempPassword();

      const newStudent: Student = {
        id: generateId(),
        fullName: inviteForm.fullName,
        email: inviteForm.email,
        unit: inviteForm.unit,
        turma: inviteForm.turma,
        birthDate: '1900-01-01', // Placeholder date for invites
        cpf: '',
        rg: '',
        phone: '',
        religion: '',
        isFounder: false,
        isActive: false, // Will be activated after approval
        attendance: [],
        isAdmin: false,
        isGuest: false,
        role: 'student',
        inviteStatus: 'pending',
        inviteToken,
        invitedAt: new Date().toISOString(),
        invitedBy: inviteForm.invitedBy,
        isPendingApproval: false,
        tempPassword: tempPassword
      };

      await addStudent(newStudent);
      
      // Enviar email com a senha temporária
      await sendInviteEmail(inviteForm.email, inviteUrl, inviteForm.fullName, tempPassword);
      
      // Reset form
      setInviteForm({
        fullName: '',
        email: '',
        unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
        turma: '',
        invitedBy: 'Administrador'
      });
      setErrors({});
      setShowInviteModal(false);

    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error('Erro ao enviar convite. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyGeneratedLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopiedToken('generated');
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const handleApproveStudent = (studentId: string) => {
    // Find the student
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    // Update student status
    const updatedStudentData = {
      ...student,
      isPendingApproval: false,
      isActive: true
    };
    
    // Here you would call an API to update the student with updatedStudentData
    console.log('Dados atualizados:', updatedStudentData);
    
    // For now, we'll just show an alert
    alert(`Membro ${student.fullName} aprovado com sucesso!`);
  };

  const handleRejectStudent = async (id: string) => {
    try {
      // Update student to rejected status
      const student = students.find(s => s.id === id);
      if (!student) return;

      const updatedStudentData = {
        ...student,
        isPendingApproval: false,
        isActive: false,
        inviteStatus: 'rejected' as const
      };

      // In a real app, you would call updateStudent with updatedStudentData
      console.log('Dados do membro rejeitado:', updatedStudentData);
      
      alert(`Membro ${student.fullName} rejeitado com sucesso!`);
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('Erro ao rejeitar membro. Tente novamente.');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'accepted':
        return 'text-green-400 bg-green-400/10';
      case 'expired':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'expired':
        return 'Expirado';
      default:
        return 'Desconhecido';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Membros</h1>
          <p className="text-gray-400">
            Envie convites para novos membros e aprove cadastros pendentes
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Convite</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToAddStudent}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Membro</span>
          </button>
          {/* Banner de notificações removido conforme solicitado */}
        </div>
      </div>

      {/* Filters */}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="accepted">Aceito</option>
              <option value="expired">Expirado</option>
            </select>

            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos os Templos</option>
              {temples.map(temple => (
                <option key={temple.id} value={temple.abbreviation}>
                  Templo {temple.abbreviation} - {temple.city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Seção de aprovações pendentes removida conforme solicitado */}

      {/* Invites List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Mail className="w-6 h-6 text-red-400" />
            <span>Convites Enviados ({filteredInvites.length})</span>
          </h2>
          
          {/* Botões de ação em massa */}
          {selectedStudents.size > 0 && (
            <div className="flex items-center space-x-3">
              
              
              <button
                onClick={handleBulkSendEmails}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar E-mails ({selectedStudents.size})</span>
              </button>
            </div>
          )}
        </div>
        
        {filteredInvites.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 border-b border-gray-700">
                  <th className="p-3 text-left">
                    <div className="flex items-center">
                      <button 
                        onClick={() => handleSelectAll(paginatedStudents)}
                        className="mr-3 text-gray-400 hover:text-white"
                      >
                        {selectedStudents.size === paginatedStudents.length ? 
                          <CheckSquare className="w-5 h-5" /> : 
                          <Square className="w-5 h-5" />
                        }
                      </button>
                      <span>Nome</span>
                    </div>
                  </th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Templo</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map(student => (
                  <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <button 
                          onClick={() => handleSelectStudent(student.id!)}
                          className="mr-3 text-gray-400 hover:text-white"
                        >
                          {selectedStudents.has(student.id!) ? 
                            <CheckSquare className="w-5 h-5" /> : 
                            <Square className="w-5 h-5" />
                          }
                        </button>
                        <span className="font-medium text-white">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">{student.email}</td>
                    <td className="p-3 text-gray-400">{student.unit} {student.turma && `• ${student.turma}`}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.inviteStatus)}`}>
                        {getStatusLabel(student.inviteStatus)}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{formatDate(student.invitedAt)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end space-x-2">
                        {student.inviteStatus === 'pending' && student.inviteToken && (
                          <button
                            onClick={() => handleCopyInviteLink(student.inviteToken!)}
                            className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors"
                            title="Copiar Link"
                          >
                            {copiedToken === student.inviteToken ? 
                              <Check className="w-4 h-4" /> : 
                              <Copy className="w-4 h-4" />
                            }
                          </button>
                        )}
                        
                        {/* Botão de menu de ações */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpenId(actionMenuOpenId === student.id ? null : student.id!);
                            }}
                            className="p-1.5 bg-gray-700/30 text-gray-400 hover:bg-gray-600/50 rounded-lg transition-colors"
                            title="Ações"
                          >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="6" r="1" fill="currentColor"/>
                              <circle cx="12" cy="12" r="1" fill="currentColor"/>
                              <circle cx="12" cy="18" r="1" fill="currentColor"/>
                            </svg>
                          </button>
                          
                          {actionMenuOpenId === student.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuOpenId(null);
                                  alert('Editar membro');
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActionMenuOpenId(null);
                                  if (confirm(`Tem certeza que deseja apagar o membro ${student.fullName}?`)) {
                                    try {
                                      await deleteStudent(student.id!);
                                      toast.success('Membro apagado com sucesso');
                                      // Atualiza a lista de estudantes após a exclusão
                                      const updatedStudents = students.filter(s => s.id !== student.id);
                                      setStudents(updatedStudents);
                                    } catch (error) {
                                      console.error('Erro ao apagar membro:', error);
                                      toast.error('Erro ao apagar membro');
                                    }
                                  }
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Apagar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuOpenId(null);
                                  alert('Enviando e-mail para ' + student.email);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-blue-400 hover:bg-gray-800"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Enviar E-mail
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-400">
                  Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredInvites.length)} de {filteredInvites.length}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Lógica para mostrar as páginas corretas quando há muitas páginas
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg ${currentPage === pageNum ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">
              {searchTerm || filterStatus !== 'all' || filterUnit !== 'all'
                ? 'Nenhum convite encontrado com os filtros atuais.'
                : 'Clique em "Enviar Convite" para convidar novos membros.'}
            </p>
          </div>
        )}
      </div>

      {/* Send Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setErrors({});
        }}
        title="Enviar Convite para Novo Membro"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder="Nome completo do novo membro"
              />
              {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Templo *
              </label>
              <select
                value={inviteForm.unit}
                onChange={(e) => setInviteForm(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                {temples.map(temple => (
                  <option key={temple.id} value={temple.abbreviation}>
                    Templo {temple.abbreviation} - {temple.city}
                  </option>
                ))}
                {temples.length === 0 && (
                  <>
                    <option value="SP">Templo SP - São Paulo</option>
                    <option value="BH">Templo BH - Belo Horizonte</option>
                    <option value="CP">Templo CP - Campinas</option>
                  </>
                )}
              </select>
              {errors.unit && <p className="text-red-400 text-sm mt-1">{errors.unit}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Turma/Grupo
              </label>
              <input
                type="text"
                value={inviteForm.turma}
                onChange={(e) => setInviteForm(prev => ({ ...prev, turma: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder="Ex: Turma A, Iniciantes, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enviado por
              </label>
              <input
                type="text"
                value={inviteForm.invitedBy}
                onChange={(e) => setInviteForm(prev => ({ ...prev, invitedBy: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder="Seu nome ou identificação"
              />
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">
                  Como funciona o convite
                </p>
                <ul className="text-blue-300 text-xs space-y-1">
                  <li>• Um link único será gerado para o novo membro</li>
                  <li>• O link expira em 7 dias após o envio</li>
                  <li>• O membro preencherá seus dados pessoais</li>
                  <li>• Após completar o cadastro, você receberá uma notificação para aprovação</li>
                  <li>• Somente após sua aprovação o membro terá acesso ao sistema</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowInviteModal(false);
                setErrors({});
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={handleGenerateLink}
              disabled={isSending}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 px-4 py-2 rounded-lg transition-colors"
            >
              <Link className="w-4 h-4" />
              <span>{isSending ? 'Gerando...' : 'Gerar Link'}</span>
            </button>
            
            <button
              type="button"
              onClick={handleSendInvite}
              disabled={isSending}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 px-4 py-2 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Enviando...' : 'Enviar Convite'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para envio de e-mails em massa */}
      <Modal
        isOpen={showSendEmailsModal}
        onClose={() => setShowSendEmailsModal(false)}
        title={`Enviar E-mails para ${selectedStudents.size} Membros`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Assunto
              </label>
              <input
                type="text"
                value={emailTemplate.subject}
                onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Corpo do E-mail
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Use {'{nome}'} para inserir o nome do membro e {'{link}'} para inserir o link de convite.
              </p>
              <textarea
                value={emailTemplate.body}
                onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                rows={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSendEmailsModal(false)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSendBulkEmails}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Enviar E-mails</span>
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Generated Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setGeneratedLink(null);
        }}
        title="Link de Convite Gerado"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Check className="w-5 h-5 text-green-400" />
              <h4 className="font-medium text-green-400">Convite criado com sucesso!</h4>
            </div>
            <p className="text-green-300 text-sm">
              O email foi enviado e você pode copiar o mesmo link que foi enviado.
            </p>
          </div>

          {generatedLink && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Link do Convite:
              </label>
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <code className="text-sm text-gray-300 break-all block">{generatedLink}</code>
              </div>
              <button
                onClick={handleCopyGeneratedLink}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                {copiedToken === 'generated' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">
                  Próximos passos
                </p>
                <ul className="text-blue-300 text-xs space-y-1">
                  <li>• O link foi enviado por email para o novo membro</li>
                  <li>• Você pode compartilhar o link copiado se necessário</li>
                  <li>• O link expira em 7 dias</li>
                  <li>• Quando o membro completar o cadastro, você será notificado para aprovação</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowLinkModal(false);
                setGeneratedLink(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentInvites;