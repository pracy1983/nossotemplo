import React from 'react';
import { Search } from 'lucide-react';

interface StudentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  unit: string;
  onUnitChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export function StudentFilters({
  search,
  onSearchChange,
  unit,
  onUnitChange,
  status,
  onStatusChange,
  view,
  onViewChange,
}: StudentFiltersProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar alunos..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Unit Filter */}
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Todas as Unidades</option>
          <option value="Templo SP">Templo SP</option>
          <option value="Templo BH">Templo BH</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>

        {/* View Toggle */}
        <div className="flex rounded-lg overflow-hidden">
          <button
            onClick={() => onViewChange('grid')}
            className={`px-4 py-2 ${
              view === 'grid' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`px-4 py-2 ${
              view === 'list' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            Lista
          </button>
        </div>
      </div>
    </div>
  );
}