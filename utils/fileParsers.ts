
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { ExtractionData, MeasurementItem, ReportHierarchy } from '../types';

export const parseDocx = async (file: File): Promise<ExtractionData> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;

  const contratoMatch = text.match(/Contrato\s*nº\s*(.*?)-/i);
  const processoMatch = text.match(/Processo:\s*(.*?)\s*Objeto:/i);
  const objetoMatch = text.match(/Objeto:\s*(.*?)\s*Valor/i);

  return {
    contrato: contratoMatch ? contratoMatch[1].trim() : '',
    processo: processoMatch ? processoMatch[1].trim() : '',
    objeto: objetoMatch ? objetoMatch[1].trim() : '',
  };
};

const normalizeCode = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val).trim().replace(/\s+/g, '');
};

export const parseXlsx = async (file: File): Promise<ReportHierarchy[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as any[][];
  
  let valorColIndex = -1;
  let startRowIndex = -1;

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const cellValue = String(rows[r][c] || '').toUpperCase();
      if (cellValue.includes('ATUAL MEDIÇÃO')) {
        const nextRow = rows[r + 1];
        if (nextRow && String(nextRow[c + 1] || '').toUpperCase() === 'VALOR') {
          valorColIndex = c + 1;
          startRowIndex = r + 2;
          break;
        }
        for (let vR = r + 1; vR < Math.min(r + 5, rows.length); vR++) {
          for (let vC = c; vC < Math.min(c + 5, rows[vR].length); vC++) {
            if (String(rows[vR][vC] || '').toUpperCase() === 'VALOR') {
              valorColIndex = vC;
              startRowIndex = vR + 1;
              break;
            }
          }
          if (valorColIndex !== -1) break;
        }
      }
      if (valorColIndex !== -1) break;
    }
    if (valorColIndex !== -1) break;
  }

  if (valorColIndex === -1) {
    throw new Error('Não foi possível localizar a célula "VALOR" abaixo de "ATUAL MEDIÇÃO".');
  }

  const finalReport: ReportHierarchy[] = [];

  for (let i = startRowIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= valorColIndex) continue;

    const isHidden = sheet['!rows'] && sheet['!rows'][i] && sheet['!rows'][i].hidden;
    if (isHidden) continue;

    const rawValue = row[valorColIndex];
    const valor = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue || '0').replace(',', '.'));

    if (valor > 0) {
      const childA = normalizeCode(row[0]);
      const childB = normalizeCode(row[1]);
      if (!childB) continue;

      const child: MeasurementItem = {
        a: childA,
        b: childB,
        c: String(row[2] || '').trim(),
        valor: valor
      };

      // Passo 7: Encontrar Pai (mesma Coluna A E 4 primeiros caracteres da Coluna B)
      const parentPrefix = childB.substring(0, 4);
      let parent: MeasurementItem | undefined;
      for (let j = i - 1; j >= 0; j--) {
        const pA = normalizeCode(rows[j][0]);
        const pB = normalizeCode(rows[j][1]);
        if (pB === parentPrefix && pA === childA) {
          parent = {
            a: pA,
            b: pB,
            c: String(rows[j][2] || '').trim(),
            valor: 0
          };
          break;
        }
      }

      // Passo 8: Encontrar Avô (mesma Coluna A E 2 primeiros caracteres da Coluna B)
      const gpPrefix = childB.substring(0, 2);
      let grandparent: MeasurementItem | undefined;
      for (let k = i - 1; k >= 0; k--) {
        const gpA = normalizeCode(rows[k][0]);
        const gpB = normalizeCode(rows[k][1]);
        if (gpB === gpPrefix && gpA === childA) {
          grandparent = {
            a: gpA,
            b: gpB,
            c: String(rows[k][2] || '').trim(),
            valor: 0
          };
          break;
        }
      }

      finalReport.push({ grandparent, parent, child });
    }
  }

  return finalReport;
};
