import { useState, useCallback } from 'react';

/**
 * Custom hook for managing cursor-based pagination state
 *
 * @param {number} initialPageSize - Initial page size (default: 20)
 * @returns {Object} Pagination state and controls
 */
export const useCursorPagination = (initialPageSize = 20) => {
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [cursorHistory, setCursorHistory] = useState([]); // Stack for previous cursors
  const [pageSize] = useState(initialPageSize);

  /**
   * Navigate to the next page
   */
  const goToNext = useCallback(() => {
    if (!hasNext || !nextCursor) return;

    // Push current cursor to history for back navigation
    setCursorHistory((prev) => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
  }, [hasNext, nextCursor, currentCursor]);

  /**
   * Navigate to the previous page
   */
  const goToPrevious = useCallback(() => {
    if (cursorHistory.length === 0) return;

    // Pop previous cursor from history
    const previousCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((prev) => prev.slice(0, -1));
    setCurrentCursor(previousCursor);
  }, [cursorHistory]);

  /**
   * Update pagination info from API response
   *
   * @param {Object} response - API response with nextCursor and hasNext
   */
  const updatePaginationInfo = useCallback((response) => {
    setNextCursor(response.nextCursor || null);
    setHasNext(response.hasNext || false);
  }, []);

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setCurrentCursor(null);
    setNextCursor(null);
    setHasNext(false);
    setCursorHistory([]);
  }, []);

  return {
    currentCursor,
    nextCursor,
    hasNext,
    hasPrevious: cursorHistory.length > 0,
    pageSize,
    goToNext,
    goToPrevious,
    updatePaginationInfo,
    reset
  };
};

export default useCursorPagination;
