package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Integer> {

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
}
