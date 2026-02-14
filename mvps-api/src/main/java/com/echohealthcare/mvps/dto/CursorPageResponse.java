package com.echohealthcare.mvps.dto;

import java.util.List;

/**
 * Generic response wrapper for cursor-based pagination.
 * Provides next cursor and hasNext flag for efficient forward navigation.
 *
 * @param <T> The type of data contained in the response
 */
public record CursorPageResponse<T>(
    List<T> data,          // The items in the current page
    int pageSize,          // Size of the page
    String nextCursor,     // Cursor for the next page (null if no more pages)
    boolean hasNext        // Indicates if more pages exist
) {}
