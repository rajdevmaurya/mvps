package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    @Query("select o from Order o " +
           "where (:customerId is null or o.customer.id = :customerId) " +
           "and (:orderStatus is null or o.orderStatus = :orderStatus) " +
           "and (:paymentStatus is null or o.paymentStatus = :paymentStatus) " +
           "and (:orderType is null or o.orderType = :orderType) " +
           "and (:fromDate is null or o.orderDate >= :fromDate) " +
           "and (:toDate is null or o.orderDate <= :toDate)")
    Page<Order> search(@Param("customerId") Integer customerId,
                       @Param("orderStatus") String orderStatus,
                       @Param("paymentStatus") String paymentStatus,
                       @Param("orderType") String orderType,
                       @Param("fromDate") LocalDateTime fromDate,
                       @Param("toDate") LocalDateTime toDate,
                       Pageable pageable);
}
