package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Integer> {

    @Query("select v from Vendor v " +
           "where (:active is null or v.active = :active) " +
           "and (:city is null or lower(v.city) = lower(:city)) " +
           "and (:state is null or lower(v.state) = lower(:state))")
    Page<Vendor> search(@Param("active") Boolean active,
                        @Param("city") String city,
                        @Param("state") String state,
                        Pageable pageable);

    /**
     * Cursor-based pagination query for vendors.
     * Fetches vendors with ID greater than the cursor, maintaining all filter conditions.
     *
     * @param cursor the cursor (vendor ID) from which to start fetching (null for first page)
     * @param active optional active status filter
     * @param city optional city filter
     * @param state optional state filter
     * @param pageable pagination information (size and sort)
     * @return list of vendors matching the criteria
     */
    @Query("select v from Vendor v " +
           "where (:cursor is null or v.id > :cursor) " +
           "and (:active is null or v.active = :active) " +
           "and (:city is null or lower(v.city) = lower(:city)) " +
           "and (:state is null or lower(v.state) = lower(:state)) " +
           "order by v.id asc")
    List<Vendor> searchByCursor(@Param("cursor") Integer cursor,
                                 @Param("active") Boolean active,
                                 @Param("city") String city,
                                 @Param("state") String state,
                                 Pageable pageable);
}
