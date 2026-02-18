package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.VendorProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface VendorProductRepository extends JpaRepository<VendorProduct, Integer> {

    @Query("SELECT vp FROM VendorProduct vp WHERE vp.product.id = :productId AND vp.available = true ORDER BY vp.finalPrice ASC")
    List<VendorProduct> findByProductIdOrderByFinalPriceAsc(@Param("productId") Integer productId);

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

    /**
     * Cursor-based pagination query for vendor products.
     * Fetches vendor products with ID greater than the cursor, maintaining all filter conditions.
     *
     * @param cursor the cursor (vendor product ID) from which to start fetching (null for first page)
     * @param vendorId optional vendor filter
     * @param productId optional product filter
     * @param available optional availability filter
     * @param minPrice optional minimum price filter
     * @param maxPrice optional maximum price filter
     * @param pageable pagination information (size and sort)
     * @return list of vendor products matching the criteria
     */
    @Query("select vp from VendorProduct vp " +
           "where (:cursor is null or vp.id > :cursor) " +
           "and (:vendorId is null or vp.vendor.id = :vendorId) " +
           "and (:productId is null or vp.product.id = :productId) " +
           "and (:available is null or vp.available = :available) " +
           "and (:minPrice is null or vp.finalPrice >= :minPrice) " +
           "and (:maxPrice is null or vp.finalPrice <= :maxPrice) " +
           "order by vp.id asc")
    List<VendorProduct> searchByCursor(@Param("cursor") Integer cursor,
                                        @Param("vendorId") Integer vendorId,
                                        @Param("productId") Integer productId,
                                        @Param("available") Boolean available,
                                        @Param("minPrice") BigDecimal minPrice,
                                        @Param("maxPrice") BigDecimal maxPrice,
                                        Pageable pageable);
}
