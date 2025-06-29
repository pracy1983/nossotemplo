import React, { useState } from 'react';
import { Calendar, Users, CheckSquare, BarChart3, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ATTENDANCE_LABELS, EVENT_TYPES } from '../../utils/constants';

interface DashboardProps {
  onFilterChange?: (unit: string) => void;
  onNavigateToCreateEvent?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToStatistics?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onFilterChange, 
  onNavigateToCreateEvent,
  onNavigateToAttendance,
  onNavigateToStatistics 
}) => {
  const { students, events, temples } = useData();
  const [selectedDate, setSelectedDate] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Calculate statistics
  const activeStudents = students.filter(s => s.isActive && !s.isGuest).length;
  const inactiveStudents = students.filter(s => !s.isActive && !s.isGuest).length;
  const totalGuests = students.filter(s => s.isGuest).length;

  // For recurring events, only count unique events (not repetitions)
  const uniqueEvents = events.filter(event => !event.parentEventId);
  const totalEvents = uniqueEvents.length;

  // Filter events by selected temple
  const filteredEvents = filterUnit === 'all' 
    ? events 
    : events.filter(event => event.unit === filterUnit);

  // Get all attendance records for calendar (filtered by temple if selected)
  const filteredStudents = filterUnit === 'all' 
    ? students 
    : students.filter(student => student.unit === filterUnit);
  
  const allAttendance = filteredStudents.flatMap(student => student.attendance);

  // Create temple options for filter - include all temples from database
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

  const handleFilterChange = (unit: string) => {
    setFilterUnit(unit);
    if (onFilterChange) {
      onFilterChange(unit);
    }
  };

  const handleTempleCardClick = (templeAbbreviation: string) => {
    handleFilterChange(templeAbbreviation);
  };

  const stats = [
    {
      label: 'Membros Ativos',
      value: activeStudents,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      label: 'Membros Inativos',
      value: inactiveStudents,
      icon: Users,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    },
    {
      label: 'Convidados',
      value: totalGuests,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      label: 'Eventos',
      value: totalEvents,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    }
  ];

  // Calendar component for dashboard
  const DashboardCalendar = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getEventsForDay = (day: number) => {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return filteredEvents.filter(event => event.date === dateStr);
    };

    const getAttendanceForDay = (day: number) => {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return allAttendance.filter(att => att.date === dateStr);
    };

    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          {/* Calendar Header */}
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayWeekday }).map((_, index) => (
              <div key={`empty-${index}`} className="h-20" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = getEventsForDay(day);
              const dayAttendance = getAttendanceForDay(day);
              const today = new Date();
              const isToday = today.getDate() === day &&
                             today.getMonth() === currentMonth &&
                             today.getFullYear() === currentYear;

              return (
                <div
                  key={day}
                  className={`h-20 p-1 border rounded-lg ${
                    isToday ? 'border-red-400 bg-red-400/10' : 'border-gray-700'
                  }`}
                >
                  <div className={`text-xs ${isToday ? 'font-bold text-red-400' : 'text-white'}`}>
                    {day}
                  </div>
                  
                  {/* Event and attendance indicators */}
                  <div className="mt-1 space-y-1">
                    {/* Show event dots only */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dayEvents.slice(0, 3).map(event => {
                          const temple = temples.find(t => t.abbreviation === event.unit);
                          const templeName = temple ? `${temple.name} (${temple.city})` : `Templo ${event.unit}`;
                          
                          return (
                            <div
                              key={event.id}
                              className="w-2 h-2 rounded-full cursor-pointer relative group"
                              style={{ backgroundColor: event.color || '#8B5CF6' }}
                            >
                              {/* Instant tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-50">
                                {event.title} - {templeName}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                              </div>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show attendance dots */}
                    {dayAttendance.length > 0 && (
                      <div className="flex space-x-1">
                        {Object.entries(ATTENDANCE_LABELS).map(([type, label]) => {
                          const hasType = dayAttendance.some(att => att.type === type);
                          if (!hasType) return null;
                          
                          const colors = {
                            development: '#F59E0B',
                            work: '#60A5FA',
                            monthly: '#10B981',
                            event: '#A855F7'
                          };
                          
                          return (
                            <div
                              key={type}
                              className="w-2 h-2 rounded-full relative group"
                              style={{ backgroundColor: colors[type as keyof typeof colors] }}
                            >
                              {/* Instant tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-50">
                                {label}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Combined Legend */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Legenda</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Tipos de Eventos</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(EVENT_TYPES).map(([key, type]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-xs text-gray-300">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Tipos de Presença</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(ATTENDANCE_LABELS).map(([type, label]) => {
                  const colors = {
                    development: '#F59E0B',
                    work: '#60A5FA',
                    monthly: '#10B981',
                    event: '#A855F7'
                  };
                  
                  return (
                    <div key={type} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[type as keyof typeof colors] }}
                      />
                      <span className="text-xs text-gray-300">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Painel Administrativo
        </h1>
        <p className="text-gray-400">
          Visão geral do sistema Nosso Templo
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-6 border border-gray-800`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-semibold text-white">
                Calendário de Atividades
              </h2>
            </div>
            
            {/* Temple Filter */}
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterUnit}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600"
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
          
          <DashboardCalendar />

          {/* Filtered Events Summary */}
          {filterUnit !== 'all' && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Eventos em {allTempleOptions.find(t => t.value === filterUnit)?.label}:
              </h3>
              <p className="text-white text-lg font-semibold">
                {filteredEvents.length} evento(s) no total
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Ações Rápidas
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={onNavigateToAttendance}
                className="w-full flex items-center space-x-3 p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <CheckSquare className="w-5 h-5" />
                <span>Marcar Presença</span>
              </button>
              
              <button 
                onClick={onNavigateToCreateEvent}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>Novo Evento</span>
              </button>
              
              <button 
                onClick={onNavigateToStatistics}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Ver Estatísticas</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Atividade Recente
            </h3>
            
            <div className="space-y-3">
              {allAttendance.slice(-5).reverse().map((record, index) => {
                const student = filteredStudents.find(s => 
                  s.attendance.some(a => a.date === record.date && a.type === record.type)
                );
                
                return (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <div className="flex-1 text-sm">
                      <p className="text-white">
                        {student?.fullName || 'Membro'}
                      </p>
                      <p className="text-gray-400">
                        {ATTENDANCE_LABELS[record.type]} - {new Date(record.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temples Summary - Now Clickable */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Templos Cadastrados
            </h3>
            
            <div className="space-y-3">
              {/* Show temples from database first */}
              {temples.map(temple => {
                const templeStudents = students.filter(s => s.unit === temple.abbreviation && !s.isGuest);
                const templeEvents = events.filter(e => e.unit === temple.abbreviation);
                const isSelected = filterUnit === temple.abbreviation;
                
                return (
                  <button
                    key={temple.id}
                    onClick={() => handleTempleCardClick(temple.abbreviation)}
                    className={`w-full p-3 rounded-lg transition-all text-left ${
                      isSelected 
                        ? 'bg-red-600/20 border border-red-600/30' 
                        : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${isSelected ? 'text-red-400' : 'text-white'}`}>
                          Templo {temple.abbreviation}
                        </h4>
                        <p className="text-sm text-gray-400">{temple.city}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-white">{templeStudents.length} membros</p>
                        <p className="text-gray-400">{templeEvents.length} eventos</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {/* Show fallback temples if database is empty */}
              {temples.length === 0 && fallbackTemples.map(temple => {
                const templeStudents = students.filter(s => s.unit === temple.value && !s.isGuest);
                const templeEvents = events.filter(e => e.unit === temple.value);
                const isSelected = filterUnit === temple.value;
                
                return (
                  <button
                    key={temple.value}
                    onClick={() => handleTempleCardClick(temple.value)}
                    className={`w-full p-3 rounded-lg transition-all text-left ${
                      isSelected 
                        ? 'bg-red-600/20 border border-red-600/30' 
                        : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${isSelected ? 'text-red-400' : 'text-white'}`}>
                          Templo {temple.value}
                        </h4>
                        <p className="text-sm text-gray-400">{temple.label.split(' - ')[1]}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-white">{templeStudents.length} membros</p>
                        <p className="text-gray-400">{templeEvents.length} eventos</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;