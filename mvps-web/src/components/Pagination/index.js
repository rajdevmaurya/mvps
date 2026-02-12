import React, { useMemo } from 'react';
import './Pagination.css';

const Pagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  entityLabel,
  onPageChange,
}) => {
  const safePageSize = pageSize && pageSize > 0 ? pageSize : 10;

  const visiblePageNumbers = useMemo(() => {
    if (!totalItems || totalPages <= 1) {
      return [];
    }

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set();
    pages.add(1);
    const prev = page - 1;
    const next = page + 1;

    if (prev > 1 && prev < totalPages) {
      pages.add(prev);
    }

    if (page > 1 && page < totalPages) {
      pages.add(page);
    }

    if (next > 1 && next < totalPages) {
      pages.add(next);
    }

    pages.add(totalPages);

    return Array.from(pages).sort((a, b) => a - b);
  }, [page, totalPages, totalItems]);

  const start = (page - 1) * safePageSize + 1;
  const end = Math.min(page * safePageSize, totalItems);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    onPageChange(newPage);
  };

  if (!totalItems || totalPages <= 1 || visiblePageNumbers.length === 0) {
    return null;
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-summary">
        <span>
          Showing {start} - {end} of {totalItems} {entityLabel}
        </span>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-button"
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
        >
          Previous
        </button>

        {visiblePageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={
              pageNumber === page ? 'page-number active' : 'page-number'
            }
            onClick={() => handlePageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          className="page-button"
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
