import { createBrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { StudentsList } from '../pages/admin/StudentsList';
import { Events } from '../pages/admin/Events';
import { Attendance } from '../pages/admin/Attendance';
import { Statistics } from '../pages/admin/Statistics';
import { ImportStudents } from '../pages/admin/ImportStudents';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminDashboard />,
  },
  {
    path: '/students',
    element: <StudentsList />,
  },
  {
    path: '/events',
    element: <Events />,
  },
  {
    path: '/attendance',
    element: <Attendance />,
  },
  {
    path: '/statistics',
    element: <Statistics />,
  },
  {
    path: '/import',
    element: <ImportStudents />,
  },
]);