import React from 'react';
import type { StudentImport } from '../types';

interface ImportPreviewProps {
  students: StudentImport[];
  onImport: (students: StudentImport[]) => void;
  isLoading: boolean;
}

export function ImportPreview({ students, onImport, isLoading }: ImportPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prévia da Importação</h2>
        <span className="text-sm text-gray-400">
          {students.length} aluno{students.length !== 1 ? 's' : ''} encontrado{students.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nome Completo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Unidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Religião
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Data de Nascimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                CPF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                RG
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Início Desenvolvimento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {students.map((student, index) => (
              <tr key={index} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.religion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.birth_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.cpf}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.rg}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.development_start_date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => onImport(students)}
          disabled={isLoading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Importando...
            </>
          ) : (
            'Confirmar Importação'
          )}
        </button>
      </div>
    </div>
  );
}