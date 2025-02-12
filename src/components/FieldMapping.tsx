import React from 'react';
import { DatabaseField } from '../types';

interface FieldMappingProps {
  sheetColumns: string[];
  fieldMapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}

const DATABASE_FIELDS: DatabaseField[] = [
  { key: 'full_name', label: 'Nome Completo', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
  { key: 'birth_date', label: 'Data de Nascimento' },
  { key: 'cpf', label: 'CPF' },
  { key: 'rg', label: 'RG' },
  { key: 'religion', label: 'Religião' },
  { key: 'unit', label: 'Unidade', required: true },
  { key: 'photo_url', label: 'URL da Foto' },
  { key: 'is_admin', label: 'É Admin?' },
  { key: 'is_founder', label: 'É Fundador?' },
  { key: 'is_active', label: 'Ativo?' },
  { key: 'development_start_date', label: 'Início Desenvolvimento' },
  { key: 'internship_start_date', label: 'Início Estágio' },
  { key: 'magista_initiation_date', label: 'Iniciação Magista' },
  { key: 'not_entry_date', label: 'Entrada NOT' },
  { key: 'master_mage_initiation_date', label: 'Iniciação Mestre Mago' },
  { key: 'inactive_since', label: 'Inativo desde' }
];

export function FieldMapping({ sheetColumns, fieldMapping, onChange }: FieldMappingProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Mapeamento de Campos</h3>
      <p className="text-sm text-gray-400">
        Relacione as colunas da planilha com os campos do sistema. 
        Campos com * são obrigatórios.
      </p>
      
      <div className="grid gap-4">
        {DATABASE_FIELDS.map(({ key, label, required }) => (
          <div key={key} className="flex items-center gap-4">
            <div className="w-1/2">
              <span className="text-sm font-medium text-gray-300">
                {label} {required && <span className="text-red-500">*</span>}
              </span>
            </div>
            <div className="w-1/2">
              <select
                value={fieldMapping[key] || ''}
                onChange={(e) => {
                  onChange({
                    ...fieldMapping,
                    [key]: e.target.value
                  });
                }}
                className={`w-full bg-gray-800 border rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-red-500 ${
                  required && !fieldMapping[key] 
                    ? 'border-red-500' 
                    : 'border-gray-700'
                }`}
              >
                <option value="">Ignorar este campo</option>
                {sheetColumns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
