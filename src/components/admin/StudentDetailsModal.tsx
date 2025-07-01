import React from 'react';
import { Student } from '../../types';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/helpers';

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, isOpen, onClose }) => {
  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Membro - ${student.fullName}`}>
      <div className="space-y-4 p-2">
        {/* Informações Pessoais */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Informações Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Nome Completo</p>
              <p className="text-white">{student.fullName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white">{student.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Telefone</p>
              <p className="text-white">{student.phone || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Data de Nascimento</p>
              <p className="text-white">{student.birthDate ? formatDate(student.birthDate) : 'Não informada'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">CPF</p>
              <p className="text-white">{student.cpf || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">RG</p>
              <p className="text-white">{student.rg || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Religião</p>
              <p className="text-white">{student.religion || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Como conheceu o templo</p>
              <p className="text-white">{student.howFoundTemple || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Rua</p>
              <p className="text-white">{student.street || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Número</p>
              <p className="text-white">{student.number || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Complemento</p>
              <p className="text-white">{student.complement || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Bairro</p>
              <p className="text-white">{student.neighborhood || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">CEP</p>
              <p className="text-white">{student.zipCode || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Cidade</p>
              <p className="text-white">{student.city || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Estado</p>
              <p className="text-white">{student.state || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Informações do Templo */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Informações do Templo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Unidade</p>
              <p className="text-white">{student.unit || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Turma</p>
              <p className="text-white">{student.turma || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Papel</p>
              <p className="text-white">{student.role === 'admin' ? 'Administrador' : student.role === 'collaborator' ? 'Colaborador' : 'Estudante'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-white">{student.isActive ? 'Ativo' : 'Inativo'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status do Convite</p>
              <p className="text-white">
                {student.inviteStatus === 'pending' ? 'Pendente' : 
                 student.inviteStatus === 'accepted' ? 'Aceito' : 
                 student.inviteStatus === 'expired' ? 'Expirado' : 
                 student.inviteStatus === 'rejected' ? 'Rejeitado' : 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Convidado por</p>
              <p className="text-white">{student.invitedBy || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Data do Convite</p>
              <p className="text-white">{student.invitedAt ? formatDate(student.invitedAt) : 'Não informada'}</p>
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        {(student.instagramPersonal || student.instagramMagicko) && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-3">Redes Sociais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.instagramPersonal && (
                <div>
                  <p className="text-gray-400 text-sm">Instagram Pessoal</p>
                  <p className="text-white">{student.instagramPersonal}</p>
                </div>
              )}
              {student.instagramMagicko && (
                <div>
                  <p className="text-gray-400 text-sm">Instagram Mágicko</p>
                  <p className="text-white">{student.instagramMagicko}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Datas Importantes */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Datas Importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.developmentStartDate && (
              <div>
                <p className="text-gray-400 text-sm">Início do Desenvolvimento</p>
                <p className="text-white">{formatDate(student.developmentStartDate)}</p>
              </div>
            )}
            {student.internshipStartDate && (
              <div>
                <p className="text-gray-400 text-sm">Início do Estágio</p>
                <p className="text-white">{formatDate(student.internshipStartDate)}</p>
              </div>
            )}
            {student.magistInitiationDate && (
              <div>
                <p className="text-gray-400 text-sm">Iniciação Magista</p>
                <p className="text-white">{formatDate(student.magistInitiationDate)}</p>
              </div>
            )}
            {student.notEntryDate && (
              <div>
                <p className="text-gray-400 text-sm">Entrada NOT</p>
                <p className="text-white">{formatDate(student.notEntryDate)}</p>
              </div>
            )}
            {student.masterMagusInitiationDate && (
              <div>
                <p className="text-gray-400 text-sm">Iniciação Mestre Magus</p>
                <p className="text-white">{formatDate(student.masterMagusInitiationDate)}</p>
              </div>
            )}
            {student.inactiveSince && (
              <div>
                <p className="text-gray-400 text-sm">Inativo desde</p>
                <p className="text-white">{formatDate(student.inactiveSince)}</p>
              </div>
            )}
            {student.lastActivity && (
              <div>
                <p className="text-gray-400 text-sm">Última Atividade</p>
                <p className="text-white">{formatDate(student.lastActivity)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Termos de Imagem */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Termos de Imagem</h3>
          <div>
            <p className="text-gray-400 text-sm">Aceita Termos de Imagem</p>
            <p className="text-white">{student.acceptsImageTerms ? 'Sim' : 'Não'}</p>
          </div>
          {student.imageTermsAcceptedAt && (
            <div className="mt-2">
              <p className="text-gray-400 text-sm">Data de Aceitação</p>
              <p className="text-white">{formatDate(student.imageTermsAcceptedAt)}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentDetailsModal;
