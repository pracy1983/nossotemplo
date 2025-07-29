import React, { useState, useEffect } from 'react';
import { Calendar, User, BookOpen, CreditCard, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { DEFAULT_TEMPLES } from '../../utils/constants';
import StudentDashboard from './StudentDashboard';
import StudentProfileEdit from './StudentProfileEdit';
import StudentLessons from './StudentLessons';
import StudentAttendance from './StudentAttendance';
import StudentPayments from './StudentPayments';
import StudentHistory from './StudentHistory';

const StudentMain: React.FC = () => {
  const { user } = useAuth();
  const { students, refreshData } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentStudent, setCurrentStudent] = useState<Student | undefined>();

  // Find the current student - try multiple approaches
  useEffect(() => {
    let foundStudent: Student | undefined;
    
    // Priorizar dados do AuthContext se disponíveis
    if (user?.student) {
      foundStudent = user.student;
      console.log('StudentProfile: Usando dados do AuthContext:', foundStudent.fullName);
    } else if (user?.studentId) {
      foundStudent = students.find(s => s.id === user.studentId);
      console.log('StudentProfile: Encontrado por studentId:', foundStudent?.fullName);
    } else if (user?.email) {
      foundStudent = students.find(s => s.email === user.email);
      console.log('StudentProfile: Encontrado por email:', foundStudent?.fullName);
    }
    
    if (foundStudent) {
      setCurrentStudent(foundStudent);
      console.log('StudentProfile: Estudante atual definido:', foundStudent.fullName);
    } else {
      console.log('StudentProfile: Nenhum estudante encontrado');
    }
  }, [user, students]);
  
  const handleStudentUpdated = async (updatedStudent: Student) => {
    console.log('StudentProfile: Estudante atualizado recebido:', updatedStudent.fullName);
    setCurrentStudent(updatedStudent);
    
    // Forçar uma pequena pausa para garantir que o AuthContext seja atualizado primeiro
    setTimeout(async () => {
      try {
        await refreshData();
        console.log('StudentProfile: Dados atualizados com sucesso');
      } catch (error) {
        console.error('Error refreshing data after student update:', error);
      }
    }, 100);
  };
  
  // Use currentStudent as the source of truth
  const student = currentStudent;

  if (!student) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Perfil não encontrado</h1>
            <p className="text-gray-300 mb-4">
              Não foi possível carregar suas informações de perfil.
            </p>
            <div className="text-sm text-gray-400 space-y-2">
              <p><strong>Email do usuário:</strong> {user?.email || 'Não disponível'}</p>
              <p><strong>ID do usuário:</strong> {user?.id || 'Não disponível'}</p>
              <p><strong>Student ID:</strong> {user?.studentId || 'Não disponível'}</p>
              <p><strong>Total de estudantes:</strong> {students.length}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'lessons', label: 'Conteúdo de Aulas', icon: BookOpen },
    { id: 'attendance', label: 'Frequência', icon: Calendar },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'history', label: 'Histórico', icon: Clock }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentDashboard student={student} />;
      case 'profile':
        return student ? <StudentProfileEdit student={student} onStudentUpdated={handleStudentUpdated} /> : null;
      case 'lessons':
        return <StudentLessons student={student} />;
      case 'attendance':
        return <StudentAttendance student={student} />;
      case 'payments':
        return <StudentPayments student={student} />;
      case 'history':
        return <StudentHistory student={student} />;
      default:
        return <StudentDashboard student={student} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop'}
                  alt={student.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">{student.fullName}</h1>
                  <p className="text-gray-400">{DEFAULT_TEMPLES[student.unit as keyof typeof DEFAULT_TEMPLES] || `Templo ${student.unit}`}</p>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                student.isActive 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-red-600/20 text-red-400'
              }`}>
                {student.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex space-x-1 overflow-x-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === item.id
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StudentMain;