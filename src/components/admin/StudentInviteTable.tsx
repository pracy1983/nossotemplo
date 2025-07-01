import React from 'react';
import { CheckSquare, Square, Eye, X, Trash2, Mail, CheckCircle, Copy } from 'lucide-react';
import { Student } from '../../types';

interface StudentInviteTableProps {
  students: Student[];
  selectedStudents: Set<string>;
  onSelectStudent: (studentId: string) => void;
  onSelectAll: (students: Student[]) => void;
  onViewDetails: (studentId: string) => void;
  onReject: (studentId: string) => void;
  onDelete: (studentId: string) => void;
  onResendEmail?: (studentId: string) => void;
  onApprove?: (studentId: string) => void;
  getStatusColor: (status?: string) => string;
  getStatusLabel: (status?: string) => string;
}

const StudentInviteTable: React.FC<StudentInviteTableProps> = ({
  students,
  selectedStudents,
  onSelectStudent,
  onSelectAll,
  onViewDetails,
  onReject,
  onDelete,
  onResendEmail,
  onApprove,
  getStatusColor,
  getStatusLabel
}) => {
  return (
    <div className="overflow-x-auto mt-4 rounded-lg">
      <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left">
              <div className="flex items-center">
                <button
                  onClick={() => onSelectAll(students)}
                  className="text-gray-400 hover:text-white focus:outline-none"
                >
                  {students.length > 0 && selectedStudents.size === students.length ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nome
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Unidade
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Turma
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {students.length > 0 ? (
            students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => onSelectStudent(student.id)}
                    className="text-gray-400 hover:text-white focus:outline-none"
                  >
                    {selectedStudents.has(student.id) ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {student.fullName}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {student.email}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {student.unit}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.inviteStatus)}`}>
                    {getStatusLabel(student.inviteStatus)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {student.turma || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(student.id)}
                      className="p-1 text-gray-400 hover:text-blue-400 focus:outline-none"
                      title="Ver detalhes"
                    >
                      <Eye size={18} />
                    </button>
                    
                    {/* Botões de ação - agora visíveis para todos os registros */}
                    {onResendEmail && (
                      <>
                        <button
                          onClick={() => onResendEmail(student.id)}
                          className="p-1 text-gray-400 hover:text-green-400 focus:outline-none"
                          title="Reenviar email"
                        >
                          <Mail size={18} />
                        </button>
                        <button
                          onClick={() => {
                            // Gerar link e copiar para o clipboard
                            const baseUrl = window.location.origin;
                            const inviteLink = `${baseUrl}/invite/${student.inviteToken}`;
                            navigator.clipboard.writeText(inviteLink);
                            alert('Link copiado para a área de transferência!');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-400 focus:outline-none"
                          title="Copiar link de convite"
                        >
                          <Copy size={18} />
                        </button>
                      </>
                    )}
                    
                    {onApprove && (
                      <button
                        onClick={() => onApprove(student.id)}
                        className="p-1 text-gray-400 hover:text-green-400 focus:outline-none"
                        title="Aprovar"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onReject(student.id)}
                      className="p-1 text-gray-400 hover:text-red-400 focus:outline-none"
                      title="Rejeitar"
                    >
                      <X size={18} />
                    </button>
                    
                    <button
                      onClick={() => onDelete(student.id)}
                      className="p-1 text-gray-400 hover:text-red-400 focus:outline-none"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                Nenhum convite encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentInviteTable;
