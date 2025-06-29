import { Student, AttendanceRecord } from '../types';

export const formatDate = (date: string): string => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

export const parseDate = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const isStudentActive = (student: Student): boolean => {
  if (!student.lastActivity) return false;
  
  const lastActivity = new Date(student.lastActivity);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  return lastActivity > threeMonthsAgo;
};

export const calculateInactiveSince = (student: Student): string | null => {
  if (student.isActive || !student.lastActivity) return null;
  
  const lastActivity = new Date(student.lastActivity);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  if (lastActivity <= threeMonthsAgo) {
    return formatDate(threeMonthsAgo.toISOString().split('T')[0]);
  }
  
  return null;
};

export const hasAttendanceOnDate = (attendance: AttendanceRecord[], date: string, type?: string): boolean => {
  return attendance.some(record => 
    record.date === date && (!type || record.type === type)
  );
};

export const getAttendanceForDate = (attendance: AttendanceRecord[], date: string): AttendanceRecord[] => {
  return attendance.filter(record => record.date === date);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  
  return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatCPF = (cpf: string): string => {
  cpf = cpf.replace(/\D/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (phone: string): string => {
  phone = phone.replace(/\D/g, '');
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};