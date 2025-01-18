import { StudentImport } from '../types';

export async function fetchSheetData(url: string): Promise<string[]> {
  try {
    // Extract sheet ID from URL
    const sheetId = extractSheetId(url);
    if (!sheetId) throw new Error('URL da planilha inválida');

    // Fetch sheet data using Google Sheets API
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z1?key=${import.meta.env.VITE_GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao acessar a planilha');
    }

    const data = await response.json();
    if (!data.values?.[0]) {
      throw new Error('A planilha está vazia ou não possui cabeçalhos');
    }

    return data.values[0];
  } catch (error: any) {
    if (error.message.includes('API key')) {
      throw new Error('Chave de API do Google Sheets inválida ou não configurada');
    }
    throw new Error(`Erro ao carregar planilha: ${error.message}`);
  }
}

export async function importSheetData(
  url: string,
  fieldMapping: Record<string, string>
): Promise<StudentImport[]> {
  try {
    const sheetId = extractSheetId(url);
    if (!sheetId) throw new Error('URL da planilha inválida');

    // Validate required fields
    if (!fieldMapping.full_name) {
      throw new Error('O campo "Nome Completo" é obrigatório');
    }

    // Fetch all sheet data
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${import.meta.env.VITE_GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao acessar a planilha');
    }

    const data = await response.json();
    if (!data.values?.length) {
      throw new Error('A planilha está vazia');
    }

    const [headers, ...rows] = data.values;

    // Map sheet data to student objects
    return rows.map((row: string[], index: number) => {
      const student: Partial<StudentImport> = {};

      Object.entries(fieldMapping).forEach(([dbField, sheetColumn]) => {
        if (sheetColumn) {
          const columnIndex = headers.indexOf(sheetColumn);
          if (columnIndex !== -1) {
            let value = row[columnIndex]?.trim();

            // Handle special fields
            switch (dbField) {
              case 'is_founder':
                value = ['sim', 'yes', 'true', '1'].includes(value?.toLowerCase());
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
            }

            student[dbField as keyof StudentImport] = value;
          }
        }
      });

      // Validate required fields
      if (!student.full_name) {
        throw new Error(`Linha ${index + 2}: Nome completo é obrigatório`);
      }

      return student as StudentImport;
    });
  } catch (error: any) {
    throw new Error(`Erro ao importar dados: ${error.message}`);
  }
}

function extractSheetId(url: string): string | null {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || null;
}