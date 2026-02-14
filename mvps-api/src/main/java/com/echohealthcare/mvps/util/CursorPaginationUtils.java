package com.echohealthcare.mvps.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Utility class for cursor-based pagination parameter validation and encoding.
 * Provides methods for cursor encoding/decoding and page size validation.
 */
public class CursorPaginationUtils {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MIN_PAGE_SIZE = 1;
    private static final int MAX_PAGE_SIZE = 100;

    /**
     * Validates and normalizes the page size parameter for cursor pagination.
     * Returns a value between MIN_PAGE_SIZE and MAX_PAGE_SIZE.
     *
     * @param size the requested page size (can be null)
     * @return validated page size between 1 and 100
     */
    public static int validatePageSize(Integer size) {
        if (size == null) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.max(MIN_PAGE_SIZE, Math.min(size, MAX_PAGE_SIZE));
    }

    /**
     * Encodes an integer cursor value to a Base64 string.
     * Returns null if the cursor is null.
     *
     * @param cursor the cursor value to encode
     * @return Base64-encoded cursor string, or null if cursor is null
     */
    public static String encodeCursor(Integer cursor) {
        if (cursor == null) {
            return null;
        }
        String cursorString = String.valueOf(cursor);
        return Base64.getEncoder().encodeToString(cursorString.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Decodes a Base64-encoded cursor string to an integer value.
     * Returns null if the cursor string is null or invalid.
     *
     * @param encodedCursor the Base64-encoded cursor string
     * @return decoded cursor value, or null if invalid/null
     */
    public static Integer decodeCursor(String encodedCursor) {
        if (encodedCursor == null || encodedCursor.trim().isEmpty()) {
            return null;
        }

        try {
            byte[] decodedBytes = Base64.getDecoder().decode(encodedCursor);
            String decodedString = new String(decodedBytes, StandardCharsets.UTF_8);
            return Integer.parseInt(decodedString);
        } catch (IllegalArgumentException e) {
            // Invalid Base64 or number format - treat as null cursor (start from beginning)
            return null;
        }
    }

    /**
     * Checks if there are more pages available based on the fetched results.
     * This method assumes you fetched size+1 items to determine if more exist.
     *
     * @param fetchedCount the number of items fetched
     * @param requestedSize the requested page size
     * @return true if more pages exist, false otherwise
     */
    public static boolean hasNextPage(int fetchedCount, int requestedSize) {
        return fetchedCount > requestedSize;
    }
}
