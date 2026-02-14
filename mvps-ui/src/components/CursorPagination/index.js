import React from 'react';
import './CursorPagination.css';

/**
 * Cursor Pagination Component
 * Provides Next/Previous navigation for cursor-based pagination
 */
const CursorPagination = ({
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  loading,
  itemCount,
  entityLabel
}) => {
  if (itemCount === 0 && !loading) {
    return null;
  }

  return (
    <div className="cursor-pagination-bar">
      <div className="cursor-pagination-summary">
        <span>
          {itemCount} {entityLabel} {itemCount === 1 ? '' : ''} {loading ? '(loading...)' : 'loaded'}
        </span>
      </div>
      <div className="cursor-pagination-controls">
        <button
          type="button"
          className="page-button"
          disabled={!hasPrevious || loading}
          onClick={onPrevious}
          title="Go to previous page"
        >
          Previous
        </button>
        <button
          type="button"
          className="page-button"
          disabled={!hasNext || loading}
          onClick={onNext}
          title="Go to next page"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CursorPagination;
