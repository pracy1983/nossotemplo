import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { StudentCard } from '../../components/StudentCard';
import { StudentFilters } from '../../components/StudentFilters';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';

export function StudentsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // TODO: Replace with real data from Supabase
  const students: User[] = [];

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesUnit = !unit || student.unit === unit;
    const matchesStatus =
      !status ||
      (status === 'active' ? student.is_active : !student.is_active);

    return matchesSearch && matchesUnit && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lista de Alunos</h1>
          <button
            onClick={() => navigate('/students/add')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Adicionar Aluno
          </button>
        </div>

        <StudentFilters
          search={search}
          onSearchChange={setSearch}
          unit={unit}
          onUnitChange={setUnit}
          status={status}
          onStatusChange={setStatus}
          view={view}
          onViewChange={setView}
        />

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhum aluno encontrado
          </div>
        ) : (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={() => navigate(`/students/${student.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}