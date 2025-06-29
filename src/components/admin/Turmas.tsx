import React, { useState } from 'react';
import { Plus, Search, Filter, Users, Calendar, DollarSign, Clock, BookOpen, Edit3, Trash2, Eye, CheckCircle, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Turma, Aula, TurmaStatus } from '../../types';
import { generateId } from '../../utils/helpers';
import Modal from '../common/Modal';

const Turmas: React.FC = () => {
  const { students, temples, turmas, addTurma, updateTurma, deleteTurma, addAula, updateAula } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState<'all' | string>('all');
  const [filterStatus, setFilterStatus] = useState<TurmaStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [showAulaModal, setShowAulaModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Turma>>({
    unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
    numero: 1,
    valor: 0,
    dataInicio: '',
    hora: '',
    duracaoMeses: 6,
    status: 'planejada',
    alunos: [],
    aulas: []
  });

  const [aulaForm, setAulaForm] = useState({
    data: '',
    conteudo: ''
  });

  // Get temple options
  const templeOptions = temples.map(temple => ({
    value: temple.abbreviation,
    label: `Templo ${temple.abbreviation} - ${temple.city}`
  }));

  const fallbackTemples = [
    { value: 'SP', label: 'Templo SP - São Paulo' },
    { value: 'BH', label: 'Templo BH - Belo Horizonte' },
    { value: 'CP', label: 'Templo CP - Campinas' }
  ];

  const allTempleOptions = templeOptions.length > 0 ? templeOptions : fallbackTemples;

  // Filter turmas
  const filteredTurmas = turmas.filter(turma => {
    const matchesSearch = `Turma ${turma.numero}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = filterUnit === 'all' || turma.unit === filterUnit;
    const matchesStatus = filterStatus === 'all' || turma.status === filterStatus;
    return matchesSearch && matchesUnit && matchesStatus;
  });

  // Calculate turma statistics
  const getTurmaStats = (turma: Turma) => {
    const alunosAtivos = turma.alunos.filter(alunoId => {
      const student = students.find(s => s.id === alunoId);
      return student && student.isActive;
    }).length;

    const receitaGerada = alunosAtivos * turma.valor;
    const aulasRealizadas = turma.aulas.filter(aula => aula.realizada).length;
    const totalAulas = turma.aulas.length;
    const progressoPercentual = totalAulas > 0 ? (aulasRealizadas / totalAulas) * 100 : 0;

    return {
      totalAlunos: turma.alunos.length,
      alunosAtivos,
      receitaGerada,
      aulasRealizadas,
      totalAulas,
      progressoPercentual
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em-andamento':
        return 'text-green-400 bg-green-400/10';
      case 'encerrada':
        return 'text-gray-400 bg-gray-400/10';
      case 'planejada':
        return 'text-blue-400 bg-blue-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em-andamento':
        return 'Em Andamento';
      case 'encerrada':
        return 'Encerrada';
      case 'planejada':
        return 'Planejada';
      default:
        return 'Desconhecido';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.unit) {
      newErrors.unit = 'Unidade é obrigatória';
    }

    if (!formData.numero || formData.numero < 1) {
      newErrors.numero = 'Número da turma deve ser maior que 0';
    }

    if (!formData.valor || formData.valor < 0) {
      newErrors.valor = 'Valor deve ser maior ou igual a 0';
    }

    if (!formData.dataInicio) {
      newErrors.dataInicio = 'Data de início é obrigatória';
    }

    if (!formData.hora) {
      newErrors.hora = 'Horário é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const turmaData: Turma = {
        id: formData.id || generateId(),
        unit: formData.unit!,
        numero: formData.numero!,
        valor: formData.valor!,
        dataInicio: formData.dataInicio!,
        hora: formData.hora!,
        duracaoMeses: formData.duracaoMeses || 6,
        status: formData.status || 'planejada',
        alunos: formData.alunos || [],
        aulas: formData.aulas || [],
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (formData.id) {
        // Update existing turma
        await updateTurma(formData.id, turmaData);
        alert('Turma atualizada com sucesso!');
      } else {
        // Create new turma
        await addTurma(turmaData);
        
        // Generate weekly aulas for the duration
        await generateTurmaAulas(turmaData);
        
        alert('Turma criada com sucesso!');
        setShowAddModal(false);
      }

      // Reset form
      setFormData({
        unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
        numero: 1,
        valor: 0,
        dataInicio: '',
        hora: '',
        duracaoMeses: 6,
        status: 'planejada',
        alunos: [],
        aulas: []
      });
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error('Error saving turma:', error);
      alert('Erro ao salvar turma. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate weekly aulas for turma
  const generateTurmaAulas = async (turma: Turma) => {
    const startDate = new Date(turma.dataInicio);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + turma.duracaoMeses);

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const aula: Aula = {
        id: generateId(),
        turmaId: turma.id,
        data: currentDate.toISOString().split('T')[0],
        conteudo: '',
        realizada: false,
        createdAt: new Date().toISOString()
      };

      try {
        await addAula(aula);
      } catch (error) {
        console.error('Error creating aula:', error);
      }

      // Move to next week (same day of week)
      currentDate.setDate(currentDate.getDate() + 7);
    }
  };

  // Handle delete turma
  const handleDelete = async (turma: Turma) => {
    if (confirm('Tem certeza que deseja excluir esta turma?')) {
      try {
        await deleteTurma(turma.id);
        setSelectedTurma(null);
        alert('Turma excluída com sucesso!');
      } catch (error) {
        console.error('Error deleting turma:', error);
        alert('Erro ao excluir turma. Tente novamente.');
      }
    }
  };

  // Handle add aula
  const handleAddAula = async () => {
    if (!selectedTurma || !aulaForm.data) return;

    try {
      const newAula: Aula = {
        id: generateId(),
        turmaId: selectedTurma.id,
        data: aulaForm.data,
        conteudo: aulaForm.conteudo,
        realizada: false,
        createdAt: new Date().toISOString()
      };

      await addAula(newAula);

      setSelectedTurma(prev => prev ? { ...prev, aulas: [...prev.aulas, newAula] } : null);
      setAulaForm({ data: '', conteudo: '' });
      setShowAulaModal(false);
      alert('Aula adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding aula:', error);
      alert('Erro ao adicionar aula. Tente novamente.');
    }
  };

  // Toggle aula realizada
  const toggleAulaRealizada = async (aulaId: string) => {
    if (!selectedTurma) return;

    try {
      const aula = selectedTurma.aulas.find(a => a.id === aulaId);
      if (!aula) return;

      const updatedAula = { ...aula, realizada: !aula.realizada };
      await updateAula(aulaId, updatedAula);

      setSelectedTurma(prev => prev ? {
        ...prev,
        aulas: prev.aulas.map(a => 
          a.id === aulaId ? updatedAula : a
        )
      } : null);
    } catch (error) {
      console.error('Error updating aula:', error);
      alert('Erro ao atualizar aula. Tente novamente.');
    }
  };

  // Get available dates for new aula (based on turma schedule) - FIXED
  const getAvailableDates = (turma: Turma) => {
    if (!turma.dataInicio) return [];
    
    const startDate = new Date(turma.dataInicio);
    const today = new Date();
    const dates: string[] = [];
    
    // Get the day of the week from the start date
    const dayOfWeek = startDate.getDay();
    
    // Start from today or the start date, whichever is later
    let currentDate = new Date(Math.max(startDate.getTime(), today.getTime()));
    
    // Adjust to the next occurrence of the same day of week
    const daysUntilTarget = (dayOfWeek - currentDate.getDay() + 7) % 7;
    if (daysUntilTarget > 0) {
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);
    }
    
    // Generate next 20 weeks of possible dates
    for (let i = 0; i < 20; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if this date doesn't already have an aula
      const hasAula = turma.aulas.some(aula => aula.data === dateStr);
      
      if (!hasAula) {
        dates.push(dateStr);
      }
      
      // Move to next week (same day of week)
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return dates;
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Turmas</h1>
          <p className="text-gray-400">Gerencie as turmas e aulas do sistema</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Turma</span>
        </button>
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
                placeholder="Buscar turmas..."
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
              onChange={(e) => setFilterUnit(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos os Templos</option>
              {allTempleOptions.map(temple => (
                <option key={temple.value} value={temple.value}>
                  {temple.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TurmaStatus)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos os Status</option>
              <option value="planejada">Planejada</option>
              <option value="em-andamento">Em Andamento</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Turmas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTurmas.map(turma => {
          const stats = getTurmaStats(turma);
          const temple = temples.find(t => t.abbreviation === turma.unit);
          
          return (
            <div key={turma.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-red-600 transition-colors">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Turma {turma.numero}</h3>
                  <p className="text-gray-400 text-sm">
                    {temple ? `${temple.name} (${temple.city})` : `Templo ${turma.unit}`}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(turma.status)}`}>
                  {getStatusLabel(turma.status)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-400">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{stats.alunosAtivos}</span>
                  </div>
                  <p className="text-xs text-gray-400">Alunos Ativos</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-green-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">R$ {stats.receitaGerada}</span>
                  </div>
                  <p className="text-xs text-gray-400">Receita</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-purple-400">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-semibold">{stats.aulasRealizadas}/{stats.totalAulas}</span>
                  </div>
                  <p className="text-xs text-gray-400">Aulas</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{turma.hora}</span>
                  </div>
                  <p className="text-xs text-gray-400">Horário</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Progresso</span>
                  <span className="text-gray-400">{Math.round(stats.progressoPercentual)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.progressoPercentual}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedTurma(turma)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Ver Detalhes
                </button>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setFormData(turma);
                      setIsEditing(true);
                    }}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(turma)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTurmas.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {searchTerm || filterUnit !== 'all' || filterStatus !== 'all' 
              ? 'Nenhuma turma encontrada' 
              : 'Nenhuma turma cadastrada'
            }
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterUnit !== 'all' || filterStatus !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Clique em "Nova Turma" para criar a primeira turma'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Turma Modal */}
      <Modal
        isOpen={showAddModal || isEditing}
        onClose={() => {
          setShowAddModal(false);
          setIsEditing(false);
          setFormData({
            unit: temples.length > 0 ? temples[0].abbreviation : 'SP',
            numero: 1,
            valor: 0,
            dataInicio: '',
            hora: '',
            duracaoMeses: 6,
            status: 'planejada',
            alunos: [],
            aulas: []
          });
          setErrors({});
        }}
        title={isEditing ? 'Editar Turma' : 'Nova Turma'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Templo *
              </label>
              <select
                value={formData.unit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                {allTempleOptions.map(temple => (
                  <option key={temple.value} value={temple.value}>
                    {temple.label}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="text-red-400 text-sm mt-1">{errors.unit}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número da Turma *
              </label>
              <input
                type="number"
                min="1"
                value={formData.numero || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
              {errors.numero && <p className="text-red-400 text-sm mt-1">{errors.numero}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.valor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
              {errors.valor && <p className="text-red-400 text-sm mt-1">{errors.valor}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.dataInicio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
              {errors.dataInicio && <p className="text-red-400 text-sm mt-1">{errors.dataInicio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Horário *
              </label>
              <input
                type="time"
                value={formData.hora || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hora: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
              {errors.hora && <p className="text-red-400 text-sm mt-1">{errors.hora}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duração (meses)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.duracaoMeses || 6}
                onChange={(e) => setFormData(prev => ({ ...prev, duracaoMeses: parseInt(e.target.value) || 6 }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 px-4 py-2 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Turma Details Modal */}
      {selectedTurma && !isEditing && (
        <Modal
          isOpen={!!selectedTurma}
          onClose={() => setSelectedTurma(null)}
          title={`Turma ${selectedTurma.numero} - ${temples.find(t => t.abbreviation === selectedTurma.unit)?.name || `Templo ${selectedTurma.unit}`}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Turma Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Alunos</span>
                </div>
                <p className="text-2xl font-bold text-white">{getTurmaStats(selectedTurma).alunosAtivos}</p>
                <p className="text-xs text-gray-400">ativos de {selectedTurma.alunos.length} total</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Receita</span>
                </div>
                <p className="text-2xl font-bold text-white">R$ {getTurmaStats(selectedTurma).receitaGerada}</p>
                <p className="text-xs text-gray-400">mensal</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Progresso</span>
                </div>
                <p className="text-2xl font-bold text-white">{Math.round(getTurmaStats(selectedTurma).progressoPercentual)}%</p>
                <p className="text-xs text-gray-400">{getTurmaStats(selectedTurma).aulasRealizadas} de {getTurmaStats(selectedTurma).totalAulas} aulas</p>
              </div>
            </div>

            {/* Add Aula Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Aulas</h3>
              <button
                onClick={() => setShowAulaModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Aula</span>
              </button>
            </div>

            {/* Aulas List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedTurma.aulas.length > 0 ? (
                selectedTurma.aulas
                  .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                  .map(aula => (
                    <div key={aula.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleAulaRealizada(aula.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                aula.realizada 
                                  ? 'bg-green-600 border-green-600' 
                                  : 'border-gray-600 hover:border-green-600'
                              }`}
                            >
                              {aula.realizada && <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                            <div>
                              <h4 className={`font-medium ${aula.realizada ? 'text-green-400' : 'text-white'}`}>
                                {new Date(aula.data).toLocaleDateString('pt-BR')}
                              </h4>
                              {aula.conteudo && (
                                <p className="text-sm text-gray-400">{aula.conteudo}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          aula.realizada 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {aula.realizada ? 'Realizada' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    Nenhuma aula cadastrada
                  </h3>
                  <p className="text-gray-500">
                    Clique em "Adicionar Aula" para criar a primeira aula
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Aula Modal - FIXED */}
      <Modal
        isOpen={showAulaModal}
        onClose={() => {
          setShowAulaModal(false);
          setAulaForm({ data: '', conteudo: '' });
        }}
        title="Adicionar Aula"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data da Aula *
            </label>
            {selectedTurma ? (
              <>
                <select
                  value={aulaForm.data}
                  onChange={(e) => setAulaForm(prev => ({ ...prev, data: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                >
                  <option value="">Selecione uma data</option>
                  {getAvailableDates(selectedTurma).map(date => (
                    <option key={date} value={date}>
                      {formatDateForDisplay(date)}
                    </option>
                  ))}
                </select>
                
                {getAvailableDates(selectedTurma).length === 0 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    Todas as datas disponíveis já possuem aulas cadastradas.
                  </p>
                )}
                
                <p className="text-gray-400 text-xs mt-2">
                  Baseado no cronograma semanal da turma (toda {
                    ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][
                      new Date(selectedTurma.dataInicio).getDay()
                    ]
                  } às {selectedTurma.hora})
                </p>
              </>
            ) : (
              <p className="text-red-400 text-sm">Erro: Turma não selecionada</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conteúdo da Aula
            </label>
            <textarea
              value={aulaForm.conteudo}
              onChange={(e) => setAulaForm(prev => ({ ...prev, conteudo: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              placeholder="Breve descrição do que será ensinado nesta aula..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAulaModal(false);
                setAulaForm({ data: '', conteudo: '' });
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddAula}
              disabled={!aulaForm.data}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Turmas;