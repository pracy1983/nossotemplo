import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Link } from 'lucide-react';
import { toast } from 'react-toastify';
import type { StudentImport } from '../types';
import { FieldMapping } from './FieldMapping';
import { parseCSV, validateHeaders, processStudentData } from '../utils/csv';
import { fetchSheetData, importSheetData } from '../utils/sheets';

interface ImportFormProps {
  onDataReceived: (students: StudentImport[]) => void;
}

export function ImportForm({ onDataReceived }: ImportFormProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [importType, setImportType] = useState<'file' | 'sheet'>('file');
  const fileContent = useRef<string>('');
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    setImportType('file');

    try {
      const content = await file.text();
      fileContent.current = content;
      
      const rows = parseCSV(content);
      const headers = rows[0];
      validateHeaders(headers);
      
      setHeaders(headers);
    } catch (error: any) {
      toast.error(error.message);
      setHeaders([]);
      setFileName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetUrlChange = async () => {
    if (!sheetUrl) {
      toast.error('Por favor, insira a URL da planilha');
      return;
    }

    setIsLoading(true);
    setImportType('sheet');

    try {
      const headers = await fetchSheetData(sheetUrl);
      setHeaders(headers);
    } catch (error: any) {
      toast.error(error.message);
      setHeaders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!fieldMapping.full_name) {
      toast.error('O campo "Nome Completo" é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      let students: StudentImport[];
      
      if (importType === 'file') {
        if (!fileContent.current) {
          throw new Error('Por favor, selecione um arquivo primeiro');
        }
        const rows = parseCSV(fileContent.current);
        const [headers, ...dataRows] = rows;
        students = processStudentData(dataRows, fieldMapping, headers);
      } else {
        if (!sheetUrl) {
          throw new Error('Por favor, insira a URL da planilha');
        }
        students = await importSheetData(sheetUrl, fieldMapping);
      }
      
      onDataReceived(students);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg space-y-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setImportType('file')}
            className={`flex-1 py-2 px-4 rounded-lg ${
              importType === 'file'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Importar Arquivo
          </button>
          <button
            onClick={() => setImportType('sheet')}
            className={`flex-1 py-2 px-4 rounded-lg ${
              importType === 'sheet'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Importar Planilha
          </button>
        </div>

        {importType === 'file' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Arquivo CSV ou Excel
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Selecionar Arquivo
              </button>
              {fileName && (
                <span className="text-sm text-gray-400">
                  Arquivo selecionado: {fileName}
                </span>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL da Planilha Google Sheets
            </label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Cole a URL da planilha"
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button
                onClick={handleSheetUrlChange}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Link className="w-5 h-5" />
                Carregar
              </button>
            </div>
          </div>
        )}
      </div>

      {headers.length > 0 && (
        <>
          <FieldMapping
            sheetColumns={headers}
            fieldMapping={fieldMapping}
            onChange={setFieldMapping}
          />

          <button
            onClick={handleImport}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Importando...' : 'Importar Dados'}
          </button>
        </>
      )}
    </div>
  );
}
