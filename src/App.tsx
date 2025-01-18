import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AdminDashboard } from './pages/admin/Dashboard';
import { StudentsList } from './pages/admin/StudentsList';
import { Events } from './pages/admin/Events';
import { Attendance } from './pages/admin/Attendance';
import { Statistics } from './pages/admin/Statistics';
import { ImportStudents } from './pages/admin/ImportStudents';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/students" element={<StudentsList />} />
          <Route path="/events" element={<Events />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/import" element={<ImportStudents />} />
        </Routes>
        <ToastContainer
          position="top-right"
          theme="dark"
          autoClose={3000}
        />
      </div>
    </BrowserRouter>
  );
}