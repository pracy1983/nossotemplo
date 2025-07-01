import React, { useState } from 'react';
import { Student } from '../../types';
import Modal from '../common/Modal';

interface StudentRejectModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onReject: (id: string, reason: string) => Promise<void>;
}

const StudentRejectModal: React.FC<StudentRejectModalProps> = ({ student, isOpen, onClose, onReject }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student.id) return;

    try {
      setIsSubmitting(true);
      await onReject(student.id, rejectReason);
      setRejectReason('');
      onClose();
    } catch (error) {
      console.error('Erro ao rejeitar membro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rejeitar Membro">
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <div className="mb-4">
          <p className="text-white mb-2">
            Você está prestes a rejeitar o membro <span className="font-semibold">{student.fullName}</span>.
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Esta ação irá marcar o membro como rejeitado e ele não poderá acessar a plataforma.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-300 mb-1">
            Motivo da rejeição (opcional)
          </label>
          <textarea
            id="rejectReason"
            className="w-full bg-gray-700 border border-gray-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Informe o motivo da rejeição (opcional)"
          />
          <p className="text-gray-400 text-xs mt-1">
            Este motivo será registrado internamente e não será enviado ao membro.
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              'Rejeitar Membro'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentRejectModal;
