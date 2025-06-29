import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Users, Calendar, Download, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ATTENDANCE_LABELS, ATTENDANCE_COLORS } from '../../utils/constants';

const Statistics: React.FC = () => {
  const { students, events } = useData();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterUnit, setFilterUnit] = useState<'all' | 'SP' | 'BH'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'guest'>('all');

  // Filter students based on criteria
  const filteredStudents = students.filter(student => {
    const matchesUnit = filterUnit === 'all' || student.unit === filterUnit;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && student.isActive && !student.isGuest) ||
      (filterStatus === 'inactive' && !student.isActive && !student.isGuest) ||
      (filterStatus === 'guest' && student.isGuest);
    return matchesUnit && matchesStatus;
  });

  // Calculate statistics
  const totalStudents = students.filter(s => !s.isGuest).length;
  const activeStudents = students.filter(s => s.isActive && !s.isGuest).length;
  const inactiveStudents = students.filter(s => !s.isActive && !s.isGuest).length;
  const totalGuests = students.filter(s => s.isGuest).length;

  // Attendance statistics
  const attendanceStats = Object.keys(ATTENDANCE_LABELS).reduce((acc, type) => {
    const count = filteredStudents.reduce((sum, student) => {
      return sum + student.attendance.filter(att => 
        att.type === type && 
        att.date >= dateRange.start && 
        att.date <= dateRange.end
      ).length;
    }, 0);
    acc[type] = count;
    return acc;
  }, {} as Record<string, number>);

  // Monthly attendance data
  const getMonthlyAttendance = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = {
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        ...Object.keys(ATTENDANCE_LABELS).reduce((acc, type) => {
          acc[type] = filteredStudents.reduce((sum, student) => {
            return sum + student.attendance.filter(att => 
              att.type === type && att.date.startsWith(monthKey)
            ).length;
          }, 0);
          return acc;
        }, {} as Record<string, number>)
      };
      
      months.push(monthData);
    }
    
    return months;
  };

  const monthlyData = getMonthlyAttendance();

  // Events statistics
  const eventsInRange = events.filter(event => 
    event.date >= dateRange.start && event.date <= dateRange.end
  );

  const handleExportData = () => {
    const data = {
      period: `${dateRange.start} a ${dateRange.end}`,
      summary: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalGuests,
        totalEvents: eventsInRange.length
      },
      attendance: attendanceStats,
      monthlyAttendance: monthlyData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${dateRange.start}-${dateRange.end}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ComponentType<any>; 
    color: string;
    bgColor: string;
  }> = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-800`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Estatísticas e Relatórios</h1>
          <p className="text-gray-400">Análise detalhada dos dados do sistema</p>
        </div>
        
        <button
          onClick={handleExportData}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unidade
            </label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todas</option>
              <option value="SP">Templo SP</option>
              <option value="BH">Templo BH</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="guest">Convidados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Alunos"
          value={totalStudents}
          icon={Users}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
        />
        <StatCard
          title="Alunos Ativos"
          value={activeStudents}
          icon={Users}
          color="text-green-400"
          bgColor="bg-green-400/10"
        />
        <StatCard
          title="Alunos Inativos"
          value={inactiveStudents}
          icon={Users}
          color="text-red-400"
          bgColor="bg-red-400/10"
        />
        <StatCard
          title="Convidados"
          value={totalGuests}
          icon={Users}
          color="text-purple-400"
          bgColor="bg-purple-400/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members Status Chart */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-2 mb-6">
            <PieChart className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Status dos Membros</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-400 rounded-full" />
                <span className="text-gray-300">Ativos</span>
              </div>
              <div className="text-white font-semibold">{activeStudents}</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-400 rounded-full" />
                <span className="text-gray-300">Inativos</span>
              </div>
              <div className="text-white font-semibold">{inactiveStudents}</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-400 rounded-full" />
                <span className="text-gray-300">Convidados</span>
              </div>
              <div className="text-white font-semibold">{totalGuests}</div>
            </div>
          </div>
          
          {/* Simple progress bars */}
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Ativos</span>
                <span className="text-gray-400">{Math.round((activeStudents / totalStudents) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${(activeStudents / totalStudents) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Inativos</span>
                <span className="text-gray-400">{Math.round((inactiveStudents / totalStudents) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-400 h-2 rounded-full" 
                  style={{ width: `${(inactiveStudents / totalStudents) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance by Type */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Presença por Tipo</h2>
          </div>
          
          <div className="space-y-4">
            {Object.entries(attendanceStats).map(([type, count]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ATTENDANCE_COLORS[type as keyof typeof ATTENDANCE_COLORS] }}
                    />
                    <span className="text-gray-300">
                      {ATTENDANCE_LABELS[type as keyof typeof ATTENDANCE_LABELS]}
                    </span>
                  </div>
                  <span className="text-white font-semibold">{count}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: ATTENDANCE_COLORS[type as keyof typeof ATTENDANCE_COLORS],
                      width: `${Math.min((count / Math.max(...Object.values(attendanceStats))) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Attendance Trend */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-semibold text-white">Tendência de Presença (Últimos 6 Meses)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 pb-3">Mês</th>
                {Object.entries(ATTENDANCE_LABELS).map(([type, label]) => (
                  <th key={type} className="text-center text-gray-400 pb-3">{label}</th>
                ))}
                <th className="text-center text-gray-400 pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => {
                const total = Object.keys(ATTENDANCE_LABELS).reduce((sum, type) => sum + month[type], 0);
                return (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 text-white font-medium">{month.month}</td>
                    {Object.keys(ATTENDANCE_LABELS).map(type => (
                      <td key={type} className="text-center py-3 text-gray-300">{month[type]}</td>
                    ))}
                    <td className="text-center py-3 text-white font-semibold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events Summary */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-semibold text-white">Eventos no Período</h2>
        </div>
        
        {eventsInRange.length > 0 ? (
          <div className="space-y-3">
            {eventsInRange.map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">{event.title}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(event.date).toLocaleDateString('pt-BR')} • {event.time} • {event.unit === 'SP' ? 'Templo SP' : 'Templo BH'}
                  </p>
                </div>
                <div className="text-sm text-gray-300">
                  {event.attendees.length} participante(s)
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum evento no período
            </h3>
            <p className="text-gray-500">
              Não há eventos registrados para o período selecionado
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;