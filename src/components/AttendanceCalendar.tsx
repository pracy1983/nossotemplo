import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface AttendanceCalendarProps {
  userId: string;
}

interface Attendance {
  id: string;
  date: string;
  type: 'development' | 'work' | 'monthly' | 'event';
}

export function AttendanceCalendar({ userId }: AttendanceCalendarProps) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    fetchAttendance();
  }, [userId]);

  async function fetchAttendance() {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  const getAttendanceTypes = (date: Date) => {
    return attendance
      .filter(a => format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
      .map(a => a.type);
  };

  const getEventDot = (type: string) => {
    const colors = {
      development: 'bg-yellow-500',
      work: 'bg-blue-400',
      monthly: 'bg-green-500',
      event: 'bg-purple-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold">
          {format(today, 'MMMM yyyy', { locale: ptBR })}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm text-gray-400 py-2">
            {day}
          </div>
        ))}

        {days.map(day => {
          const dayAttendance = getAttendanceTypes(day);
          const isCurrentMonth = isSameMonth(day, today);
          
          return (
            <div
              key={day.toString()}
              className={`
                aspect-square p-2 rounded-lg relative
                ${isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900'}
                ${isToday(day) ? 'ring-2 ring-red-500' : ''}
              `}
            >
              <span className={`
                text-sm
                ${isCurrentMonth ? 'text-white' : 'text-gray-500'}
              `}>
                {format(day, 'd')}
              </span>
              
              {dayAttendance.length > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {dayAttendance.map((type, index) => (
                    <div
                      key={`${day}-${type}-${index}`}
                      className={`w-1.5 h-1.5 rounded-full ${getEventDot(type)}`}
                      title={type}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
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
  );
}