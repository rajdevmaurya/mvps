package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    @Query("select oi from OrderItem oi " +
	    "where (:orderId is null or oi.order.id = :orderId) " +
	    "and (:vendorId is null or oi.vendor.id = :vendorId) " +
	    "and (:productId is null or oi.product.id = :productId)")
    List<OrderItem> search(@Param("orderId") Integer orderId,
			      @Param("vendorId") Integer vendorId,
			      @Param("productId") Integer productId);
}
