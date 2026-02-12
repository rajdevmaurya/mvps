package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.VendorOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface VendorOrderRepository extends JpaRepository<VendorOrder, Integer> {

    @Query("select vo from VendorOrder vo " +
	    "where (:vendorId is null or vo.vendor.id = :vendorId) " +
	    "and (:status is null or vo.status = :status) " +
	    "and (:fromDate is null or vo.orderDate >= :fromDate) " +
	    "and (:toDate is null or vo.orderDate <= :toDate)")
    Page<VendorOrder> search(@Param("vendorId") Integer vendorId,
				 @Param("status") String status,
				 @Param("fromDate") LocalDateTime fromDate,
				 @Param("toDate") LocalDateTime toDate,
				 Pageable pageable);
}
