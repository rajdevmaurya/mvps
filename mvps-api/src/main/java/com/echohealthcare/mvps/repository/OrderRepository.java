package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("select o from Order o " +
           "where (:customerId is null or o.customer.id = :customerId) " +
           "and (:orderStatus is null or o.orderStatus = :orderStatus) " +
           "and (:paymentStatus is null or o.paymentStatus = :paymentStatus) " +
           "and (:orderType is null or o.orderType = :orderType) " +
           "and (:fromDate is null or o.orderDate >= :fromDate) " +
           "and (:toDate is null or o.orderDate <= :toDate) " +
           "and (:search is null or " +
           "     LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(o.customer.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     o.customer.phone LIKE CONCAT('%', :search, '%'))")
    Page<Order> search(@Param("customerId") Integer customerId,
                       @Param("orderStatus") String orderStatus,
                       @Param("paymentStatus") String paymentStatus,
                       @Param("orderType") String orderType,
                       @Param("fromDate") LocalDateTime fromDate,
                       @Param("toDate") LocalDateTime toDate,
                       @Param("search") String search,
                       Pageable pageable);

    /**
     * Cursor-based pagination query for orders.
     * Fetches orders with ID greater than the cursor, maintaining all filter conditions.
     *
     * @param cursor the cursor (order ID) from which to start fetching (null for first page)
     * @param customerId optional customer filter
     * @param orderStatus optional order status filter
     * @param paymentStatus optional payment status filter
     * @param orderType optional order type filter
     * @param fromDate optional start date filter
     * @param toDate optional end date filter
     * @param pageable pagination information (size and sort)
     * @return list of orders matching the criteria
     */
    @Query("select o from Order o " +
           "where (:cursor is null or o.id > :cursor) " +
           "and (:customerId is null or o.customer.id = :customerId) " +
           "and (:orderStatus is null or o.orderStatus = :orderStatus) " +
           "and (:paymentStatus is null or o.paymentStatus = :paymentStatus) " +
           "and (:orderType is null or o.orderType = :orderType) " +
           "and (:fromDate is null or o.orderDate >= :fromDate) " +
           "and (:toDate is null or o.orderDate <= :toDate) " +
           "order by o.id asc")
    List<Order> searchByCursor(@Param("cursor") Integer cursor,
                                @Param("customerId") Integer customerId,
                                @Param("orderStatus") String orderStatus,
                                @Param("paymentStatus") String paymentStatus,
                                @Param("orderType") String orderType,
                                @Param("fromDate") LocalDateTime fromDate,
                                @Param("toDate") LocalDateTime toDate,
                                Pageable pageable);
}
