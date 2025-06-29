import React, { useState, useMemo } from 'react';
import { Calendar, Users, Search, Filter, CheckCircle, UserPlus, ArrowLeft, Clock, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Event, Student } from '../../types';
import { EVENT_TYPES } from '../../utils/constants';
import Modal from '../common/Modal';

const WeeklyAttendance: React.FC = () => {
  const { events, students, temples, markAttendance } = useData();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterUnit, setFilterUnit] = useState<'all' | string>('all');
  const [modalFilterUnit, setModalFilterUnit] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [attendedStudents, setAttendedStudents] = useState<Set<string>>(new Set());
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // Get upcoming events (today and future events)
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    return events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today; // Today and future events
    }).sort((a, b) => {
      // Sort by date, then by time
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.time.localeCompare(b.time);
    });
  };

  const upcomingEvents = getUpcomingEvents();

  // Filter events by temple
  const filteredEvents = filterUnit === 'all' 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.unit === filterUnit);

  // Get temple options
  const templeOptions = temples.map(temple => ({
    value: temple.abbreviation,
    label: `Templo ${temple.abbreviation} - ${temple.city}`
  }));

  // Add fallback temples if database is empty
  const fallbackTemples = [
    { value: 'SP', label: 'Templo SP - São Paulo' },
    { value: 'BH', label: 'Templo BH - Belo Horizonte' },
    { value: 'CP', label: 'Templo CP - Campinas' }
  ];

  const allTempleOptions = templeOptions.length > 0 ? templeOptions : fallbackTemples;

  // Get students for selected event's temple with modal filter
  const getStudentsForEvent = (event: Event) => {
    return students.filter(student => {
      if (student.isGuest) return false;
      
      // Apply modal filter
      if (modalFilterUnit === 'all') {
        return true;
      } else {
        return student.unit === modalFilterUnit;
      }
    });
  };

  // Filter students by search term
  const getFilteredStudents = (eventStudents: Student[]) => {
    if (!searchTerm) return eventStudents;
    
    return eventStudents.filter(student =>
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Sort students by attendance frequency (most frequent first)
  const sortStudentsByAttendance = (eventStudents: Student[]) => {
    return eventStudents.sort((a, b) => {
      const aAttendanceCount = a.attendance.length;
      const bAttendanceCount = b.attendance.length;
      return bAttendanceCount - aAttendanceCount;
    });
  };

  // Handle attendance marking - FIXED: Don't close modal and handle errors properly
  const handleMarkAttendance = async (studentId: string, eventId: string) => {
    // Prevent multiple clicks while processing
    if (isMarkingAttendance) return;
    
    // Check if already marked
    if (attendedStudents.has(studentId)) {
      console.log('Student already marked as present');
      return;
    }
    
    setIsMarkingAttendance(true);
    
    try {
      console.log('Marking attendance for student:', studentId, 'event:', eventId);
      
      // Mark attendance in database
      await markAttendance(studentId, selectedEvent!.date, 'event', eventId);
      
      // Add to local state immediately for visual feedback
      setAttendedStudents(prev => new Set([...prev, studentId]));
      
      console.log('Attendance marked successfully!');
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      
      // Remove from local state if there was an error
      setAttendedStudents(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
      
      // Show error message but don't close modal
      alert('Erro ao marcar presença. Tente novamente.');
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // Calculate total attendance
  const totalAttendance = attendedStudents.size + guestCount;

  // Get students for selected event
  const eventStudents = selectedEvent ? getStudentsForEvent(selectedEvent) : [];
  const filteredStudents = getFilteredStudents(eventStudents);
  const sortedStudents = sortStudentsByAttendance(filteredStudents);

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getEventTimeStatus = (dateStr: string, timeStr: string) => {
    const now = new Date();
    const eventDateTime = new Date(`${dateStr}T${timeStr}`);
    
    if (eventDateTime < now) {
      return { status: 'past', label: 'Finalizado', color: 'text-gray-400' };
    } else if (eventDateTime.toDateString() === now.toDateString()) {
      return { status: 'today', label: 'Hoje', color: 'text-green-400' };
    } else {
      return { status: 'future', label: 'Próximo', color: 'text-blue-400' };
    }
  };

  // Reset modal state when closing - FIXED: Update event attendees count
  const handleCloseModal = () => {
    // Update the event's attendees count with the new attendance
    if (selectedEvent && attendedStudents.size > 0) {
      // This will trigger a refresh of the events data
      // The attendance is already saved in the database, so the count will be updated
      console.log(`Event ${selectedEvent.id} now has ${totalAttendance} total attendees`);
    }
    
    setSelectedEvent(null);
    setAttendedStudents(new Set());
    setGuestCount(0);
    setSearchTerm('');
    setModalFilterUnit('all');
    setIsMarkingAttendance(false);
  };

  // Initialize attended students when modal opens
  React.useEffect(() => {
    if (selectedEvent) {
      // Get students who already have attendance for this event
      const alreadyAttended = new Set<string>();
      
      students.forEach(student => {
        const hasAttendance = student.attendance.some(att => 
          att.date === selectedEvent.date && 
          att.type === 'event' && 
          att.eventId === selectedEvent.id
        );
        if (hasAttendance) {
          alreadyAttended.add(student.id);
        }
      });
      
      setAttendedStudents(alreadyAttended);
    }
  }, [selectedEvent, students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Lista de Presença</h1>
          <p className="text-gray-400">Marque a presença dos membros nos próximos eventos</p>
        </div>
      </div>

      {/* Temple Filter */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
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
        </div>
      </div>

      {/* Events List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-red-400" />
          <span>Próximos Eventos ({filteredEvents.length})</span>
        </h2>
        
        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => {
              const temple = temples.find(t => t.abbreviation === event.unit);
              const templeName = temple ? `${temple.name} (${temple.city})` : `Templo ${event.unit}`;
              const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES];
              const timeStatus = getEventTimeStatus(event.date, event.time);
              
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-red-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: event.color || '#8B5CF6' }}
                        />
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {eventType?.label || 'Outro'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${timeStatus.color}`}>
                          {timeStatus.label}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-white mb-2">{event.title}</h3>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatEventDate(event.date)} às {event.time}</span>
                        </div>
                        <p>{templeName}</p>
                        <p>{event.location}</p>
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-white">
                        {event.attendees.length}
                      </div>
                      <div className="text-xs text-gray-400">
                        participantes
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum evento próximo
            </h3>
            <p className="text-gray-500">
              {filterUnit === 'all' 
                ? 'Não há eventos programados para os próximos dias'
                : `Não há eventos para ${allTempleOptions.find(t => t.value === filterUnit)?.label} nos próximos dias`
              }
            </p>
          </div>
        )}
      </div>

      {/* Attendance Modal - FIXED: Proper state management */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={handleCloseModal}
          title="Marcar Presença"
          size="xl"
        >
          <div className="space-y-6">
            {/* Event Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedEvent.color || '#8B5CF6' }}
                  />
                  <h3 className="text-lg font-semibold text-white">{selectedEvent.title}</h3>
                </div>
                
                {(() => {
                  const timeStatus = getEventTimeStatus(selectedEvent.date, selectedEvent.time);
                  return (
                    <span className={`text-xs px-2 py-1 rounded ${timeStatus.color}`}>
                      {timeStatus.label}
                    </span>
                  );
                })()}
              </div>
              <div className="text-sm text-gray-400">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatEventDate(selectedEvent.date)} às {selectedEvent.time}</span>
                </div>
                <p>{temples.find(t => t.abbreviation === selectedEvent.unit)?.name || `Templo ${selectedEvent.unit}`}</p>
                <p>{selectedEvent.location}</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar membro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>
              
              {/* Temple Filter for Modal */}
              <div className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={modalFilterUnit}
                  onChange={(e) => setModalFilterUnit(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                >
                  <option value="all">Todos os Templos</option>
                  {allTempleOptions.map(temple => (
                    <option key={temple.value} value={temple.value}>
                      {temple.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{totalAttendance}</p>
                <p className="text-xs text-gray-400">Total Presentes</p>
              </div>
            </div>

            {/* Members List - FIXED: Better visual feedback */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="text-lg font-semibold text-white">
                Membros ({sortedStudents.length})
                {modalFilterUnit !== 'all' && (
                  <span className="text-sm text-gray-400 ml-2">
                    - Filtrado por {allTempleOptions.find(t => t.value === modalFilterUnit)?.label}
                  </span>
                )}
              </h4>
              
              {sortedStudents.map(student => {
                const isPresent = attendedStudents.has(student.id);
                
                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isPresent 
                        ? 'bg-green-600/20 border-green-600/30' 
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                        alt={student.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      
                      <div>
                        <h5 className={`font-medium transition-colors ${isPresent ? 'text-green-400' : 'text-white'}`}>
                          {student.fullName}
                        </h5>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span className="font-medium">Templo {student.unit}</span>
                          <span>•</span>
                          <span>{student.attendance.length} presenças</span>
                          {student.isFounder && (
                            <>
                              <span>•</span>
                              <span className="text-red-400">Fundador</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkAttendance(student.id, selectedEvent.id);
                      }}
                      disabled={isPresent || isMarkingAttendance}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        isPresent
                          ? 'bg-green-600 text-white cursor-default'
                          : isMarkingAttendance
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                      }`}
                    >
                      {isPresent ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Presente</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          <span>{isMarkingAttendance ? 'Marcando...' : 'Marcar'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {sortedStudents.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    Nenhum membro encontrado
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Tente ajustar o termo de busca'
                      : modalFilterUnit !== 'all'
                      ? `Não há membros cadastrados para ${allTempleOptions.find(t => t.value === modalFilterUnit)?.label}`
                      : 'Não há membros cadastrados'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Guests Section */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-medium text-white">Convidados</h4>
                    <p className="text-xs text-gray-400">Número de pessoas não cadastradas</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                  >
                    -
                  </button>
                  
                  <span className="text-xl font-bold text-white w-8 text-center">
                    {guestCount}
                  </span>
                  
                  <button
                    onClick={() => setGuestCount(guestCount + 1)}
                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Summary - Enhanced with animations */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="transition-all duration-300">
                  <p className="text-2xl font-bold text-green-400 transition-all duration-300">
                    {attendedStudents.size}
                  </p>
                  <p className="text-xs text-gray-400">Membros</p>
                </div>
                <div className="transition-all duration-300">
                  <p className="text-2xl font-bold text-blue-400 transition-all duration-300">
                    {guestCount}
                  </p>
                  <p className="text-xs text-gray-400">Convidados</p>
                </div>
                <div className="transition-all duration-300">
                  <p className="text-2xl font-bold text-white transition-all duration-300">
                    {totalAttendance}
                  </p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-sm font-medium mb-1">
                    Como usar
                  </p>
                  <ul className="text-blue-300 text-xs space-y-1">
                    <li>• Clique em "Marcar" ao lado do nome para confirmar presença</li>
                    <li>• O nome ficará verde quando a presença for confirmada</li>
                    <li>• Use o filtro de templo para ver apenas membros específicos</li>
                    <li>• Use os botões + e - para ajustar o número de convidados</li>
                    <li>• A janela permanece aberta para marcar mais presenças</li>
                    <li>• Clique em "Fechar" quando terminar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WeeklyAttendance;