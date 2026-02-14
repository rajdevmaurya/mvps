package com.javatechie.repository;

import com.javatechie.entity.Item;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemInventoryRepository extends JpaRepository<Item,Long> {


    @Query("""
        SELECT p FROM Item p
        WHERE (:cursor IS NULL OR p.id > :cursor)
        ORDER BY p.id ASC
    """)

//    SELECT *
//    FROM product
//    WHERE id > 5
//    ORDER BY id ASC
//    LIMIT 5;

    public List<Item> fetchNextPage(@Param("cursor") Long cursor, Pageable pageable);

}
