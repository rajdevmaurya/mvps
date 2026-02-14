package com.echohealthcare.mvps.util;

/**
 * Utility class for pagination parameter validation and normalization.
 * Ensures consistent pagination behavior across all API endpoints.
 */
public class PaginationUtils {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MIN_PAGE_SIZE = 1;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE = 1;

    /**
     * Validates and normalizes the page size parameter.
     * Returns a value between MIN_PAGE_SIZE and MAX_PAGE_SIZE.
     *
     * @param limit the requested page size (can be null)
     * @return validated page size between 1 and 100
     */
    public static int validatePageSize(Integer limit) {
        if (limit == null) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.max(MIN_PAGE_SIZE, Math.min(limit, MAX_PAGE_SIZE));
    }

    /**
     * Validates and normalizes the page number parameter.
     * Returns a value of at least 1.
     *
     * @param page the requested page number (can be null)
     * @return validated page number (minimum 1)
     */
    public static int validatePageNumber(Integer page) {
        if (page == null || page < 1) {
            return DEFAULT_PAGE;
        }
        return page;
    }

    /**
     * Validates both page and limit parameters together.
     *
     * @param page the requested page number
     * @param limit the requested page size
     * @return array with [validatedPage, validatedLimit]
     */
    public static int[] validatePagination(Integer page, Integer limit) {
        return new int[]{
            validatePageNumber(page),
            validatePageSize(limit)
        };
    }
}
