import React from 'react';
import { Calendar, Clock, GraduationCap, Star, Award } from 'lucide-react';
import { Student } from '../../types';
import { formatDate } from '../../utils/helpers';

interface StudentHistoryProps {
  student: Student;
}

const StudentHistory: React.FC<StudentHistoryProps> = ({ student }) => {
  // Calculate participations in the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentParticipations = student.attendance.filter(att => 
    new Date(att.date) >= threeMonthsAgo
  ).length;

  // Organize all important dates
  const historyEvents = [
    {
      date: student.developmentStartDate,
      title: 'Início do Desenvolvimento Mágicko',
      description: 'Começou sua jornada de desenvolvimento mágicko',
      icon: GraduationCap,
      color: 'text-blue-400'
    },
    {
      date: student.internshipStartDate,
      title: 'Início do Estágio',
      description: 'Iniciou o período de estágio prático',
      icon: Clock,
      color: 'text-yellow-400'
    },
    {
      date: student.magistInitiationDate,
      title: 'Iniciação como Magista',
      description: 'Recebeu a iniciação como Magista',
      icon: Star,
      color: 'text-purple-400'
    },
    {
      date: student.notEntryDate,
      title: 'Entrada na N.O.T.',
      description: 'Ingressou na Nova Ordem do Templo',
      icon: Award,
      color: 'text-red-400'
    },
    {
      date: student.masterMagusInitiationDate,
      title: 'Iniciação como Mestre Mago',
      description: 'Alcançou o grau de Mestre Mago',
      icon: Award,
      color: 'text-gold-400'
    }
  ].filter(event => event.date) // Only show events that have dates
   .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Histórico</h2>
        <p className="text-gray-400">Acompanhe sua jornada de desenvolvimento mágicko</p>
      </div>

      {/* Timeline */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-6">Linha do Tempo</h3>
        
        {historyEvents.length > 0 ? (
          <div className="space-y-6">
            {historyEvents.map((event, index) => {
              const Icon = event.icon;
              const isLast = index === historyEvents.length - 1;
              
              return (
                <div key={index} className="relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-700" />
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center ${event.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{event.title}</h4>
                          <span className="text-sm text-gray-400">
                            {formatDate(event.date!)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{event.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhum evento registrado
            </h3>
            <p className="text-gray-500">
              Seus marcos de desenvolvimento aparecerão aqui conforme forem sendo registrados
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-2">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Tempo de Desenvolvimento</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {student.developmentStartDate 
              ? Math.floor((new Date().getTime() - new Date(student.developmentStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
              : 0
            } meses
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-2">
            <Star className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Grau Atual</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {student.masterMagusInitiationDate ? 'Mestre Mago' :
             student.notEntryDate ? 'N.O.T.' :
             student.magistInitiationDate ? 'Iniciado' :
             student.internshipStartDate ? 'Estagiário' :
             student.developmentStartDate ? 'Desenvolvimento' : 'Novo Membro'}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Participações</h3>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {recentParticipations}
          </p>
          <p className="text-xs text-gray-400 mt-1">Últimos 3 meses</p>
        </div>
      </div>

      {/* Founder Badge */}
      {student.isFounder && (
        <div className="bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-600/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-red-400" />
            <div>
              <h3 className="text-xl font-bold text-red-400">Membro Fundador</h3>
              <p className="text-red-300">
                Reconhecido como um dos fundadores desta comunidade
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;