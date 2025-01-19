import { createBrowserRouter, Navigate, redirect } from 'react-router-dom';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { StudentsList } from '../pages/admin/StudentsList';
import { Events } from '../pages/admin/Events';
import { Attendance } from '../pages/admin/Attendance';
import { Statistics } from '../pages/admin/Statistics';
import { ImportStudents } from '../pages/admin/ImportStudents';
import { AddStudent } from '../pages/admin/AddStudent';
import { Login } from '../pages/Login';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const loader = () => {
  const auth = supabase.auth.getSession();
  if (!auth) {
    return redirect('/login');
  }
  return null;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AdminDashboard />,
    loader: loader,
  },
  {
    path: '/students',
    element: <StudentsList />,
    loader: loader,
  },
  {
    path: '/students/add',
    element: <AddStudent />,
    loader: loader,
  },
  {
    path: '/events',
    element: <Events />,
    loader: loader,
  },
  {
    path: '/attendance',
    element: <Attendance />,
    loader: loader,
  },
  {
    path: '/statistics',
    element: <Statistics />,
    loader: loader,
  },
  {
    path: '/import',
    element: <ImportStudents />,
    loader: loader,
  },
]);