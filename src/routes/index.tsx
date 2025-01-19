import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { StudentsList } from '../pages/admin/StudentsList';
import { Events } from '../pages/admin/Events';
import { Attendance } from '../pages/admin/Attendance';
import { Statistics } from '../pages/admin/Statistics';
import { ImportStudents } from '../pages/admin/ImportStudents';
import { AddStudent } from '../pages/admin/AddStudent';
import { Login } from '../pages/Login';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AdminDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/students',
    element: (
      <PrivateRoute>
        <StudentsList />
      </PrivateRoute>
    ),
  },
  {
    path: '/students/add',
    element: (
      <PrivateRoute>
        <AddStudent />
      </PrivateRoute>
    ),
  },
  {
    path: '/events',
    element: (
      <PrivateRoute>
        <Events />
      </PrivateRoute>
    ),
  },
  {
    path: '/attendance',
    element: (
      <PrivateRoute>
        <Attendance />
      </PrivateRoute>
    ),
  },
  {
    path: '/statistics',
    element: (
      <PrivateRoute>
        <Statistics />
      </PrivateRoute>
    ),
  },
  {
    path: '/import',
    element: (
      <PrivateRoute>
        <ImportStudents />
      </PrivateRoute>
    ),
  },
]);