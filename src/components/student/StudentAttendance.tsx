import React, { useState } from 'react';
import { Calendar, Filter, CheckCircle, Clock } from 'lucide-react';
import { Student } from '../../types';
import { ATTENDANCE_LABELS, ATTENDANCE_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

interface StudentAttendanceProps {
  student: Student;
}

const StudentAttendance: React.FC<StudentAttendanceProps> = ({ student }) => {
  const [filterType, setFilterType] = useState<'all' | string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30' | '90' | '180'>('all');

  // Filter attendance records
  const filteredAttendance = student.attendance.filter(record => {
    const typeMatch = filterType === 'all' || record.type === filterType;
    
    if (!typeMatch) return false;
    
    if (filterPeriod === 'all') return true;
    
    const recordDate = new Date(record.date);
    const daysAgo = parseInt(filterPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return recordDate >= cutoffDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate statistics
  const getAttendanceStats = () => {
    const stats = Object.keys(ATTENDANCE_LABELS).reduce((acc, type) => {
      acc[type] = student.attendance.filter(att => att.type === type).length;
      return acc;
    }, {} as Record<string, number>);

    return stats;
  };

  const stats = getAttendanceStats();
  const totalAttendance = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Frequência</h2>
        <p className="text-gray-400">Acompanhe sua participação em eventos e atividades</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ATTENDANCE_LABELS).map(([type, label]) => (
          <div key={type} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ATTENDANCE_COLORS[type as keyof typeof ATTENDANCE_COLORS] }}
              />
              <h3 className="text-sm font-medium text-gray-300">{label}</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats[type] || 0}</p>
          </div>
        ))}
      </div>

      {/* Total Summary */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Total de Participações</h3>
          <p className="text-4xl font-bold text-green-400 mb-2">{totalAttendance}</p>
          <p className="text-gray-400">Desde o início do seu desenvolvimento</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">Filtros:</span>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todos os Tipos</option>
              {Object.entries(ATTENDANCE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>

            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Todo o Período</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 3 meses</option>
              <option value="180">Últimos 6 meses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-6">
          Histórico de Participações ({filteredAttendance.length})
        </h3>
        
        {filteredAttendance.length > 0 ? (
          <div className="space-y-3">
            {filteredAttendance.map((record, index) => (
              <div
                key={`${record.date}-${record.type}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ATTENDANCE_COLORS[record.type as keyof typeof ATTENDANCE_COLORS] }}
                  />
                  
                  <div>
                    <h4 className="font-medium text-white">
                      {ATTENDANCE_LABELS[record.type as keyof typeof ATTENDANCE_LABELS]}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(record.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Presente</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhuma participação encontrada
            </h3>
            <p className="text-gray-500">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'Suas participações aparecerão aqui conforme você comparecer aos eventos'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;