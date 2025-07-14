import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Event, Temple, Turma, Aula } from '../types';
import * as db from '../services/database';

interface DataContextType {
  students: Student[];
  events: Event[];
  temples: Temple[];
  turmas: Turma[];
  loading: boolean;
  error: string | null;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  addEvent: (event: Event) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addTemple: (temple: Temple) => Promise<void>;
  updateTemple: (id: string, updates: Partial<Temple>) => Promise<void>;
  deleteTemple: (id: string) => Promise<void>;
  addTurma: (turma: Turma) => Promise<void>;
  updateTurma: (id: string, updates: Partial<Turma>) => Promise<void>;
  deleteTurma: (id: string) => Promise<void>;
  addAula: (aula: Aula) => Promise<void>;
  updateAula: (id: string, updates: Partial<Aula>) => Promise<void>;
  deleteAula: (id: string) => Promise<void>;
  markAttendance: (studentId: string, date: string, type: string, eventId?: string) => Promise<void>;
  removeAttendance: (studentId: string, date: string, type: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting data refresh...');
      
      // Load data sequentially to better handle errors
      let studentsData: Student[] = [];
      let eventsData: Event[] = [];
      let templesData: Temple[] = [];
      let turmasData: Turma[] = [];

      try {
        console.log('Fetching students...');
        studentsData = await db.getStudents();
        console.log('Students fetched successfully:', studentsData.length);
      } catch (error: any) {
        console.error('Error fetching students:', error);
        throw new Error(`Erro ao carregar alunos: ${error.message}`);
      }

      try {
        console.log('Fetching events...');
        eventsData = await db.getEvents();
        console.log('Events fetched successfully:', eventsData.length);
      } catch (error: any) {
        console.error('Error fetching events:', error);
        throw new Error(`Erro ao carregar eventos: ${error.message}`);
      }

      try {
        console.log('Fetching temples...');
        templesData = await db.getTemples();
        console.log('Temples fetched successfully:', templesData.length);
      } catch (error: any) {
        console.error('Error fetching temples:', error);
        throw new Error(`Erro ao carregar templos: ${error.message}`);
      }

      try {
        console.log('Fetching turmas...');
        turmasData = await db.getTurmas();
        console.log('Turmas fetched successfully:', turmasData.length);
      } catch (error: any) {
        console.error('Error fetching turmas:', error);
        throw new Error(`Erro ao carregar turmas: ${error.message}`);
      }
      
      setStudents(studentsData);
      setEvents(eventsData);
      setTemples(templesData);
      setTurmas(turmasData);
      
      console.log('Data refresh completed successfully');
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Erro ao carregar dados');
      
      // Set empty arrays to prevent app crash
      setStudents([]);
      setEvents([]);
      setTemples([]);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure Supabase client is properly initialized
    const timer = setTimeout(() => {
      refreshData();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const addStudent = async (student: Student) => {
    try {
      const newStudent = await db.createStudent(student);
      setStudents(prev => [...prev, newStudent]);
    } catch (error: any) {
      console.error('Error adding student:', error);
      throw new Error(error.message || 'Erro ao adicionar aluno');
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      console.log('DataContext - updateStudent - Iniciando atualização do estudante:', id);
      
      // Chamar a função de atualização no banco de dados
      await db.updateStudent(id, updates);
      console.log('DataContext - updateStudent - Atualização enviada ao banco de dados');
      
      // Forçar uma nova busca direta do estudante para garantir dados atualizados
      console.log('DataContext - updateStudent - Forçando nova busca do estudante para garantir dados atualizados');
      const freshStudent = await db.getStudentById(id);
      console.log('DataContext - updateStudent - Dados frescos obtidos diretamente do banco:', JSON.stringify(freshStudent, null, 2));
      
      // Atualizar o estado com o objeto completo retornado pelo banco de dados
      setStudents(prev => {
        const newStudents = prev.map(student => 
          student.id === id ? freshStudent : student
        );
        console.log('DataContext - updateStudent - Lista de estudantes atualizada com dados frescos');
        return newStudents;
      });
      
      console.log('DataContext - updateStudent - Estado atualizado com sucesso');
      return freshStudent; // Retornar os dados mais recentes
    } catch (error: any) {
      console.error('Error updating student:', error);
      throw new Error(error.message || 'Erro ao atualizar aluno');
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await db.deleteStudent(id);
      setStudents(prev => prev.filter(student => student.id !== id));
    } catch (error: any) {
      console.error('Error deleting student:', error);
      throw new Error(error.message || 'Erro ao excluir aluno');
    }
  };

  const addEvent = async (event: Event) => {
    try {
      const newEvent = await db.createEvent(event);
      setEvents(prev => [...prev, newEvent]);
    } catch (error: any) {
      console.error('Error adding event:', error);
      throw new Error(error.message || 'Erro ao adicionar evento');
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      await db.updateEvent(id, updates);
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ));
    } catch (error: any) {
      console.error('Error updating event:', error);
      throw new Error(error.message || 'Erro ao atualizar evento');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await db.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (error: any) {
      console.error('Error deleting event:', error);
      throw new Error(error.message || 'Erro ao excluir evento');
    }
  };

  const addTemple = async (temple: Temple) => {
    try {
      const newTemple = await db.createTemple(temple);
      setTemples(prev => [...prev, newTemple]);
    } catch (error: any) {
      console.error('Error adding temple:', error);
      throw new Error(error.message || 'Erro ao adicionar templo');
    }
  };

  const updateTemple = async (id: string, updates: Partial<Temple>) => {
    try {
      await db.updateTemple(id, updates);
      setTemples(prev => prev.map(temple => 
        temple.id === id ? { ...temple, ...updates } : temple
      ));
    } catch (error: any) {
      console.error('Error updating temple:', error);
      throw new Error(error.message || 'Erro ao atualizar templo');
    }
  };

  const deleteTemple = async (id: string) => {
    try {
      await db.deleteTemple(id);
      setTemples(prev => prev.filter(temple => temple.id !== id));
    } catch (error: any) {
      console.error('Error deleting temple:', error);
      throw new Error(error.message || 'Erro ao excluir templo');
    }
  };

  const addTurma = async (turma: Turma) => {
    try {
      const newTurma = await db.createTurma(turma);
      setTurmas(prev => [...prev, newTurma]);
    } catch (error: any) {
      console.error('Error adding turma:', error);
      throw new Error(error.message || 'Erro ao adicionar turma');
    }
  };

  const updateTurma = async (id: string, updates: Partial<Turma>) => {
    try {
      await db.updateTurma(id, updates);
      setTurmas(prev => prev.map(turma => 
        turma.id === id ? { ...turma, ...updates } : turma
      ));
    } catch (error: any) {
      console.error('Error updating turma:', error);
      throw new Error(error.message || 'Erro ao atualizar turma');
    }
  };

  const deleteTurma = async (id: string) => {
    try {
      await db.deleteTurma(id);
      setTurmas(prev => prev.filter(turma => turma.id !== id));
    } catch (error: any) {
      console.error('Error deleting turma:', error);
      throw new Error(error.message || 'Erro ao excluir turma');
    }
  };

  const addAula = async (aula: Aula) => {
    try {
      const newAula = await db.createAula(aula);
      setTurmas(prev => prev.map(turma => 
        turma.id === aula.turmaId 
          ? { ...turma, aulas: [...turma.aulas, newAula] }
          : turma
      ));
    } catch (error: any) {
      console.error('Error adding aula:', error);
      throw new Error(error.message || 'Erro ao adicionar aula');
    }
  };

  const updateAula = async (id: string, updates: Partial<Aula>) => {
    try {
      const updatedAula = await db.updateAula(id, updates);
      setTurmas(prev => prev.map(turma => ({
        ...turma,
        aulas: turma.aulas.map(aula => 
          aula.id === id ? updatedAula : aula
        )
      })));
    } catch (error: any) {
      console.error('Error updating aula:', error);
      throw new Error(error.message || 'Erro ao atualizar aula');
    }
  };

  const deleteAula = async (id: string) => {
    try {
      await db.deleteAula(id);
      setTurmas(prev => prev.map(turma => ({
        ...turma,
        aulas: turma.aulas.filter(aula => aula.id !== id)
      })));
    } catch (error: any) {
      console.error('Error deleting aula:', error);
      throw new Error(error.message || 'Erro ao excluir aula');
    }
  };

  const markAttendance = async (studentId: string, date: string, type: string, eventId?: string) => {
    try {
      console.log('DataContext markAttendance called:', { studentId, date, type, eventId });
      
      // Call the database function
      await db.markAttendance(studentId, date, type as any, eventId);
      
      // Update local state immediately for better UX
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          // Check if attendance already exists
          const existingAttendance = student.attendance.find(att => 
            att.date === date && att.type === type && att.eventId === eventId
          );
          
          if (!existingAttendance) {
            return {
              ...student,
              attendance: [...student.attendance, {
                id: `temp-${Date.now()}`,
                studentId,
                date,
                type: type as any,
                eventId
              }]
            };
          }
        }
        return student;
      }));
      
      console.log('Attendance marked successfully in DataContext');
    } catch (error: any) {
      console.error('Error marking attendance in DataContext:', error);
      throw new Error(error.message || 'Erro ao marcar presença');
    }
  };

  const removeAttendance = async (studentId: string, date: string, type: string) => {
    try {
      await db.removeAttendance(studentId, date, type);
      
      // Update local state
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            attendance: student.attendance.filter(att => 
              !(att.date === date && att.type === type)
            )
          };
        }
        return student;
      }));
    } catch (error: any) {
      console.error('Error removing attendance:', error);
      throw new Error(error.message || 'Erro ao remover presença');
    }
  };

  return (
    <DataContext.Provider value={{
      students,
      events,
      temples,
      turmas,
      loading,
      error,
      addStudent,
      updateStudent,
      deleteStudent,
      addEvent,
      updateEvent,
      deleteEvent,
      addTemple,
      updateTemple,
      deleteTemple,
      addTurma,
      updateTurma,
      deleteTurma,
      addAula,
      updateAula,
      deleteAula,
      markAttendance,
      removeAttendance,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};