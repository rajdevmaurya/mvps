package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

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
}
