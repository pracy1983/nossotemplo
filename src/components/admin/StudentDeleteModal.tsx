import React, { useState } from 'react';
import { Student } from '../../types';
import Modal from '../common/Modal';

interface StudentDeleteModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({ student, isOpen, onClose, onDelete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student.id || confirmText !== student.fullName) return;

    try {
      setIsSubmitting(true);
      await onDelete(student.id);
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Membro">
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <div className="mb-4">
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4 mb-4">
            <p className="text-red-400 font-medium mb-2">Atenção: Esta ação não pode ser desfeita!</p>
            <p className="text-gray-300">
              Você está prestes a excluir permanentemente o membro <span className="font-semibold">{student.fullName}</span>.
              Todos os dados associados a este membro serão removidos do sistema.
            </p>
          </div>
          
          <p className="text-gray-300 mb-4">
            Para confirmar a exclusão, digite o nome completo do membro: <span className="font-semibold">{student.fullName}</span>
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="confirmText" className="block text-sm font-medium text-gray-300 mb-1">
            Confirme o nome completo
          </label>
          <input
            id="confirmText"
            type="text"
            className="w-full bg-gray-700 border border-gray-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Digite o nome completo para confirmar"
          />
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
            disabled={isSubmitting || confirmText !== student.fullName}
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
              'Excluir Permanentemente'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentDeleteModal;
