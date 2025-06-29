import React, { useState, useEffect } from 'react';
import { Save, X, Calendar, Clock, MapPin, Users, Repeat, AlertTriangle, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Event } from '../../types';
import { generateId } from '../../utils/helpers';
import { EVENT_TYPES } from '../../utils/constants';

interface CreateEventProps {
  onNavigateBack?: () => void;
  editingEvent?: Event | null;
  onEventSaved?: () => void;
}

const CreateEvent: React.FC<CreateEventProps> = ({ 
  onNavigateBack, 
  editingEvent, 
  onEventSaved 
}) => {
  const { addEvent, updateEvent, deleteEvent, temples } = useData();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOutsideTemple, setIsOutsideTemple] = useState(false);

  // Visibility levels
  const visibilityLevels = [
    { id: 'alunos', label: 'Alunos' },
    { id: 'iniciados', label: 'Iniciados' },
    { id: 'mestres', label: 'Mestres' },
    { id: 'diretores', label: 'Diretores' },
    { id: 'fundadores', label: 'Fundadores' },
    { id: 'todos', label: 'Todos' }
  ];

  // Repetition options
  const repetitionOptions = [
    { value: 'none', label: 'Não repetir' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'biweekly', label: 'Quinzenalmente' },
    { value: 'monthly', label: 'Mensalmente' },
    { value: 'yearly', label: 'Anualmente' }
  ];

  // Get default temple - prefer temples from database, fallback to SP
  const getDefaultTemple = () => {
    if (temples.length > 0) {
      return temples[0].abbreviation;
    }
    return 'SP';
  };

  const [formData, setFormData] = useState({
    title: '',
    type: 'workshop' as keyof typeof EVENT_TYPES,
    date: '',
    time: '',
    description: '',
    location: '',
    unit: getDefaultTemple(),
    visibility: ['todos'] as string[],
    repetition: 'none',
    repeatUntil: '',
    color: EVENT_TYPES.workshop.color
  });

  // Update default temple when temples load
  useEffect(() => {
    if (temples.length > 0 && !editingEvent) {
      setFormData(prev => ({
        ...prev,
        unit: temples[0].abbreviation
      }));
    }
  }, [temples, editingEvent]);

  // Load editing event data
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        type: (editingEvent.type as keyof typeof EVENT_TYPES) || 'workshop',
        date: editingEvent.date,
        time: editingEvent.time,
        description: editingEvent.description || '',
        location: editingEvent.location,
        unit: editingEvent.unit,
        visibility: editingEvent.visibility || ['todos'],
        repetition: editingEvent.repetition || 'none',
        repeatUntil: editingEvent.repeatUntil || '',
        color: editingEvent.color || EVENT_TYPES.workshop.color
      });
      
      // Check if location indicates it's outside temple
      setIsOutsideTemple(!!editingEvent.location && editingEvent.location !== '' && editingEvent.location !== 'Templo');
    }
  }, [editingEvent]);

  // Update color when type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      color: EVENT_TYPES[prev.type].color
    }));
  }, [formData.type]);

  // Auto-fill title when type changes and title is empty or matches a category
  useEffect(() => {
    if (!formData.title || Object.values(EVENT_TYPES).some(type => type.label === formData.title)) {
      setFormData(prev => ({
        ...prev,
        title: EVENT_TYPES[prev.type].label
      }));
    }
  }, [formData.type]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Nome do evento é obrigatório';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!formData.time) {
      newErrors.time = 'Horário é obrigatório';
    }

    if (!formData.unit) {
      newErrors.unit = 'Templo é obrigatório';
    }

    if (formData.visibility.length === 0) {
      newErrors.visibility = 'Selecione pelo menos um nível de visibilidade';
    }

    if (formData.repetition !== 'none' && formData.repeatUntil) {
      const eventDate = new Date(formData.date);
      const repeatUntilDate = new Date(formData.repeatUntil);
      
      if (repeatUntilDate <= eventDate) {
        newErrors.repeatUntil = 'Data final deve ser posterior à data do evento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRepeatingEvents = (baseEvent: Event): Event[] => {
    if (formData.repetition === 'none') {
      return [baseEvent];
    }

    const events: Event[] = [baseEvent];
    const startDate = new Date(formData.date);
    const endDate = formData.repeatUntil ? new Date(formData.repeatUntil) : null;
    
    // For indefinite repetition, only generate events for the current month
    let currentDate = new Date(startDate);
    let count = 0;
    const maxEvents = endDate ? 100 : 4; // Limit to 4 events for indefinite repetition

    while (count < maxEvents) {
      // Calculate next date based on repetition type
      switch (formData.repetition) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }

      // Check if we've reached the end date
      if (endDate && currentDate > endDate) {
        break;
      }

      // For indefinite repetition, only create events within the same month
      if (!endDate && currentDate.getMonth() !== startDate.getMonth()) {
        break;
      }

      // Create new event
      const newEvent: Event = {
        ...baseEvent,
        id: generateId(),
        date: currentDate.toISOString().split('T')[0],
        parentEventId: baseEvent.id
      };

      events.push(newEvent);
      count++;
    }

    return events;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      console.log('Submitting event with data:', formData);
      
      const baseEventData: Event = {
        id: editingEvent?.id || generateId(),
        title: formData.title,
        date: formData.date,
        time: formData.time,
        description: formData.description,
        location: isOutsideTemple ? formData.location : 'Templo',
        unit: formData.unit,
        attendees: editingEvent?.attendees || [],
        type: formData.type,
        color: formData.color,
        visibility: formData.visibility,
        repetition: formData.repetition,
        repeatUntil: formData.repeatUntil || undefined
      };

      console.log('Final event data:', baseEventData);

      if (editingEvent) {
        // Update existing event
        await updateEvent(editingEvent.id, baseEventData);
        alert('Evento atualizado com sucesso!');
      } else {
        // Create new event(s)
        const events = generateRepeatingEvents(baseEventData);
        
        console.log(`Creating ${events.length} events`);
        
        for (const event of events) {
          console.log('Creating event:', event);
          await addEvent(event);
        }
        
        if (events.length > 1) {
          if (formData.repeatUntil) {
            alert(`${events.length} eventos criados com sucesso!`);
          } else {
            alert(`${events.length} eventos criados para este mês. Eventos recorrentes aparecerão conforme você navega pelo calendário.`);
          }
        } else {
          alert('Evento criado com sucesso!');
        }
      }

      // Reset form
      setFormData({
        title: '',
        type: 'workshop',
        date: '',
        time: '',
        description: '',
        location: '',
        unit: getDefaultTemple(),
        visibility: ['todos'],
        repetition: 'none',
        repeatUntil: '',
        color: EVENT_TYPES.workshop.color
      });
      
      setIsOutsideTemple(false);
      setErrors({});
      
      if (onEventSaved) {
        onEventSaved();
      }
    } catch (error: any) {
      console.error('Error saving event:', error);
      
      // Handle specific error messages
      if (error.message?.includes('não é válida')) {
        alert(`Erro: ${error.message}`);
      } else {
        alert('Erro ao salvar evento. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await deleteEvent(editingEvent.id);
        alert('Evento excluído com sucesso!');
        if (onNavigateBack) {
          onNavigateBack();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Erro ao excluir evento. Tente novamente.');
      }
    }
  };

  const handleVisibilityChange = (levelId: string) => {
    setFormData(prev => {
      const newVisibility = prev.visibility.includes(levelId)
        ? prev.visibility.filter(id => id !== levelId)
        : [...prev.visibility, levelId];
      
      return { ...prev, visibility: newVisibility };
    });
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}
          </h1>
          <p className="text-gray-400">
            {editingEvent ? 'Modifique as informações do evento' : 'Cadastre um novo evento no sistema'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {editingEvent && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          )}
          
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-6">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Evento *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as keyof typeof EVENT_TYPES }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                {Object.entries(EVENT_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
              <div className="flex items-center space-x-2 mt-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-xs text-gray-400">Cor no calendário</span>
              </div>
            </div>

            {/* Temple/Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Templo *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                {temples.map(temple => (
                  <option key={temple.id} value={temple.abbreviation}>
                    Templo {temple.abbreviation} - {temple.city}
                  </option>
                ))}
                {/* Fallback options if no temples are loaded */}
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

            {/* Event Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Evento *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder="Digite o nome do evento ou deixe vazio para usar o nome da categoria"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Se deixar vazio, será usado o nome da categoria selecionada
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => document.getElementById('date-input')?.focus()}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                </button>
                <input
                  id="date-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>
              {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Horário *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>
              {errors.time && <p className="text-red-400 text-sm mt-1">{errors.time}</p>}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Local
              </label>
              
              {/* Outside Temple Checkbox */}
              <div className="mb-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOutsideTemple}
                    onChange={(e) => {
                      setIsOutsideTemple(e.target.checked);
                      if (!e.target.checked) {
                        setFormData(prev => ({ ...prev, location: '' }));
                      }
                    }}
                    className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                  />
                  <span className="text-gray-300">Fora do templo</span>
                </label>
              </div>

              {/* Location Input - only enabled if outside temple */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!isOutsideTemple}
                  className={`w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 ${
                    !isOutsideTemple ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder={isOutsideTemple ? "Ex: Centro de Convenções, Parque, etc." : "Será realizado no templo"}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isOutsideTemple 
                  ? "Especifique o local onde será realizado o evento" 
                  : "Marque 'Fora do templo' para especificar um local diferente"
                }
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 resize-none"
                placeholder="Descreva o evento, atividades, requisitos, etc."
              />
            </div>
          </div>
        </div>

        {/* Repetition Settings */}
        {!editingEvent && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-2 mb-6">
              <Repeat className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Configurações de Repetição</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Repetition Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Repetir
                </label>
                <select
                  value={formData.repetition}
                  onChange={(e) => setFormData(prev => ({ ...prev, repetition: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                >
                  {repetitionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repeat Until */}
              {formData.repetition !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Repetir até (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.repeatUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, repeatUntil: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                  {errors.repeatUntil && <p className="text-red-400 text-sm mt-1">{errors.repeatUntil}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Se não definir, repetirá apenas no mês atual
                  </p>
                </div>
              )}
            </div>

            {formData.repetition !== 'none' && (
              <div className="mt-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 text-sm font-medium mb-1">
                      Eventos Recorrentes
                    </p>
                    <p className="text-blue-300 text-xs">
                      {formData.repeatUntil 
                        ? 'Serão criados múltiplos eventos até a data especificada.'
                        : 'Para eventos indefinidos, serão criados apenas os eventos do mês atual. Novos eventos aparecerão conforme você navega pelo calendário.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visibility Settings */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Visibilidade</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Visível para: *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {visibilityLevels.map(level => (
                <label key={level.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visibility.includes(level.id)}
                    onChange={() => handleVisibilityChange(level.id)}
                    className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                  />
                  <span className="text-gray-300">{level.label}</span>
                </label>
              ))}
            </div>
            {errors.visibility && <p className="text-red-400 text-sm mt-2">{errors.visibility}</p>}
            <p className="text-xs text-gray-400 mt-2">
              Selecione quem poderá visualizar este evento no sistema
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 px-6 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Evento'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;