import React from 'react';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Settings,
  Home,
  Upload,
  Building,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { students } = useData();
  
  // Count pending approvals
  const pendingApprovals = students.filter(student => 
    student.isPendingApproval && student.inviteStatus === 'accepted'
  ).length;

  const menuItems = [
    { id: 'dashboard', label: 'Painel Principal', icon: Home },
    { id: 'students', label: 'Lista de Membros', icon: Users },
    { 
      id: 'student-invites', 
      label: 'Gerenciar Membros', 
      icon: UserCheck,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined
    },
    { id: 'manage-admins', label: 'Gerenciar ADMs', icon: Settings },
    { id: 'temples', label: 'Templos', icon: Building },
    { id: 'turmas', label: 'Turmas', icon: BookOpen },
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'attendance', label: 'Marcar Presença', icon: CheckSquare },
    { id: 'import', label: 'Importar Membros', icon: Upload },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 }
  ];

  return (
    <aside className="fixed left-0 top-16 h-full w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  
                  {item.badge && (
                    <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;