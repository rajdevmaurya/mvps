package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    Optional<Customer> findByPhone(String phone);

    @Query("SELECT c FROM Customer c " +
           "WHERE (:customerType IS NULL OR c.customerType = :customerType) " +
           "AND (:isActive IS NULL OR c.active = :isActive) " +
           "AND (:city IS NULL OR LOWER(c.city) = LOWER(:city)) " +
           "AND (:search IS NULL OR " +
           "     LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     c.phone LIKE CONCAT('%', :search, '%'))")
    Page<Customer> search(
        @Param("customerType") String customerType,
        @Param("isActive") Boolean isActive,
        @Param("city") String city,
        @Param("search") String search,
        Pageable pageable
    );

    /**
     * Cursor-based pagination query for customers.
     * Fetches customers with ID greater than the cursor, maintaining all filter conditions.
     *
     * @param cursor the cursor (customer ID) from which to start fetching (null for first page)
     * @param customerType optional customer type filter
     * @param isActive optional active status filter
     * @param city optional city filter
     * @param search optional search term (matches name, email, or phone)
     * @param pageable pagination information (size and sort)
     * @return list of customers matching the criteria
     */
    @Query("SELECT c FROM Customer c " +
           "WHERE (:cursor IS NULL OR c.id > :cursor) " +
           "AND (:customerType IS NULL OR c.customerType = :customerType) " +
           "AND (:isActive IS NULL OR c.active = :isActive) " +
           "AND (:city IS NULL OR LOWER(c.city) = LOWER(:city)) " +
           "AND (:search IS NULL OR " +
           "     LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     c.phone LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY c.id ASC")
    List<Customer> searchByCursor(
        @Param("cursor") Integer cursor,
        @Param("customerType") String customerType,
        @Param("isActive") Boolean isActive,
        @Param("city") String city,
        @Param("search") String search,
        Pageable pageable
    );
}
