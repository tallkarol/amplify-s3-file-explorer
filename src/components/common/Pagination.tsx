// src/components/common/Pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
  showNumbers?: boolean;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showFirstLast = true,
  showNumbers = true,
  maxVisiblePages = 5
}) => {
  if (totalPages <= 1) return null;

  // Calculate which page numbers to show
  const getVisiblePageNumbers = (): number[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Complex logic for showing a window of pages around the current page
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const visiblePages = getVisiblePageNumbers();

  return (
    <nav aria-label="Pagination" className={className}>
      <ul className="pagination justify-content-center">
        {/* First Page Button */}
        {showFirstLast && (
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              aria-label="First Page"
            >
              <span aria-hidden="true">&laquo;&laquo;</span>
            </button>
          </li>
        )}

        {/* Previous Button */}
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>

        {/* Page Numbers */}
        {showNumbers && visiblePages.map(page => (
          <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </li>
        ))}

        {/* Next Button */}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>

        {/* Last Page Button */}
        {showFirstLast && (
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last Page"
            >
              <span aria-hidden="true">&raquo;&raquo;</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;