import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Calendar, Users, Activity } from 'lucide-react';

export function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total de Alunos</p>
                <p className="text-2xl font-bold">120</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Eventos este Mês</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Taxa de Atividade</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <Activity className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Calendar Preview */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Eventos do Mês</h2>
          <div className="grid grid-cols-7 gap-2">
            {/* Calendar header */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-gray-400 text-sm py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center relative"
              >
                <span className="text-sm">{i + 1}</span>
                {/* Event indicators */}
                <div className="absolute bottom-1 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Desenvolvimento" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Trabalho" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Mensalidade" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Evento" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <span className="text-sm text-gray-400">Desenvolvimento</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 mr-2" />
              <span className="text-sm text-gray-400">Trabalho</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span className="text-sm text-gray-400">Mensalidade</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
              <span className="text-sm text-gray-400">Evento</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}