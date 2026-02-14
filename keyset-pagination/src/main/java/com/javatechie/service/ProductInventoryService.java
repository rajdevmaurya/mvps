package com.javatechie.service;

import com.javatechie.dto.CursorPageResponse;
import com.javatechie.entity.Item;
import com.javatechie.repository.ItemInventoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductInventoryService {

    private final ItemInventoryRepository repository;


    public ProductInventoryService(ItemInventoryRepository repository) {
        this.repository = repository;
    }

    public Page<Item> getProducts(int offset, int pageSize) {
        return repository
                .findAll(PageRequest.of(offset, pageSize));
    }


    public CursorPageResponse<Item> getProducts(Long cursor, int size) {

        //default page = 0, size = 10 [0-9]
        Pageable pageable = PageRequest.of(0, size);

        //fetch next page records
        List<Item> items = repository.fetchNextPage(cursor, pageable);

        //check if we have more records
        boolean hasNext = items.size() == size;

        //determine the next cursor

        Long nextCursor = hasNext
                ? items.get(items.size() - 1).getId()
                : null;

        return new CursorPageResponse<>(
                items,
                size,
                nextCursor,
                hasNext
        );

    }
}
