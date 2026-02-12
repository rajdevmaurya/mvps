package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.VendorProduct;
import com.echohealthcare.mvps.domain.VendorStockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorStockMovementRepository extends JpaRepository<VendorStockMovement, Integer> {

    List<VendorStockMovement> findByVendorProductOrderByChangedAtDesc(VendorProduct vendorProduct);
}
