import React, { useState } from 'react';
import { Calendar, Users, TrendingUp, Clock, MapPin, Filter, Eye, CheckCircle, CreditCard, GraduationCap, Star, Award } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student, Event } from '../../types';
import { DEFAULT_TEMPLES, EVENT_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

interface StudentDashboardProps {
  student: Student;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student }) => {
  const { events, turmas, temples } = useData();
  const [filterUnit, setFilterUnit] = useState<string>(student.unit || 'all');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState<boolean>(false);
  const [showAllEvents, setShowAllEvents] = useState<boolean>(false);

  // Get student's current status and progress
  const getCurrentStatus = () => {
    if (student.masterMagusInitiationDate) {
      return { status: 'Mestre Mago', stage: 'master', color: 'text-purple-400' };
    } else if (student.notEntryDate) {
      return { status: 'N.O.T.', stage: 'not', color: 'text-red-400' };
    } else if (student.magistInitiationDate) {
      return { status: 'Iniciado', stage: 'initiated', color: 'text-blue-400' };
    } else if (student.internshipStartDate) {
      return { status: 'Estagiando', stage: 'internship', color: 'text-yellow-400' };
    } else if (student.developmentStartDate) {
      return { status: 'Desenvolvimento', stage: 'development', color: 'text-green-400' };
    } else {
      return { status: 'Novo Membro', stage: 'new', color: 'text-gray-400' };
    }
  };

  // Calculate development attendance percentage (only development type)
  const calculateDevelopmentProgress = () => {
    if (!student.developmentStartDate) return 0;
    
    const developmentAttendance = student.attendance.filter(att => att.type === 'development');
    const startDate = new Date(student.developmentStartDate);
    const now = new Date();
    const weeksElapsed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeksElapsed <= 0) return 0;
    
    const attendancePercentage = (developmentAttendance.length / weeksElapsed) * 100;
    return Math.min(attendancePercentage, 100);
  };

  // Calculate internship progress (6 months + work bonus)
  const calculateInternshipProgress = () => {
    if (!student.internshipStartDate) return 0;
    
    const internshipStart = new Date(student.internshipStartDate);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - internshipStart.getFullYear()) * 12 + 
                         (now.getMonth() - internshipStart.getMonth());
    
    // Count work/rito-aberto attendance as bonus weeks
    const workAttendance = student.attendance.filter(att => att.type === 'work' || att.type === 'event');
    const bonusWeeks = workAttendance.length;
    const totalProgress = (monthsElapsed / 6) * 100 + (bonusWeeks * 2); // Each work adds ~2% progress
    
    return Math.min(totalProgress, 100);
  };

  // Get student's turma
  const studentTurma = turmas.find(turma => turma.alunos.includes(student.id));

  // Check monthly payment status
  const getCurrentMonthPayment = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyAttendance = student.attendance.find(att => 
      att.type === 'monthly' && att.date.startsWith(currentMonth)
    );
    return !!monthlyAttendance;
  };

  // Get upcoming events
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const unitMatch = filterUnit === 'all' || event.unit === filterUnit;
      const typeMatch = filterEventType === 'all' || event.type === filterEventType;
      return eventDate >= today && unitMatch && typeMatch;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return showAllEvents ? filtered : filtered.slice(0, 5);
  };

  const currentStatus = getCurrentStatus();
  const developmentProgress = calculateDevelopmentProgress();
  const internshipProgress = calculateInternshipProgress();
  const isMonthlyPaid = getCurrentMonthPayment();
  const upcomingEvents = getUpcomingEvents();

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

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center space-x-6">
          <img
            src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
            alt={student.fullName}
            className="w-24 h-32 object-cover rounded-lg"
          />
          
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h2 className="text-2xl font-bold text-white">{student.fullName}</h2>
              
              {/* Achievement Badges */}
              <div className="flex ml-3 space-x-1">
                {student.developmentStartDate && (
                  <div className="relative group">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Início do Desenvolvimento Mágicko
                    </div>
                  </div>
                )}
                {student.internshipStartDate && (
                  <div className="relative group">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Estágio
                    </div>
                  </div>
                )}
                {student.magistInitiationDate && (
                  <div className="relative group">
                    <Star className="w-5 h-5 text-purple-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Iniciado como Magista
                    </div>
                  </div>
                )}
                {student.notEntryDate && (
                  <div className="relative group">
                    <Award className="w-5 h-5 text-red-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Membro da N.O.T.
                    </div>
                  </div>
                )}
                {student.masterMagusInitiationDate && (
                  <div className="relative group">
                    <Award className="w-5 h-5 text-gold-400" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Mestre Mago
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color} bg-gray-800`}>
                {currentStatus.status}
                {studentTurma && currentStatus.stage === 'development' && (
                  <span className="ml-2 text-gray-400">- Turma {studentTurma.numero}</span>
                )}
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                student.isActive 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-red-600/20 text-red-400'
              }`}>
                {student.isActive ? 'Ativo' : 'Inativo'}
              </div>

              {student.isFounder && (
                <div className="bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                  Fundador
                </div>
              )}
            </div>

            <p className="text-gray-400">
              {DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES] || `Templo ${student.unit}`}
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Bar */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Progresso</h3>
          </div>
          
          {currentStatus.stage === 'development' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Frequência no Desenvolvimento</span>
                <span className={`font-semibold ${developmentProgress >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {developmentProgress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    developmentProgress >= 85 ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${Math.min(developmentProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                Mínimo necessário: 85% para aprovação
              </p>
            </div>
          )}

          {currentStatus.stage === 'internship' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso do Estágio</span>
                <span className={`font-semibold ${internshipProgress >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {internshipProgress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    internshipProgress >= 100 ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${Math.min(internshipProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                6 meses + participação em trabalhos
              </p>
            </div>
          )}

          {!['development', 'internship'].includes(currentStatus.stage) && (
            <div className="text-center py-4">
              <p className="text-gray-400">Sem progresso a acompanhar</p>
            </div>
          )}
        </div>

        {/* Monthly Payment */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Mensalidade</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isMonthlyPaid 
                ? 'bg-green-600/20 text-green-400' 
                : 'bg-red-600/20 text-red-400'
            }`}>
              {isMonthlyPaid ? 'Pago' : 'Não Pago'}
            </div>
          </div>
        </div>

        {/* Total Participations */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Participações</h3>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-blue-400">{student.attendance.length}</p>
            <p className="text-gray-400 text-sm">Total de presenças</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Próximos Eventos</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                <option value="all">Todos os Templos</option>
                {allTempleOptions.map(temple => (
                  <option key={temple.value} value={temple.value}>
                    {temple.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                <option value="all">Todos os Tipos</option>
                <option value="desenvolvimento-magicko">Desenvolvimento</option>
                <option value="rito-aberto">Rito Aberto</option>
                <option value="ritual-coletivo">Rito Coletivo</option>
                <option value="workshop">Workshop</option>
                <option value="outro">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map(event => {
              const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES];
              
              return (
                <div 
                  key={event.id} 
                  className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: event.color || '#8B5CF6' }}
                    />
                    <div>
                      <h4 className="font-medium text-white">{event.title}</h4>
                      <div className="text-xs text-gray-400">
                        {formatDate(event.date)} às {event.time}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {eventType?.label || 'Outro'}
                    </span>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="text-sm text-red-400 hover:text-red-300 flex items-center justify-center mx-auto"
              >
                <Eye className="w-4 h-4 mr-1" />
                {showAllEvents ? 'Mostrar menos' : 'Ver todos os eventos'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum evento próximo
            </h3>
            <p className="text-gray-500">
              Não há eventos programados para {allTempleOptions.find(t => t.value === filterUnit)?.label}
            </p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
              <button 
                onClick={() => setShowEventDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {EVENT_TYPES[selectedEvent.type as keyof typeof EVENT_TYPES]?.label || 'Outro'}
                </span>
              </div>
              
              <div className="text-sm text-gray-400 space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(selectedEvent.date)} às {selectedEvent.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {selectedEvent.location} - 
                    {(() => {
                      const temple = temples.find(t => t.abbreviation === selectedEvent.unit);
                      return temple ? `${temple.name} (${temple.city})` : `Templo ${selectedEvent.unit}`;
                    })()}
                  </span>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Descrição</h4>
                  <p className="text-sm text-gray-400">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Participantes</h4>
                <p className="text-sm text-gray-400">{selectedEvent.attendees.length} participantes confirmados</p>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                  onClick={() => {
                    // Lógica para marcar presença será implementada posteriormente
                    alert('Presença marcada com sucesso!');
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Marcar Presença</span>
                </button>
                
                <button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={true} // Será habilitado quando implementarmos a funcionalidade de pagamento
                  onClick={() => {
                    // Lógica para pagamento será implementada posteriormente
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;