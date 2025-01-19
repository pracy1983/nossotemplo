import { StudentImport } from '../types';

export function parseCSV(content: string): string[][] {
  const rows = content.split(/\r?\n/);
  return rows.map(row => {
    // Handle both comma and semicolon delimiters
    const delimiter = row.includes(';') ? ';' : ',';
    return row.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
  });
}

export function validateHeaders(headers: string[]): void {
  if (headers.length === 0) {
    throw new Error('O arquivo está vazio ou não possui cabeçalhos');
  }
}

export function processStudentData(
  rows: string[][],
  fieldMapping: Record<string, string>,
  headers: string[]
): StudentImport[] {
  // Remove empty rows
  const validRows = rows.filter(row => row.some(cell => cell.trim()));

  return validRows.map((row, index) => {
    const student: Partial<StudentImport> = {};

    Object.entries(fieldMapping).forEach(([dbField, sheetColumn]) => {
      if (sheetColumn) {
        const columnIndex = headers.indexOf(sheetColumn);
        if (columnIndex !== -1) {
          let value = row[columnIndex]?.trim();

          // Handle special fields
          switch (dbField) {
            case 'is_founder':
            case 'is_admin':
            case 'is_active':
              value = ['sim', 'yes', 'true', '1'].includes(value?.toLowerCase())
                ? true
                : ['não', 'no', 'false', '0'].includes(value?.toLowerCase())
                ? false
                : undefined;
              break;
            case 'unit':
              value = value === 'BH' ? 'Templo BH' : 'Templo SP';
              break;
            case 'email':
              if (!value) {
                const name = row[headers.indexOf(fieldMapping.full_name)]
                  ?.toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9]/g, '.');
                value = `${name}@nossotemplo.com`;
              }
              break;
            case 'cpf':
              value = value.replace(/\D/g, '');
              break;
            case 'phone':
              value = value.replace(/\D/g, '');
              break;
            case 'development_start_date':
            case 'internship_start_date':
            case 'magista_initiation_date':
            case 'not_entry_date':
            case 'master_mage_initiation_date':
            case 'inactive_since':
              if (value) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  value = date.toISOString().split('T')[0];
                }
              }
              break;
          }

          student[dbField as keyof StudentImport] = value;
        }
      }
    });

    // Validate required fields
    if (!student.full_name) {
      throw new Error(`Linha ${index + 2}: Nome completo é obrigatório`);
    }
    if (!student.unit) {
      throw new Error(`Linha ${index + 2}: Unidade é obrigatória`);
    }

    return student as StudentImport;
  });
}
