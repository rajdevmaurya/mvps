package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<Product> findByBarcode(String barcode);

    @Query("select p from Product p " +
           "where (:categoryId is null or p.category.id = :categoryId) " +
           "and (:active is null or p.active = :active) " +
           "and (:prescriptionRequired is null or p.prescriptionRequired = :prescriptionRequired) " +
           "and (:search is null or lower(p.name) like lower(concat('%', :search, '%')) " +
           "     or lower(p.genericName) like lower(concat('%', :search, '%')))" )
    Page<Product> search(@Param("categoryId") Integer categoryId,
                         @Param("active") Boolean active,
                         @Param("prescriptionRequired") Boolean prescriptionRequired,
                         @Param("search") String search,
                         Pageable pageable);

    /**
     * Cursor-based pagination query for products.
     * Fetches products with ID greater than the cursor, maintaining all filter conditions.
     *
     * @param cursor the cursor (product ID) from which to start fetching (null for first page)
     * @param categoryId optional category filter
     * @param active optional active status filter
     * @param prescriptionRequired optional prescription requirement filter
     * @param search optional search term (matches name or generic name)
     * @param pageable pagination information (size and sort)
     * @return list of products matching the criteria
     */
    @Query("select p from Product p " +
           "where (:cursor is null or p.id > :cursor) " +
           "and (:categoryId is null or p.category.id = :categoryId) " +
           "and (:active is null or p.active = :active) " +
           "and (:prescriptionRequired is null or p.prescriptionRequired = :prescriptionRequired) " +
           "and (:search is null or lower(p.name) like lower(concat('%', :search, '%')) " +
           "     or lower(p.genericName) like lower(concat('%', :search, '%'))) " +
           "order by p.id asc")
    List<Product> searchByCursor(@Param("cursor") Integer cursor,
                                   @Param("categoryId") Integer categoryId,
                                   @Param("active") Boolean active,
                                   @Param("prescriptionRequired") Boolean prescriptionRequired,
                                   @Param("search") String search,
                                   Pageable pageable);
}
