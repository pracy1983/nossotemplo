import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { ImportForm } from '../../components/ImportForm';
import { ImportPreview } from '../../components/ImportPreview';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import type { StudentImport } from '../../types';

export function ImportStudents() {
  const [students, setStudents] = useState<StudentImport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async (mappedStudents: StudentImport[]) => {
    setIsLoading(true);
    try {
      // First check if we're logged in and admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Você precisa estar logado para importar alunos');

      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        throw new Error('Apenas administradores podem importar alunos');
      }

      // Insert students in batches of 50
      const batchSize = 50;
      for (let i = 0; i < mappedStudents.length; i += batchSize) {
        const batch = mappedStudents.slice(i, i + batchSize);
        const { error } = await supabase.from('users').insert(
          batch.map(student => ({
            ...student,
            email: student.email || `${student.full_name.toLowerCase().replace(/\s+/g, '.')}@nossotemplo.com`,
            unit: student.unit || 'Templo SP',
            is_active: true,
            created_at: new Date().toISOString()
          }))
        );

        if (error) throw error;
      }

      toast.success('Alunos importados com sucesso!');
      setStudents([]);
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar alunos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Importar Alunos</h1>
        </div>

        <ImportForm onDataReceived={setStudents} />

        {students.length > 0 && (
          <ImportPreview 
            students={students} 
            onImport={handleImport}
            isLoading={isLoading}
          />
        )}
      </div>
    </AdminLayout>
  );
}