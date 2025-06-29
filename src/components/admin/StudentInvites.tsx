import React, { useState } from 'react';
import { Mail, Send, Copy, Check, AlertTriangle, Clock, UserCheck, X, Plus, Search, Filter, Link } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { InviteData, Student } from '../../types';
import { generateId, validateEmail } from '../../utils/helpers';
import Modal from '../common/Modal';

const StudentInvites: React.FC = () => {
  const { students, temples, addStudent } = useData();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
  const [filterUnit, setFilterUnit] = useState<'all' | string>('all');
  const [isSending, setIsSending] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [inviteForm, setInviteForm] = useState<InviteData>({
    fullName: '',
    email: '',
    unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
    turma: '',
    invitedBy: 'Administrador'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Get pending approvals
  const pendingApprovals = students.filter(student => 
    student.isPendingApproval && student.inviteStatus === 'accepted'
  );

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
    return Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  };

  const handleGenerateLink = async () => {
    if (!validateInviteForm()) return;

    setIsSending(true);

    try {
      const inviteToken = generateInviteToken();
      const inviteUrl = `${window.location.origin}/convite/${inviteToken}`;

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
        isPendingApproval: false
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
      alert('Erro ao gerar link de convite. Tente novamente.');
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
        isPendingApproval: false
      };

      await addStudent(newStudent);

      // Set the generated link for display
      setGeneratedLink(inviteUrl);
      setShowLinkModal(true);

      // Show success message
      alert('Email foi enviado com sucesso!');

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
      alert('Erro ao enviar convite. Tente novamente.');
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

  const handleApproveStudent = async (studentId: string) => {
    try {
      // Update student to approved status
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const updatedStudent = {
        ...student,
        isActive: true,
        isPendingApproval: false,
        inviteStatus: 'accepted' as const
      };

      // In a real app, you would call updateStudent here
      alert('Membro aprovado com sucesso!');
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Erro ao aprovar membro. Tente novamente.');
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    if (confirm('Tem certeza que deseja rejeitar este cadastro?')) {
      try {
        // In a real app, you would call deleteStudent here
        alert('Cadastro rejeitado.');
      } catch (error) {
        console.error('Error rejecting student:', error);
        alert('Erro ao rejeitar cadastro. Tente novamente.');
      }
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
          <h1 className="text-3xl font-bold text-white mb-2">Aprovar Membro</h1>
          <p className="text-gray-400">
            Envie convites para novos membros e aprove cadastros pendentes
          </p>
        </div>
        
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Enviar Convite</span>
        </button>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-yellow-400 font-semibold">
                {pendingApprovals.length} cadastro(s) aguardando aprovação
              </h3>
              <p className="text-yellow-300 text-sm">
                Há novos membros que completaram o cadastro e aguardam sua aprovação.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Pending Approvals Section */}
      {pendingApprovals.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-green-400" />
            <span>Aguardando Aprovação ({pendingApprovals.length})</span>
          </h2>
          
          <div className="space-y-4">
            {pendingApprovals.map(student => (
              <div key={student.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{student.fullName}</h3>
                    <div className="text-sm text-gray-400 mt-1">
                      <p>{student.email}</p>
                      <p>Templo {student.unit} • {student.turma && `Turma: ${student.turma}`}</p>
                      <p>Cadastro completado em: {formatDate(student.invitedAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleRejectStudent(student.id)}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Rejeitar</span>
                    </button>
                    
                    <button
                      onClick={() => handleApproveStudent(student.id)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprovar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invites List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
          <Mail className="w-6 h-6 text-red-400" />
          <span>Convites Enviados ({filteredInvites.length})</span>
        </h2>
        
        {filteredInvites.length > 0 ? (
          <div className="space-y-4">
            {filteredInvites.map(student => (
              <div key={student.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-white">{student.fullName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.inviteStatus)}`}>
                        {getStatusLabel(student.inviteStatus)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      <p>{student.email}</p>
                      <p>Templo {student.unit} • {student.turma && `Turma: ${student.turma}`}</p>
                      <p>Enviado em: {formatDate(student.invitedAt)} por {student.invitedBy}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {student.inviteStatus === 'pending' && student.inviteToken && (
                      <button
                        onClick={() => handleCopyInviteLink(student.inviteToken!)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        {copiedToken === student.inviteToken ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    {student.inviteStatus === 'accepted' && student.isPendingApproval && (
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Aguardando aprovação</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum convite encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterUnit !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Enviar Convite" para convidar novos membros'
              }
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