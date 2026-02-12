package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorRepository extends JpaRepository<Vendor, Integer> {

    @Query("select v from Vendor v " +
           "where (:active is null or v.active = :active) " +
           "and (:city is null or lower(v.city) = lower(:city)) " +
           "and (:state is null or lower(v.state) = lower(:state))")
    Page<Vendor> search(@Param("active") Boolean active,
                        @Param("city") String city,
                        @Param("state") String state,
                        Pageable pageable);
}
