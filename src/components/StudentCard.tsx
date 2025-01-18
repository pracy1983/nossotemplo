import React from 'react';
import { User } from '../types';

interface StudentCardProps {
  student: User;
  onClick: () => void;
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  const statusColor = student.is_active ? 'bg-green-500' : 'bg-red-500';
  const cardOpacity = !student.is_active && student.inactive_since ? 'opacity-50' : 'opacity-100';

  return (
    <div
      onClick={onClick}
      className={`bg-gray-900 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-800 ${cardOpacity}`}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={student.photo_url || 'https://via.placeholder.com/96'}
            alt={student.full_name}
            className="w-24 h-32 object-cover rounded-lg"
          />
          {student.is_founder && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{student.full_name}</h3>
          <p className="text-sm text-gray-400">{student.unit}</p>
          <div className="flex items-center mt-2">
            <div className={`w-2 h-2 rounded-full ${statusColor} mr-2`} />
            <span className="text-sm">
              {student.is_active ? 'Ativo' : `Inativo desde ${student.inactive_since}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}