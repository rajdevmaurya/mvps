import { useMemo } from 'react';
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

  const pageNumbers = useMemo(() => {
    if (!totalItems || totalPages <= 1) {
      return [];
    }

    // Show all pages if 7 or fewer
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Build page numbers with ellipsis for larger page counts
    const pages = [];
    pages.push(1);

    if (page > 3) {
      pages.push('...');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  }, [page, totalPages, totalItems]);

  const start = (page - 1) * safePageSize + 1;
  const end = Math.min(page * safePageSize, totalItems);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    onPageChange(newPage);
  };

  if (!totalItems || totalPages <= 1 || pageNumbers.length === 0) {
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

        {pageNumbers.map((item, index) =>
          item === '...' ? (
            <span key={`ellipsis-${index}`} className="page-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === page ? 'page-number active' : 'page-number'}
              onClick={() => handlePageChange(item)}
            >
              {item}
            </button>
          )
        )}

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
