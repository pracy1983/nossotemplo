import { supabase, supabaseManager } from '../lib/supabaseClient';

// Interfaces para tipos do banco de dados
interface DatabaseStudent {
  id: string;
  photo?: string;
  full_name: string;
  birth_date: string | null;
  cpf?: string;
  rg?: string;
  email: string;
  phone?: string;
  religion?: string;
  unit: 'SP' | 'BH' | 'CP';
  development_start_date?: string | null;
  internship_start_date?: string | null;
  magist_initiation_date?: string | null;
  not_entry_date?: string | null;
  master_magus_initiation_date?: string | null;
  is_founder: boolean;
  is_active: boolean;
  inactive_since?: string | null;
  last_activity?: string | null;
  is_admin: boolean;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  turma?: string;
  is_pending_approval?: boolean;
  invite_status?: 'pending' | 'accepted' | 'expired';
  invite_token?: string;
  invited_at?: string;
  invited_by?: string;
}

interface DatabaseEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  location: string;
  unit: 'SP' | 'BH' | 'CP';
  created_at: string;
  updated_at: string;
}

interface DatabaseAttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  type: 'development' | 'work' | 'monthly' | 'event';
  event_id?: string;
  created_at: string;
}
import { Student, Event, AttendanceRecord, User, Temple, InviteData, StudentRegistrationData, Turma, Aula } from '../types';
import { EVENT_TYPES } from '../utils/constants';
// Importar apenas o serviço de email frontend
import { sendInviteEmail } from './emailServiceFrontend';

// Função local para simular envio de email (sem depender do Nodemailer)
const simulateEmailSend = (to: string, subject: string, html: string): void => {
  console.log('Simulando envio de email (database.ts):')
  console.log('Para:', to);
  console.log('Assunto:', subject);
  console.log('Conteúdo HTML:', html.substring(0, 100) + '...');
};

// Helper functions to convert between database and app types
const dbStudentToStudent = (dbStudent: DatabaseStudent): Student => ({
  id: dbStudent.id,
  photo: dbStudent.photo,
  fullName: dbStudent.full_name,
  birthDate: dbStudent.birth_date || '',
  cpf: dbStudent.cpf || '',
  rg: dbStudent.rg || '',
  email: dbStudent.email,
  phone: dbStudent.phone || '',
  religion: dbStudent.religion || '',
  unit: dbStudent.unit,
  developmentStartDate: dbStudent.development_start_date,
  internshipStartDate: dbStudent.internship_start_date,
  magistInitiationDate: dbStudent.magist_initiation_date,
  notEntryDate: dbStudent.not_entry_date,
  masterMagusInitiationDate: dbStudent.master_magus_initiation_date,
  isFounder: dbStudent.is_founder,
  isActive: dbStudent.is_active,
  inactiveSince: dbStudent.inactive_since,
  lastActivity: dbStudent.last_activity,
  isAdmin: dbStudent.is_admin,
  isGuest: dbStudent.is_guest,
  role: dbStudent.is_admin ? 'admin' : 'student', // Default role mapping
  attendance: [],
  // Address fields
  street: dbStudent.street,
  number: dbStudent.number,
  complement: dbStudent.complement,
  neighborhood: dbStudent.neighborhood,
  zipCode: dbStudent.zip_code,
  city: dbStudent.city,
  state: dbStudent.state,
  // Group/Class field
  turma: dbStudent.turma,
  turmaId: undefined, // Will be populated from turma_alunos table
  // Invite and approval fields
  isPendingApproval: dbStudent.is_pending_approval,
  inviteStatus: dbStudent.invite_status as 'pending' | 'accepted' | 'expired' | undefined,
  inviteToken: dbStudent.invite_token,
  invitedAt: dbStudent.invited_at,
  invitedBy: dbStudent.invited_by
});

const studentToDbStudent = (student: Partial<Student>): Partial<DatabaseStudent> => {
  const dbData: Partial<DatabaseStudent> = {};
  if (student.photo !== undefined) dbData.photo = student.photo;
  if (student.fullName !== undefined) dbData.full_name = student.fullName;
  if (student.birthDate !== undefined) dbData.birth_date = student.birthDate || '1900-01-01'; // Use placeholder date instead of null
  if (student.cpf !== undefined) dbData.cpf = student.cpf || null;
  if (student.rg !== undefined) dbData.rg = student.rg || null;
  if (student.email !== undefined) dbData.email = student.email;
  if (student.phone !== undefined) dbData.phone = student.phone || null;
  if (student.religion !== undefined) dbData.religion = student.religion || null;
  if (student.unit !== undefined) dbData.unit = student.unit;
  if (student.developmentStartDate !== undefined) dbData.development_start_date = student.developmentStartDate === '' ? null : student.developmentStartDate;
  if (student.internshipStartDate !== undefined) dbData.internship_start_date = student.internshipStartDate === '' ? null : student.internshipStartDate;
  if (student.magistInitiationDate !== undefined) dbData.magist_initiation_date = student.magistInitiationDate === '' ? null : student.magistInitiationDate;
  if (student.notEntryDate !== undefined) dbData.not_entry_date = student.notEntryDate === '' ? null : student.notEntryDate;
  if (student.masterMagusInitiationDate !== undefined) dbData.master_magus_initiation_date = student.masterMagusInitiationDate === '' ? null : student.masterMagusInitiationDate;
  if (student.isFounder !== undefined) dbData.is_founder = student.isFounder;
  if (student.isActive !== undefined) dbData.is_active = student.isActive;
  if (student.inactiveSince !== undefined) dbData.inactive_since = student.inactiveSince === '' ? null : student.inactiveSince;
  if (student.lastActivity !== undefined) dbData.last_activity = student.lastActivity === '' ? null : student.lastActivity;
  if (student.isAdmin !== undefined) dbData.is_admin = student.isAdmin;
  if (student.isGuest !== undefined) dbData.is_guest = student.isGuest;
  // Address fields
  if (student.street !== undefined) dbData.street = student.street || null;
  if (student.number !== undefined) dbData.number = student.number || null;
  if (student.complement !== undefined) dbData.complement = student.complement || null;
  if (student.neighborhood !== undefined) dbData.neighborhood = student.neighborhood || null;
  if (student.zipCode !== undefined) dbData.zip_code = student.zipCode || null;
  if (student.city !== undefined) dbData.city = student.city || null;
  if (student.state !== undefined) dbData.state = student.state || null;
  // Group/Class field
  if (student.turma !== undefined) dbData.turma = student.turma || null;
  // Invite and approval fields
  if (student.isPendingApproval !== undefined) dbData.is_pending_approval = student.isPendingApproval;
  if (student.inviteStatus !== undefined) dbData.invite_status = student.inviteStatus || null;
  if (student.inviteToken !== undefined) dbData.invite_token = student.inviteToken || null;
  if (student.invitedAt !== undefined) dbData.invited_at = student.invitedAt || null;
  if (student.invitedBy !== undefined) dbData.invited_by = student.invitedBy || null;
  return dbData;
};

const dbEventToEvent = (dbEvent: DatabaseEvent): Event => {
  // Determine event type and color from title if not explicitly set
  let eventType: keyof typeof EVENT_TYPES = 'outro';
  let eventColor = EVENT_TYPES.outro.color;
  
  // Try to match event title with event types
  const title = dbEvent.title.toLowerCase();
  for (const [key, type] of Object.entries(EVENT_TYPES)) {
    if (title.includes(type.label.toLowerCase()) || title === type.label.toLowerCase()) {
      eventType = key as keyof typeof EVENT_TYPES;
      eventColor = type.color;
      break;
    }
  }
  
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    date: dbEvent.date,
    time: dbEvent.time,
    description: dbEvent.description || '',
    location: dbEvent.location,
    unit: dbEvent.unit,
    attendees: [],
    type: eventType,
    color: eventColor,
    visibility: ['todos'],
    repetition: 'none'
  };
};

const eventToDbEvent = (event: Partial<Event>): Partial<DatabaseEvent> => {
  const dbData: Partial<DatabaseEvent> = {};
  if (event.title !== undefined) dbData.title = event.title;
  if (event.date !== undefined) dbData.date = event.date;
  if (event.time !== undefined) dbData.time = event.time;
  if (event.description !== undefined) dbData.description = event.description || null;
  if (event.location !== undefined) dbData.location = event.location;
  if (event.unit !== undefined) dbData.unit = event.unit;
  return dbData;
};

const dbAttendanceToAttendance = (dbAttendance: DatabaseAttendanceRecord): AttendanceRecord => ({
  id: dbAttendance.id,
  studentId: dbAttendance.student_id || '',
  date: dbAttendance.date,
  type: dbAttendance.type as 'development' | 'work' | 'monthly' | 'event',
  eventId: dbAttendance.event_id || undefined
});

// Turma conversion functions
const dbTurmaToTurma = (dbTurma: any, aulas: Aula[] = [], alunos: string[] = []): Turma => ({
  id: dbTurma.id,
  unit: dbTurma.unit,
  numero: dbTurma.numero,
  valor: parseFloat(dbTurma.valor),
  dataInicio: dbTurma.data_inicio,
  hora: dbTurma.hora,
  duracaoMeses: dbTurma.duracao_meses,
  status: dbTurma.status as 'planejada' | 'em-andamento' | 'encerrada',
  alunos,
  aulas,
  createdAt: dbTurma.created_at,
  updatedAt: dbTurma.updated_at
});

const turmaToDbTurma = (turma: Partial<Turma>) => ({
  unit: turma.unit,
  numero: turma.numero,
  valor: turma.valor,
  data_inicio: turma.dataInicio,
  hora: turma.hora,
  duracao_meses: turma.duracaoMeses,
  status: turma.status
});

const dbAulaToAula = (dbAula: any): Aula => ({
  id: dbAula.id,
  turmaId: dbAula.turma_id,
  data: dbAula.data,
  conteudo: dbAula.conteudo || '',
  realizada: dbAula.realizada,
  createdAt: dbAula.created_at
});

const aulaToDbAula = (aula: Partial<Aula>) => ({
  turma_id: aula.turmaId,
  data: aula.data,
  conteudo: aula.conteudo,
  realizada: aula.realizada
});

// Authentication - FIXED: Better error handling and student lookup
export const authenticateUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Attempting authentication for:', email);
    
    // Obter o cliente real do Supabase
    const client = await supabaseManager.getClient();
    
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase auth error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('invalid_credentials')) {
        throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
      } else if (error.message.includes('Too many requests')) {
        throw new Error('Muitas tentativas de login. Aguarde alguns minutos.');
      } else {
        throw new Error(`Erro de autenticação: ${error.message}`);
      }
    }

    if (!data.user) {
      throw new Error('Usuário não encontrado');
    }

    console.log('Authentication successful, looking up student data for:', email);

    // Get student data for the authenticated user
    const { data: studentData, error: studentError } = await client
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (studentError) {
      console.error('Error fetching student data:', studentError);
      
      if (studentError.code === 'PGRST116') {
        // No student found - this might be a valid auth user but not in students table
        console.log('No student record found for authenticated user:', email);
        
        // Check if this is the admin user that might not be in students table
        if (email === 'paularacy@gmail.com') {
          // Create admin user in students table if it doesn't exist
          try {
            const { data: newStudentData, error: createError } = await client
              .from('students')
              .insert({
                full_name: 'Paula Racy - Administrador Principal',
                birth_date: '1980-01-01',
                email: email,
                unit: 'SP',
                is_admin: true,
                is_active: true,
                is_guest: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating admin student record:', createError);
              throw new Error('Erro ao criar registro de administrador. Entre em contato com o suporte.');
            }

            console.log('Admin student record created successfully');
            const student = dbStudentToStudent(newStudentData);

            return {
              id: data.user.id,
              email: data.user.email || '',
              isAdmin: student.isAdmin,
              student,
              studentId: student.id
            };
          } catch (createError) {
            console.error('Failed to create admin student record:', createError);
            throw new Error('Usuário autenticado mas sem registro no sistema. Entre em contato com o administrador.');
          }
        } else {
          throw new Error('Usuário não encontrado no sistema. Entre em contato com o administrador.');
        }
      } else {
        throw new Error(`Erro ao buscar dados do usuário: ${studentError.message}`);
      }
    }

    console.log('Student data found:', studentData.full_name);

    // Get attendance records for this student
    const { data: attendanceData, error: attendanceError } = await client
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentData.id)
      .order('date', { ascending: false });

    if (attendanceError) {
      console.warn('Error fetching attendance data:', attendanceError);
      // Don't throw error, just continue without attendance data
    }

    const student = dbStudentToStudent(studentData);
    
    // Attach attendance records
    if (attendanceData) {
      student.attendance = attendanceData.map(dbAttendanceToAttendance);
    }

    console.log('Authentication completed successfully for:', student.fullName);

    return {
      id: data.user.id,
      email: data.user.email || '',
      isAdmin: student.isAdmin,
      student,
      studentId: student.id
    };
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    throw error;
  }
};

// Student operations
export const createStudent = async (student: Student): Promise<Student> => {
  try {
    // Check active session before inserting to avoid RLS error
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error checking user session:', userError);
      throw new Error('Erro ao verificar sessão do usuário. Faça login novamente.');
    }
    
    if (!userData?.user?.id) {
      throw new Error('Usuário não autenticado no momento do cadastro. Faça login novamente.');
    }

    console.log('Usuário autenticado (createStudent):', userData.user.id);

    const dbStudent = studentToDbStudent(student);
    const { data, error } = await supabase
      .from('students')
      .insert(dbStudent)
      .select()
      .single();

    if (error) {
      console.error('Error creating student:', error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.message.includes('students_email_key')) {
          throw new Error('Já existe um aluno com este email.');
        } else {
          throw new Error('Violação de restrição única no banco de dados.');
        }
      } else if (error.code === '42501') {
        throw new Error('Permissão negada. Verifique se você tem privilégios de administrador.');
      } else if (error.code === 'PGRST301') {
        throw new Error('Erro de permissão. Faça login novamente.');
      } else {
        throw new Error(`Erro ao criar aluno: ${error.message}`);
      }
    }

    return dbStudentToStudent(data);
  } catch (error) {
    console.error('Error in createStudent:', error);
    throw error;
  }
};

export const getStudents = async (): Promise<Student[]> => {
  try {
    console.log('Starting getStudents...');
    
    // Test connection first
    const { error: connectionError } = await supabase
      .from('students')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Connection test failed:', connectionError);
      throw new Error(`Erro de conexão com o banco de dados: ${connectionError.message}`);
    }

    console.log('Connection test passed, fetching students...');

    // First get all students
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('full_name');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw new Error(`Erro ao buscar alunos: ${studentsError.message}`);
    }

    console.log(`Fetched ${studentsData?.length || 0} students`);

    // Then get all attendance records
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      // Don't throw error for attendance, just log it
      console.warn('Continuing without attendance data');
    }

    // Map students and attach their attendance records
    const students = studentsData.map(dbStudent => {
      const student = dbStudentToStudent(dbStudent);
      
      // Attach attendance records for this student
      if (attendanceData) {
        student.attendance = attendanceData
          .filter(att => att.student_id === student.id)
          .map(dbAttendanceToAttendance);
      }
      
      return student;
    });

    console.log('getStudents completed successfully');
    return students;
  } catch (error) {
    console.error('Error in getStudents:', error);
    throw error;
  }
};

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<Student> => {
  try {
    const dbUpdates = studentToDbStudent(updates);
    const { data, error } = await supabase
      .from('students')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.message.includes('students_email_key')) {
          throw new Error('Já existe um aluno com este email.');
        } else {
          throw new Error('Violação de restrição única no banco de dados.');
        }
      } else {
        throw new Error(`Erro ao atualizar aluno: ${error.message}`);
      }
    }

    return dbStudentToStudent(data);
  } catch (error) {
    console.error('Error in updateStudent:', error);
    throw error;
  }
};

export const deleteStudent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting student:', error);
      throw new Error(`Erro ao deletar aluno: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    throw error;
  }
};

import { SITE_CONFIG } from '../config/site';

// Invite operations
export const sendStudentInvite = async (inviteData: InviteData): Promise<string> => {
  try {
    // Generate unique invite token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invite_token');

    if (tokenError) {
      throw new Error(`Erro ao gerar token: ${tokenError.message}`);
    }

    const inviteToken = tokenData;

    // Create student record with invite information
    const studentData: Partial<Student> = {
      fullName: inviteData.fullName,
      email: inviteData.email,
      unit: inviteData.unit,
      turma: inviteData.turma,
      turmaId: inviteData.turmaId,
      birthDate: '1900-01-01', // Use placeholder date for invites
      cpf: '',
      rg: '',
      phone: '',
      religion: '',
      isFounder: false,
      isActive: false, // Will be activated after approval
      isAdmin: false,
      isGuest: false,
      role: 'student',
      inviteStatus: 'pending',
      inviteToken,
      invitedAt: new Date().toISOString(),
      invitedBy: inviteData.invitedBy,
      isPendingApproval: false
    };

    await createStudent(studentData as Student);

    // Enviar email de convite
    const inviteUrl = `${window.location.origin || SITE_CONFIG.BASE_URL}${SITE_CONFIG.ROUTES.INVITE}/${inviteToken}`;
    
    try {
      // Tentar enviar email real
      await sendInviteEmail(inviteData.email, inviteUrl, inviteData.fullName);
      console.log(`Email de convite enviado com sucesso para ${inviteData.email}`);
    } catch (emailError) {
      // Em caso de erro, usar a simulação de email
      console.warn(`Erro ao enviar email real, usando simulação: ${emailError}`);
      simulateEmailSend(
        inviteData.email,
        'Convite - Nosso Templo',
        `Olá ${inviteData.fullName}, você foi convidado para o Nosso Templo. Acesse: ${inviteUrl}`
      );
    }

    return inviteToken;
  } catch (error) {
    console.error('Error sending invite:', error);
    throw error;
  }
};

export const validateInviteToken = async (token: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('is_invite_token_valid', { token });

    if (error) {
      throw new Error(`Erro ao validar token: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error validating invite token:', error);
    return false;
  }
};

export const acceptInvite = async (token: string, registrationData: StudentRegistrationData): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('accept_invite', { 
        token, 
        student_data: registrationData 
      });

    if (error) {
      throw new Error(`Erro ao aceitar convite: ${error.message}`);
    }

    return data.success;
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
};

// Event operations
export const getEvents = async (): Promise<Event[]> => {
  try {
    console.log('Starting getEvents...');
    
    // Test connection first
    const { error: connectionError } = await supabase
      .from('events')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Events connection test failed:', connectionError);
      throw new Error(`Erro de conexão com eventos: ${connectionError.message}`);
    }

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_attendees (
          student_id,
          students (
            id,
            full_name,
            email
          )
        )
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      throw new Error(`Erro ao buscar eventos: ${error.message}`);
    }

    console.log(`Fetched ${data?.length || 0} events`);

    return data.map(dbEvent => {
      const event = dbEventToEvent(dbEvent);
      event.attendees = dbEvent.event_attendees?.map((attendee: any) => attendee.students.id) || [];
      return event;
    });
  } catch (error) {
    console.error('Error in getEvents:', error);
    throw error;
  }
};

export const createEvent = async (event: Event): Promise<Event> => {
  try {
    console.log('Creating event:', event);
    
    const dbEvent = eventToDbEvent(event);
    console.log('Database event data:', dbEvent);
    
    const { data, error } = await supabase
      .from('events')
      .insert(dbEvent)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      
      // Handle specific database errors
      if (error.code === '23514') {
        // Check constraint violation - likely unit constraint
        if (error.message.includes('events_unit_check')) {
          throw new Error(`Unidade "${event.unit}" não é válida. Use apenas unidades cadastradas no sistema.`);
        }
      }
      
      throw new Error(`Erro ao criar evento: ${error.message}`);
    }

    console.log('Event created successfully:', data);
    return dbEventToEvent(data);
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event> => {
  try {
    const dbUpdates = eventToDbEvent(updates);
    const { data, error } = await supabase
      .from('events')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error(`Erro ao atualizar evento: ${error.message}`);
    }

    return dbEventToEvent(data);
  } catch (error) {
    console.error('Error in updateEvent:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw new Error(`Erro ao deletar evento: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    throw error;
  }
};

// Temple operations
export const getTemples = async (): Promise<Temple[]> => {
  try {
    console.log('Starting getTemples...');
    
    // Test connection first
    const { error: connectionError } = await supabase
      .from('temples')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Temples connection test failed:', connectionError);
      throw new Error(`Erro de conexão com templos: ${connectionError.message}`);
    }

    const { data, error } = await supabase
      .from('temples')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching temples:', error);
      throw new Error(`Erro ao buscar templos: ${error.message}`);
    }

    console.log(`Fetched ${data?.length || 0} temples`);

    return data.map(temple => ({
      id: temple.id,
      photo: temple.photo,
      name: temple.name,
      city: temple.city,
      abbreviation: temple.abbreviation,
      address: temple.address,
      founders: temple.founders || [],
      isActive: temple.is_active,
      createdAt: temple.created_at,
      updatedAt: temple.updated_at
    }));
  } catch (error) {
    console.error('Error in getTemples:', error);
    throw error;
  }
};

export const createTemple = async (temple: Temple): Promise<Temple> => {
  try {
    const { data, error } = await supabase
      .from('temples')
      .insert({
        id: temple.id,
        photo: temple.photo,
        name: temple.name,
        city: temple.city,
        abbreviation: temple.abbreviation,
        address: temple.address,
        founders: temple.founders,
        is_active: temple.isActive,
        created_at: temple.createdAt,
        updated_at: temple.updatedAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating temple:', error);
      throw new Error(`Erro ao criar templo: ${error.message}`);
    }

    return {
      id: data.id,
      photo: data.photo,
      name: data.name,
      city: data.city,
      abbreviation: data.abbreviation,
      address: data.address,
      founders: data.founders || [],
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in createTemple:', error);
    throw error;
  }
};

export const updateTemple = async (id: string, updates: Partial<Temple>): Promise<Temple> => {
  try {
    const dbUpdates: any = {};
    if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.abbreviation !== undefined) dbUpdates.abbreviation = updates.abbreviation;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.founders !== undefined) dbUpdates.founders = updates.founders;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

    const { data, error } = await supabase
      .from('temples')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating temple:', error);
      throw new Error(`Erro ao atualizar templo: ${error.message}`);
    }

    return {
      id: data.id,
      photo: data.photo,
      name: data.name,
      city: data.city,
      abbreviation: data.abbreviation,
      address: data.address,
      founders: data.founders || [],
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in updateTemple:', error);
    throw error;
  }
};

export const deleteTemple = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('temples')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting temple:', error);
      throw new Error(`Erro ao deletar templo: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteTemple:', error);
    throw error;
  }
};

// Turma operations
export const getTurmas = async (): Promise<Turma[]> => {
  try {
    console.log('Starting getTurmas...');
    
    // Test connection first
    const { error: connectionError } = await supabase
      .from('turmas')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Turmas connection test failed:', connectionError);
      throw new Error(`Erro de conexão com turmas: ${connectionError.message}`);
    }

    console.log('Connection test passed, fetching turmas...');

    const { data: turmasData, error: turmasError } = await supabase
      .from('turmas')
      .select('*')
      .order('unit', { ascending: true })
      .order('numero', { ascending: true });

    if (turmasError) {
      console.error('Error fetching turmas:', turmasError);
      throw new Error(`Erro ao buscar turmas: ${turmasError.message}`);
    }

    console.log(`Fetched ${turmasData?.length || 0} turmas`);

    // Get aulas for all turmas
    const { data: aulasData, error: aulasError } = await supabase
      .from('aulas')
      .select('*')
      .order('data', { ascending: true });

    if (aulasError) {
      console.error('Error fetching aulas:', aulasError);
      // Continue without aulas data
    }

    // Get turma-alunos relationships
    const { data: turmaAlunosData, error: turmaAlunosError } = await supabase
      .from('turma_alunos')
      .select('*');

    if (turmaAlunosError) {
      console.error('Error fetching turma-alunos:', turmaAlunosError);
      // Continue without turma-alunos data
    }

    const result = turmasData.map(dbTurma => {
      const aulas = aulasData 
        ? aulasData.filter(aula => aula.turma_id === dbTurma.id).map(dbAulaToAula)
        : [];
      
      const alunos = turmaAlunosData
        ? turmaAlunosData.filter(ta => ta.turma_id === dbTurma.id).map(ta => ta.student_id)
        : [];

      return dbTurmaToTurma(dbTurma, aulas, alunos);
    });

    console.log('getTurmas completed successfully');
    return result;
  } catch (error) {
    console.error('Error in getTurmas:', error);
    throw error;
  }
};

export const createTurma = async (turma: Turma): Promise<Turma> => {
  try {
    const dbTurma = turmaToDbTurma(turma);
    const { data, error } = await supabase
      .from('turmas')
      .insert(dbTurma)
      .select()
      .single();

    if (error) {
      console.error('Error creating turma:', error);
      throw new Error(`Erro ao criar turma: ${error.message}`);
    }

    return dbTurmaToTurma(data, [], []);
  } catch (error) {
    console.error('Error in createTurma:', error);
    throw error;
  }
};

export const updateTurma = async (id: string, updates: Partial<Turma>): Promise<Turma> => {
  try {
    const dbUpdates = turmaToDbTurma(updates);
    const { data, error } = await supabase
      .from('turmas')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating turma:', error);
      throw new Error(`Erro ao atualizar turma: ${error.message}`);
    }

    return dbTurmaToTurma(data, [], []);
  } catch (error) {
    console.error('Error in updateTurma:', error);
    throw error;
  }
};

export const deleteTurma = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting turma:', error);
      throw new Error(`Erro ao deletar turma: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteTurma:', error);
    throw error;
  }
};

// Aula operations
export const createAula = async (aula: Aula): Promise<Aula> => {
  try {
    const dbAula = aulaToDbAula(aula);
    const { data, error } = await supabase
      .from('aulas')
      .insert(dbAula)
      .select()
      .single();

    if (error) {
      console.error('Error creating aula:', error);
      throw new Error(`Erro ao criar aula: ${error.message}`);
    }

    return dbAulaToAula(data);
  } catch (error) {
    console.error('Error in createAula:', error);
    throw error;
  }
};

export const updateAula = async (id: string, updates: Partial<Aula>): Promise<Aula> => {
  try {
    const dbUpdates = aulaToDbAula(updates);
    const { data, error } = await supabase
      .from('aulas')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating aula:', error);
      throw new Error(`Erro ao atualizar aula: ${error.message}`);
    }

    return dbAulaToAula(data);
  } catch (error) {
    console.error('Error in updateAula:', error);
    throw error;
  }
};

export const deleteAula = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('aulas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting aula:', error);
      throw new Error(`Erro ao deletar aula: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteAula:', error);
    throw error;
  }
};

// Turma-Aluno relationship operations
export const addStudentToTurma = async (turmaId: string, studentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('turma_alunos')
      .insert({
        turma_id: turmaId,
        student_id: studentId
      });

    if (error) {
      console.error('Error adding student to turma:', error);
      throw new Error(`Erro ao adicionar aluno à turma: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in addStudentToTurma:', error);
    throw error;
  }
};

export const removeStudentFromTurma = async (turmaId: string, studentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('turma_alunos')
      .delete()
      .eq('turma_id', turmaId)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error removing student from turma:', error);
      throw new Error(`Erro ao remover aluno da turma: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in removeStudentFromTurma:', error);
    throw error;
  }
};

// Attendance operations - FIXED: Proper error handling and data consistency
export const markAttendance = async (studentId: string, date: string, type: 'development' | 'work' | 'monthly' | 'event', eventId?: string): Promise<AttendanceRecord> => {
  try {
    console.log('markAttendance called with:', { studentId, date, type, eventId });

    // Check if attendance already exists to prevent duplicates
    const { data: existingAttendance, error: checkError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('type', type)
      .eq('event_id', eventId || null)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing attendance:', checkError);
      throw new Error(`Erro ao verificar presença existente: ${checkError.message}`);
    }

    if (existingAttendance) {
      console.log('Attendance already exists, returning existing record');
      return {
        id: existingAttendance.id,
        studentId,
        date,
        type,
        eventId
      };
    }

    const attendanceData = {
      student_id: studentId,
      date,
      type,
      event_id: eventId || null
    };

    console.log('Inserting attendance record:', attendanceData);

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceData)
      .select()
      .single();

    if (error) {
      console.error('Error marking attendance:', error);
      throw new Error(`Erro ao marcar presença: ${error.message}`);
    }

    console.log('Attendance record created:', data);

    // If it's an event attendance, also add to event_attendees
    if (type === 'event' && eventId) {
      console.log('Adding to event_attendees table');
      
      const { error: attendeeError } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          student_id: studentId
        });

      if (attendeeError && !attendeeError.message.includes('duplicate')) {
        console.error('Error adding event attendee:', attendeeError);
        // Don't throw error here, attendance was already marked
      } else {
        console.log('Successfully added to event_attendees');
      }
    }

    return dbAttendanceToAttendance(data);
  } catch (error) {
    console.error('Error in markAttendance:', error);
    throw error;
  }
};

export const removeAttendance = async (studentId: string, date: string, type: string): Promise<void> => {
  try {
    console.log('removeAttendance called with:', { studentId, date, type });

    // Remove from attendance_records
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('type', type);

    if (error) {
      console.error('Error removing attendance:', error);
      throw new Error(`Erro ao remover presença: ${error.message}`);
    }

    console.log('Attendance removed successfully');
  } catch (error) {
    console.error('Error in removeAttendance:', error);
    throw error;
  }
};

export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance records:', error);
      throw new Error(`Erro ao buscar registros de presença: ${error.message}`);
    }

    return data.map(dbAttendanceToAttendance);
  } catch (error) {
    console.error('Error in getAttendanceRecords:', error);
    throw error;
  }
};