'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

import { manualService } from '@/services/manualService';
import { Manual, SearchFilters, ManualStatus, CreateManualForm } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Components (will be created later)
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ManualCard from '@/components/manuals/ManualCard';
import SearchBar from '@/components/common/SearchBar';
import FilterPanel from '@/components/common/FilterPanel';
import CreateManualModal from '@/components/modals/CreateManualModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    tags: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [uiFilters, setUiFilters] = useState({
    status: '' as ManualStatus | '',
    tags: [] as string[],
    dateRange: {
      start: '',
      end: '',
    },
  });

  // Fetch manuals
  const {
    data: manualsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['manuals', currentPage, pageSize, filters],
    queryFn: () => manualService.getManuals(currentPage, pageSize, filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch recent manuals for sidebar
  const { data: recentManuals } = useQuery({
    queryKey: ['manuals', 'recent'],
    queryFn: () => manualService.getRecentManuals(5),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
    setCurrentPage(1);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newUiFilters: typeof uiFilters) => {
    setUiFilters(newUiFilters);
    
    // Convert UI filters to SearchFilters format
     const searchFilters: Partial<SearchFilters> = {
       status: newUiFilters.status ? [newUiFilters.status] : [],
       tags: newUiFilters.tags,
       ...(newUiFilters.dateRange.start && { dateFrom: new Date(newUiFilters.dateRange.start) }),
       ...(newUiFilters.dateRange.end && { dateTo: new Date(newUiFilters.dateRange.end) }),
     };
    
    setFilters(prev => ({ ...prev, ...searchFilters }));
    setCurrentPage(1);
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle manual creation success
  const handleManualCreated = () => {
    setShowCreateModal(false);
    refetch();
    toast.success('Manual criado com sucesso!');
  };

  // Show error if fetch failed
  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar manuais');
    }
  }, [error]);

  const manuals = manualsData?.data || [];
  const pagination = manualsData?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onCreateClick={() => setShowCreateModal(true)}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          recentManuals={recentManuals || []}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
             onSearch={handleSearch}
             placeholder="Pesquisar manuais..."
             initialValue={filters.query || ''}
           />
              </div>
              <div className="lg:w-80">
                <FilterPanel
                   isOpen={isFilterOpen}
                   onClose={() => setIsFilterOpen(false)}
                   filters={uiFilters}
                   onFiltersChange={handleFilterChange}
                   availableTags={[]}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : manuals.length === 0 ? (
            <EmptyState
              title="Nenhum manual encontrado"
              description="Crie seu primeiro manual ou ajuste os filtros de pesquisa."
              actionLabel="Criar Manual"
              onAction={() => setShowCreateModal(true)}
            />
          ) : (
            <>
              {/* Manuals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {manuals.map((manual: Manual) => (
                  <ManualCard
                    key={manual.id}
                    manual={manual}
                    onUpdate={refetch}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    showInfo
                    totalItems={pagination.total}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Manual Modal */}
      {showCreateModal && (
        <CreateManualModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data: CreateManualForm) => {
            try {
              await manualService.createManual(data);
              toast.success('Manual criado com sucesso!');
              setShowCreateModal(false);
              refetch();
            } catch (error) {
              toast.error('Erro ao criar manual');
            }
          }}
        />
      )}
    </div>
  );
}