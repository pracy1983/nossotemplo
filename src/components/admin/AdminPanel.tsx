import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import Dashboard from './Dashboard';
import StudentList from './StudentList';
import AddStudent from './AddStudent';
import StudentInvites from './StudentInvites';
import ManageAdmins from './ManageAdmins';
import Events from './Events';
import CreateEvent from './CreateEvent';
import WeeklyAttendance from './WeeklyAttendance';
import Statistics from './Statistics';
import Temples from './Temples';
import Turmas from './Turmas';
import ImportMembers from './ImportMembers';
import StudentProfileEdit from '../student/StudentProfileEdit';
import { useAuth } from '../../contexts/AuthContext';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleNavigateToAddStudent = () => {
    setActiveTab('add-student');
  };

  const handleNavigateToStudentList = () => {
    setActiveTab('students');
  };

  const handleNavigateToCreateEvent = () => {
    setActiveTab('create-event');
  };

  const handleNavigateToEvents = () => {
    setActiveTab('events');
  };

  const handleNavigateToAttendance = () => {
    setActiveTab('attendance');
  };

  const handleNavigateToStatistics = () => {
    setActiveTab('statistics');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigateToCreateEvent={handleNavigateToCreateEvent}
            onNavigateToAttendance={handleNavigateToAttendance}
            onNavigateToStatistics={handleNavigateToStatistics}
          />
        );
      case 'students':
        return <StudentList onNavigateToAddStudent={handleNavigateToAddStudent} />;
      case 'add-student':
        return <AddStudent onNavigateToList={handleNavigateToStudentList} />;
      case 'student-invites':
        return <StudentInvites onNavigateToAddStudent={handleNavigateToAddStudent} />;
      case 'manage-admins':
        return <ManageAdmins />;
      case 'temples':
        return <Temples />;
      case 'turmas':
        return <Turmas />;
      case 'events':
        return <Events onNavigateToCreateEvent={handleNavigateToCreateEvent} />;
      case 'create-event':
        return <CreateEvent onNavigateBack={handleNavigateToEvents} onEventSaved={handleNavigateToEvents} />;
      case 'attendance':
        return <WeeklyAttendance />;
      case 'import':
        return <ImportMembers />;
      case 'statistics':
        return <Statistics />;
      case 'edit-profile':
        return <StudentProfileEdit student={user.student} />;
      default:
        return (
          <Dashboard 
            onNavigateToCreateEvent={handleNavigateToCreateEvent}
            onNavigateToAttendance={handleNavigateToAttendance}
            onNavigateToStatistics={handleNavigateToStatistics}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-64">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;