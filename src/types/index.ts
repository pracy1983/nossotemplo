export interface Student {
  id: string;
  photo?: string;
  fullName: string;
  birthDate: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string;
  religion: string;
  unit: string; // Changed to string to support dynamic temples
  developmentStartDate?: string;
  internshipStartDate?: string;
  magistInitiationDate?: string;
  notEntryDate?: string;
  masterMagusInitiationDate?: string;
  isFounder: boolean;
  isActive: boolean;
  inactiveSince?: string;
  lastActivity?: string;
  attendance: AttendanceRecord[];
  isAdmin: boolean;
  isGuest: boolean;
  role: 'admin' | 'collaborator' | 'student';
  // Address fields
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  // Group/Class field
  turma?: string;
  turmaId?: string; // Reference to Turma ID
  // Invite and approval fields
  isPendingApproval?: boolean;
  inviteStatus?: 'pending' | 'accepted' | 'expired';
  inviteToken?: string;
  invitedAt?: string;
  invitedBy?: string;
  // New fields for import
  howFoundTemple?: string; // Como conheceu o templo
  acceptsImageTerms?: boolean; // Se aceita termos de imagem
  imageTermsAcceptedAt?: string; // Data de aceitação dos termos
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  unit: string; // Changed to string to support dynamic temples
  attendees: string[];
  type?: 'workshop' | 'ritual-coletivo' | 'rito-aberto' | 'desenvolvimento-magicko' | 'not' | 'reuniao' | 'outro';
  color?: string;
  visibility?: string[];
  repetition?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  repeatUntil?: string;
  parentEventId?: string; // For recurring events
}

export interface Temple {
  id: string;
  photo?: string;
  name: string;
  city: string;
  abbreviation: string; // e.g., "SP", "BH", "CP"
  address: string;
  founders: string[]; // Array of student IDs who are founders
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Turma {
  id: string;
  unit: string; // Temple abbreviation
  numero: number; // Class number
  valor: number; // Price/value
  dataInicio: string; // Start date
  hora: string; // Time
  duracaoMeses: number; // Duration in months (default 6)
  status: 'em-andamento' | 'encerrada' | 'planejada';
  alunos: string[]; // Array of student IDs
  aulas: Aula[]; // Array of lessons
  createdAt: string;
  updatedAt: string;
}

export interface Aula {
  id: string;
  turmaId: string;
  data: string; // Date of the lesson
  conteudo: string; // Lesson content/description
  realizada: boolean; // Whether the lesson was completed
  createdAt: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId?: string;
  date: string;
  type: 'development' | 'work' | 'monthly' | 'event';
  eventId?: string;
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  student?: Student;
  studentId?: string; // Add this field for easier student lookup
}

export interface InviteData {
  fullName: string;
  email: string;
  unit: string;
  turma?: string;
  turmaId?: string; // Reference to specific Turma
  invitedBy: string;
}

export interface StudentRegistrationData {
  fullName: string;
  birthDate: string;
  cpf?: string;
  rg?: string;
  phone?: string;
  religion?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

export type ViewMode = 'list' | 'card';
export type FilterStatus = 'all' | 'active' | 'inactive';
export type FilterUnit = 'all' | string; // Changed to support dynamic temples
export type FilterRole = 'all' | 'admin' | 'collaborator' | 'student';
export type UserRole = 'admin' | 'collaborator' | 'student';
export type ApprovalFilter = 'all' | 'pending' | 'approved';
export type TurmaStatus = 'all' | 'em-andamento' | 'encerrada' | 'planejada';