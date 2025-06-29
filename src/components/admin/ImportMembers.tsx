import React, { useState } from 'react';
import { Upload, Download, Mail, Send, Check, X, AlertTriangle, FileSpreadsheet, Link, Users, Eye, Edit3, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Student } from '../../types';
import { generateId, validateEmail, formatCPF, formatPhone } from '../../utils/helpers';
import Modal from '../common/Modal';

interface ImportedRow {
  id: string;
  data: Record<string, string>;
  mapped: Partial<Student>;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface FieldMapping {
  [key: string]: string; // CSV column -> Student field
}

const ImportMembers: React.FC = () => {
  const { addStudent, students, temples } = useData();
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'import' | 'email'>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Complete seu cadastro - Nosso Templo',
    body: `Olá {{nome}},

Seu cadastro foi importado para o sistema Nosso Templo. Para completar o processo, você precisa:

1. Acessar o link: {{link_cadastro}}
2. Criar sua senha
3. Verificar e completar suas informações pessoais

Se tiver dúvidas, entre em contato conosco.

Atenciosamente,
Equipe Nosso Templo`
  });
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  // Available student fields for mapping
  const studentFields = {
    fullName: 'Nome Completo',
    email: 'Email',
    phone: 'Telefone',
    birthDate: 'Data de Nascimento',
    cpf: 'CPF',
    rg: 'RG',
    religion: 'Religião',
    unit: 'Unidade/Templo',
    street: 'Rua',
    number: 'Número',
    complement: 'Complemento',
    neighborhood: 'Bairro',
    zipCode: 'CEP',
    city: 'Cidade',
    state: 'Estado',
    turma: 'Turma/Grupo'
  };

  // Convert Google Sheets URL to CSV export URL
  const convertSheetsUrlToCsv = (url: string): string => {
    try {
      // Extract the spreadsheet ID from different URL formats
      let spreadsheetId = '';
      
      // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
      const editMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (editMatch) {
        spreadsheetId = editMatch[1];
      } else {
        throw new Error('ID da planilha não encontrado na URL');
      }

      // Extract gid (sheet ID) if present
      let gid = '0'; // Default to first sheet
      const gidMatch = url.match(/gid=([0-9]+)/);
      if (gidMatch) {
        gid = gidMatch[1];
      }

      // Construct CSV export URL
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    } catch (error) {
      console.error('Error converting URL:', error);
      throw new Error('URL inválida. Verifique se é uma URL válida do Google Sheets.');
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('O arquivo deve ter pelo menos uma linha de cabeçalho e uma linha de dados.');
        return;
      }

      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const csvRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      setHeaders(csvHeaders);
      setCsvData(csvRows);
      setStep('mapping');
      autoMapFields();
    };
    reader.readAsText(file);
  };

  // Handle Google Sheets import
  const handleSheetsImport = async () => {
    if (!sheetsUrl.trim()) {
      alert('Por favor, insira a URL do Google Sheets');
      return;
    }

    setIsLoadingSheets(true);

    try {
      console.log('Original URL:', sheetsUrl);
      
      // Convert to CSV export URL
      const csvUrl = convertSheetsUrlToCsv(sheetsUrl);
      console.log('CSV URL:', csvUrl);

      // Fetch the CSV data
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Verifique se a planilha está pública e pode ser visualizada por qualquer pessoa com o link.');
        } else if (response.status === 404) {
          throw new Error('Planilha não encontrada. Verifique se a URL está correta.');
        } else {
          throw new Error(`Erro ao acessar a planilha (${response.status}). Verifique se ela está pública.`);
        }
      }

      const text = await response.text();
      console.log('CSV data received, length:', text.length);
      
      if (!text.trim()) {
        throw new Error('A planilha está vazia ou não pôde ser lida.');
      }

      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('A planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados.');
      }

      // Parse CSV more carefully
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };

      const csvHeaders = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
      const csvRows = lines.slice(1).map(line => parseCSVLine(line).map(cell => cell.replace(/"/g, '')));

      console.log('Headers:', csvHeaders);
      console.log('Rows count:', csvRows.length);

      setHeaders(csvHeaders);
      setCsvData(csvRows);
      setShowSheetsModal(false);
      setSheetsUrl('');
      setStep('mapping');
      
      // Auto-map fields after setting data
      setTimeout(() => {
        autoMapFields();
      }, 100);

    } catch (error: any) {
      console.error('Error importing from Google Sheets:', error);
      alert(error.message || 'Erro ao importar da planilha. Verifique se a URL está correta e se a planilha está pública.');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Auto-map fields based on common names
  const autoMapFields = () => {
    const mapping: FieldMapping = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      
      if (lowerHeader.includes('nome') || lowerHeader.includes('name')) mapping[header] = 'fullName';
      else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) mapping[header] = 'email';
      else if (lowerHeader.includes('telefone') || lowerHeader.includes('phone') || lowerHeader.includes('celular')) mapping[header] = 'phone';
      else if (lowerHeader.includes('nascimento') || lowerHeader.includes('birth') || lowerHeader.includes('data')) mapping[header] = 'birthDate';
      else if (lowerHeader.includes('cpf')) mapping[header] = 'cpf';
      else if (lowerHeader.includes('rg')) mapping[header] = 'rg';
      else if (lowerHeader.includes('religião') || lowerHeader.includes('religion')) mapping[header] = 'religion';
      else if (lowerHeader.includes('unidade') || lowerHeader.includes('templo') || lowerHeader.includes('unit')) mapping[header] = 'unit';
      else if (lowerHeader.includes('rua') || lowerHeader.includes('street') || lowerHeader.includes('endereço')) mapping[header] = 'street';
      else if (lowerHeader.includes('número') || lowerHeader.includes('number') || lowerHeader.includes('num')) mapping[header] = 'number';
      else if (lowerHeader.includes('complemento') || lowerHeader.includes('complement')) mapping[header] = 'complement';
      else if (lowerHeader.includes('bairro') || lowerHeader.includes('neighborhood')) mapping[header] = 'neighborhood';
      else if (lowerHeader.includes('cep') || lowerHeader.includes('zip')) mapping[header] = 'zipCode';
      else if (lowerHeader.includes('cidade') || lowerHeader.includes('city')) mapping[header] = 'city';
      else if (lowerHeader.includes('estado') || lowerHeader.includes('state') || lowerHeader.includes('uf')) mapping[header] = 'state';
      else if (lowerHeader.includes('turma') || lowerHeader.includes('grupo') || lowerHeader.includes('class')) mapping[header] = 'turma';
    });

    setFieldMapping(mapping);
  };

  // Process mapped data
  const processData = () => {
    const rows: ImportedRow[] = csvData.map((row, index) => {
      const data: Record<string, string> = {};
      const mapped: Partial<Student> = {};

      // Create data object
      headers.forEach((header, headerIndex) => {
        data[header] = row[headerIndex] || '';
      });

      // Apply mapping
      Object.entries(fieldMapping).forEach(([csvField, studentField]) => {
        const value = data[csvField]?.trim();
        if (value && studentField) {
          if (studentField === 'birthDate' && value) {
            // Try to parse different date formats
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              mapped[studentField] = date.toISOString().split('T')[0];
            }
          } else if (studentField === 'cpf' && value) {
            mapped[studentField] = formatCPF(value);
          } else if (studentField === 'phone' && value) {
            mapped[studentField] = formatPhone(value);
          } else if (studentField === 'unit' && value) {
            // Map unit names to abbreviations
            const unitMap: Record<string, string> = {
              'sp': 'SP',
              'são paulo': 'SP',
              'templo sp': 'SP',
              'bh': 'BH',
              'belo horizonte': 'BH',
              'templo bh': 'BH',
              'cp': 'CP',
              'campinas': 'CP',
              'templo cp': 'CP'
            };
            mapped[studentField] = unitMap[value.toLowerCase()] || value;
          } else {
            (mapped as any)[studentField] = value;
          }
        }
      });

      // Set defaults
      mapped.id = generateId();
      mapped.isFounder = false;
      mapped.isActive = true;
      mapped.isAdmin = false;
      mapped.isGuest = false;
      mapped.role = 'student';
      mapped.attendance = [];
      mapped.isPendingApproval = true; // Require approval for imported students

      return {
        id: mapped.id!,
        data,
        mapped,
        status: 'pending' as const
      };
    });

    setImportedRows(rows);
    setStep('preview');
  };

  // Validate row data
  const validateRow = (row: ImportedRow): { isValid: boolean; error?: string } => {
    if (!row.mapped.fullName) {
      return { isValid: false, error: 'Nome é obrigatório' };
    }
    
    if (!row.mapped.email) {
      return { isValid: false, error: 'Email é obrigatório' };
    }
    
    if (!validateEmail(row.mapped.email)) {
      return { isValid: false, error: 'Email inválido' };
    }

    // Check for duplicate email
    const existingStudent = students.find(s => 
      s.email.toLowerCase() === row.mapped.email!.toLowerCase()
    );
    if (existingStudent) {
      return { isValid: false, error: 'Email já existe no sistema' };
    }

    return { isValid: true };
  };

  // Import data
  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    const updatedRows = [...importedRows];

    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      const validation = validateRow(row);

      if (!validation.isValid) {
        row.status = 'error';
        row.error = validation.error;
        errorCount++;
        continue;
      }

      try {
        await addStudent(row.mapped as Student);
        row.status = 'success';
        successCount++;
      } catch (error: any) {
        row.status = 'error';
        row.error = error.message || 'Erro ao importar';
        errorCount++;
      }

      setImportedRows([...updatedRows]);
    }

    setImportResults({ success: successCount, errors: errorCount });
    setIsImporting(false);
    setStep('email');
  };

  // Handle student selection for email
  const handleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Send emails
  const handleSendEmails = async () => {
    if (selectedStudents.size === 0) {
      alert('Selecione pelo menos um aluno para enviar email');
      return;
    }

    setIsSendingEmails(true);

    try {
      const selectedRows = importedRows.filter(row => 
        selectedStudents.has(row.id) && row.status === 'success'
      );

      for (const row of selectedRows) {
        // Generate invite link (in a real app, this would be a proper invite system)
        const inviteLink = `${window.location.origin}/convite/${generateId()}`;
        
        const personalizedSubject = emailTemplate.subject.replace('{{nome}}', row.mapped.fullName || '');
        const personalizedBody = emailTemplate.body
          .replace(/{{nome}}/g, row.mapped.fullName || '')
          .replace(/{{link_cadastro}}/g, inviteLink)
          .replace(/{{email}}/g, row.mapped.email || '');

        // In a real app, you would send the email through your email service
        console.log('Sending email to:', row.mapped.email);
        console.log('Subject:', personalizedSubject);
        console.log('Body:', personalizedBody);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert(`Emails enviados com sucesso para ${selectedRows.length} aluno(s)!`);
      setSelectedStudents(new Set());
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Erro ao enviar emails. Tente novamente.');
    } finally {
      setIsSendingEmails(false);
    }
  };

  // Reset import process
  const resetImport = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setFieldMapping({});
    setImportedRows([]);
    setSelectedStudents(new Set());
    setSheetsUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Importar Membros</h1>
          <p className="text-gray-400">
            Importe membros de planilhas CSV ou Google Sheets
          </p>
        </div>
        
        {step !== 'upload' && (
          <button
            onClick={resetImport}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Reiniciar</span>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'mapping', label: 'Mapeamento', icon: Link },
            { id: 'preview', label: 'Visualizar', icon: Eye },
            { id: 'import', label: 'Importar', icon: Download },
            { id: 'email', label: 'Emails', icon: Mail }
          ].map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = step === stepItem.id;
            const isCompleted = ['upload', 'mapping', 'preview', 'import'].indexOf(stepItem.id) < ['upload', 'mapping', 'preview', 'import'].indexOf(step);
            
            return (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? 'border-red-600 bg-red-600 text-white' 
                    : isCompleted
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {stepItem.label}
                </span>
                {index < 4 && (
                  <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-600'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV Upload */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Upload CSV</h3>
                <p className="text-gray-400 mb-4">
                  Faça upload de um arquivo CSV com os dados dos membros
                </p>
                
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors inline-block">
                  <span className="text-white">Selecionar Arquivo</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Google Sheets */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-center">
                <FileSpreadsheet className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Google Sheets</h3>
                <p className="text-gray-400 mb-4">
                  Importe diretamente de uma planilha do Google Sheets
                </p>
                
                <button
                  onClick={() => setShowSheetsModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors text-white"
                >
                  Conectar Planilha
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-6">
            <h4 className="text-blue-400 font-medium mb-3">Instruções para Importação</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-300 text-sm">
              <div>
                <h5 className="font-medium mb-2">Formato CSV:</h5>
                <ul className="space-y-1">
                  <li>• Primeira linha deve conter os cabeçalhos</li>
                  <li>• Use vírgula como separador</li>
                  <li>• Codificação UTF-8</li>
                  <li>• Campos obrigatórios: Nome e Email</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Google Sheets:</h5>
                <ul className="space-y-1">
                  <li>• A planilha deve estar pública</li>
                  <li>• Primeira linha deve conter os cabeçalhos</li>
                  <li>• Copie a URL completa da planilha</li>
                  <li>• Dados serão importados da primeira aba</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Mapeamento de Campos</h3>
              <button
                onClick={autoMapFields}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                Auto-mapear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headers.map(header => (
                <div key={header} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Coluna: "{header}"
                  </label>
                  <select
                    value={fieldMapping[header] || ''}
                    onChange={(e) => setFieldMapping(prev => ({
                      ...prev,
                      [header]: e.target.value
                    }))}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  >
                    <option value="">Ignorar campo</option>
                    {Object.entries(studentFields).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={processData}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors text-white"
              >
                Processar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-6">
              Visualizar Dados ({importedRows.length} registros)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 pb-3">Nome</th>
                    <th className="text-left text-gray-400 pb-3">Email</th>
                    <th className="text-left text-gray-400 pb-3">Telefone</th>
                    <th className="text-left text-gray-400 pb-3">Unidade</th>
                    <th className="text-left text-gray-400 pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importedRows.slice(0, 10).map(row => {
                    const validation = validateRow(row);
                    return (
                      <tr key={row.id} className="border-b border-gray-800">
                        <td className="py-3 text-white">{row.mapped.fullName || '-'}</td>
                        <td className="py-3 text-white">{row.mapped.email || '-'}</td>
                        <td className="py-3 text-white">{row.mapped.phone || '-'}</td>
                        <td className="py-3 text-white">{row.mapped.unit || '-'}</td>
                        <td className="py-3">
                          {validation.isValid ? (
                            <span className="text-green-400">✓ Válido</span>
                          ) : (
                            <span className="text-red-400">✗ {validation.error}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {importedRows.length > 10 && (
              <p className="text-gray-400 text-sm mt-4">
                Mostrando 10 de {importedRows.length} registros
              </p>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setStep('mapping')}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors text-white"
              >
                Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 px-6 py-2 rounded-lg transition-colors text-white"
              >
                {isImporting ? 'Importando...' : 'Importar Dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'email' && (
        <div className="space-y-6">
          {/* Import Results */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Resultado da Importação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Check className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">{importResults.success} Sucessos</p>
                    <p className="text-green-300 text-sm">Membros importados com sucesso</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <X className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="text-red-400 font-semibold">{importResults.errors} Erros</p>
                    <p className="text-red-300 text-sm">Registros com problemas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Management */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Enviar Emails de Cadastro</h3>
              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                Configurar Email
              </button>
            </div>

            {/* Student Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-300">
                  Selecione os membros para enviar email de cadastro:
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const successfulIds = importedRows
                        .filter(row => row.status === 'success')
                        .map(row => row.id);
                      setSelectedStudents(new Set(successfulIds));
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={() => setSelectedStudents(new Set())}
                    className="text-gray-400 hover:text-gray-300 text-sm"
                  >
                    Limpar Seleção
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {importedRows.filter(row => row.status === 'success').map(row => (
                  <label key={row.id} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(row.id)}
                      onChange={() => handleStudentSelection(row.id)}
                      className="rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{row.mapped.fullName}</p>
                      <p className="text-gray-400 text-sm">{row.mapped.email}</p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedStudents.size > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSendEmails}
                    disabled={isSendingEmails}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-6 py-2 rounded-lg transition-colors text-white"
                  >
                    {isSendingEmails ? 'Enviando...' : `Enviar Emails (${selectedStudents.size})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Modal */}
      <Modal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        title="Importar do Google Sheets"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL da Planilha do Google Sheets
            </label>
            <input
              type="url"
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
            <p className="text-gray-400 text-xs mt-1">
              Cole a URL completa da sua planilha do Google Sheets
            </p>
          </div>

          <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium mb-2">Configuração Necessária:</h4>
            <ol className="text-yellow-300 text-sm space-y-1 list-decimal list-inside">
              <li>Abra sua planilha no Google Sheets</li>
              <li>Clique em <strong>"Compartilhar"</strong> (canto superior direito)</li>
              <li>Em "Acesso geral", altere para <strong>"Qualquer pessoa com o link"</strong></li>
              <li>Certifique-se de que está definido como <strong>"Visualizador"</strong></li>
              <li>Clique em <strong>"Copiar link"</strong> e cole aqui</li>
            </ol>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">Exemplo de URL válida:</h4>
            <code className="text-blue-300 text-xs break-all">
              https://docs.google.com/spreadsheets/d/1DkxMXztTAiC7cUxWVvkd2Zcb18V-a9Jm_LVM4W4OmiA/edit?usp=sharing
            </code>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSheetsModal(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSheetsImport}
              disabled={!sheetsUrl.trim() || isLoadingSheets}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg transition-colors text-white"
            >
              {isLoadingSheets ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Email Template Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Configurar Template de Email"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assunto do Email
            </label>
            <input
              type="text"
              value={emailTemplate.subject}
              onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Corpo do Email
            </label>
            <textarea
              value={emailTemplate.body}
              onChange={(e) => setEmailTemplate(prev => ({ ...prev, body: e.target.value }))}
              rows={10}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">Variáveis Disponíveis:</h4>
            <div className="text-blue-300 text-sm space-y-1">
              <p><code>{'{{nome}}'}</code> - Nome do membro</p>
              <p><code>{'{{email}}'}</code> - Email do membro</p>
              <p><code>{'{{link_cadastro}}'}</code> - Link para completar cadastro</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
            >
              Salvar Template
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ImportMembers;