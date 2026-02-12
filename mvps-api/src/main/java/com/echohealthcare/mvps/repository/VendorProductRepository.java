package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.VendorProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface VendorProductRepository extends JpaRepository<VendorProduct, Integer> {

    @Query("select vp from VendorProduct vp " +
           "where (:vendorId is null or vp.vendor.id = :vendorId) " +
           "and (:productId is null or vp.product.id = :productId) " +
           "and (:available is null or vp.available = :available) " +
           "and (:minPrice is null or vp.finalPrice >= :minPrice) " +
           "and (:maxPrice is null or vp.finalPrice <= :maxPrice)")
    Page<VendorProduct> search(@Param("vendorId") Integer vendorId,
                               @Param("productId") Integer productId,
                               @Param("available") Boolean available,
                               @Param("minPrice") BigDecimal minPrice,
                               @Param("maxPrice") BigDecimal maxPrice,
                               Pageable pageable);

    @Query(value = "SELECT vp FROM VendorProduct vp " +
            "JOIN FETCH vp.product p " +
            "JOIN FETCH vp.vendor v " +
            "WHERE vp.available = true AND vp.stockQuantity > 0 " +
            "AND ( :categoryId IS NULL OR p.category.id = :categoryId )")
    List<VendorProduct> findForLowestPriceView(@Param("categoryId") Integer categoryId);
}
