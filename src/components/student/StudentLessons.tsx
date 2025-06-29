import React from 'react';
import { BookOpen, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { formatDate } from '../../utils/helpers';

interface StudentLessonsProps {
  student: Student;
}

const StudentLessons: React.FC<StudentLessonsProps> = ({ student }) => {
  const { turmas } = useData();

  // Find student's turma
  const studentTurma = turmas.find(turma => turma.alunos.includes(student.id));

  if (!studentTurma) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Conteúdo de Aulas</h2>
          <p className="text-gray-400">Acompanhe o conteúdo das aulas da sua turma</p>
        </div>

        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Você não está matriculado em nenhuma turma
          </h3>
          <p className="text-gray-500">
            Entre em contato com a administração para ser adicionado a uma turma
          </p>
        </div>
      </div>
    );
  }

  // Sort lessons by date
  const sortedLessons = studentTurma.aulas.sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  // Calculate progress
  const totalLessons = sortedLessons.length;
  const completedLessons = sortedLessons.filter(aula => aula.realizada).length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Conteúdo de Aulas</h2>
        <p className="text-gray-400">
          Turma {studentTurma.numero} - Acompanhe o conteúdo das aulas
        </p>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{totalLessons}</div>
            <p className="text-gray-400">Total de Aulas</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{completedLessons}</div>
            <p className="text-gray-400">Aulas Realizadas</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{progressPercentage.toFixed(0)}%</div>
            <p className="text-gray-400">Progresso</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progresso da Turma</span>
            <span className="text-white">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-6">Cronograma de Aulas</h3>
        
        {sortedLessons.length > 0 ? (
          <div className="space-y-4">
            {sortedLessons.map((aula, index) => {
              const isCompleted = aula.realizada;
              const lessonDate = new Date(aula.data);
              const today = new Date();
              const isPast = lessonDate < today;
              const isToday = lessonDate.toDateString() === today.toDateString();
              
              return (
                <div
                  key={aula.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isCompleted 
                      ? 'bg-green-600/10 border-green-600/30' 
                      : isToday
                      ? 'bg-blue-600/10 border-blue-600/30'
                      : isPast
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-white">
                            Aula {index + 1}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(aula.data)}</span>
                            {isToday && (
                              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                                Hoje
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {aula.conteudo && (
                        <div className="ml-11">
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {aula.conteudo}
                          </p>
                        </div>
                      )}
                      
                      {!aula.conteudo && isCompleted && (
                        <div className="ml-11">
                          <p className="text-gray-500 text-sm italic">
                            Conteúdo não informado
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex items-center">
                      {isCompleted ? (
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Realizada</span>
                        </div>
                      ) : isPast ? (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm">Não realizada</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm">Agendada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhuma aula cadastrada
            </h3>
            <p className="text-gray-500">
              As aulas aparecerão aqui conforme forem sendo programadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLessons;