'use client';

import React from 'react';
import { Manual, ManualStatus } from '@/types';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ManualCardProps {
  manual: Manual;
  onUpdate: () => void;
}

const ManualCard: React.FC<ManualCardProps> = ({ manual, onUpdate }) => {
  const getStatusIcon = (status: ManualStatus) => {
    switch (status) {
      case ManualStatus.COMPLETED:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case ManualStatus.GENERATING:
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case ManualStatus.ERROR:
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: ManualStatus) => {
    switch (status) {
      case ManualStatus.COMPLETED:
        return 'Concluído';
      case ManualStatus.GENERATING:
        return 'Gerando...';
      case ManualStatus.ERROR:
        return 'Erro';
      default:
        return 'Rascunho';
    }
  };

  const getStatusColor = (status: ManualStatus) => {
    switch (status) {
      case ManualStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ManualStatus.GENERATING:
        return 'bg-blue-100 text-blue-800';
      case ManualStatus.ERROR:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = () => {
    window.open(`/manuals/${manual.id}`, '_blank');
  };

  const handleEdit = () => {
    window.open(`/manuals/${manual.id}/edit`, '_blank');
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este manual?')) {
      try {
        // TODO: Implement delete functionality
        console.log('Delete manual:', manual.id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting manual:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {manual.title}
            </h3>
            {manual.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {manual.description}
              </p>
            )}
          </div>
          <div className="ml-4 flex items-center">
            {getStatusIcon(manual.status)}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(manual.status)}`}>
            {getStatusText(manual.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* URL */}
        <div className="mb-3">
          <p className="text-sm text-gray-500 truncate">
            <span className="font-medium">URL:</span> {manual.url}
          </p>
        </div>

        {/* Tags */}
        {manual.tags && manual.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {manual.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag.tag.name}
                </span>
              ))}
              {manual.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{manual.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <span className="font-medium">Criado:</span>{' '}
            {formatDistanceToNow(new Date(manual.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
          <p>
            <span className="font-medium">Autor:</span> {manual.author.name}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
        <button
          onClick={handleView}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={manual.status !== ManualStatus.COMPLETED}
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          Ver
        </button>
        <button
          onClick={handleEdit}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Editar
        </button>
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Excluir
        </button>
      </div>
    </div>
  );
};

export default ManualCard;