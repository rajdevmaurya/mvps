package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.ProductCategory;
import com.echohealthcare.mvps.dto.CursorPageResponse;
import com.echohealthcare.mvps.model.Pagination;
import com.echohealthcare.mvps.model.ProductCreate;
import com.echohealthcare.mvps.model.ProductUpdate;
import com.echohealthcare.mvps.model.ProductsGet200Response;
import com.echohealthcare.mvps.model.ProductsPost201Response;
import com.echohealthcare.mvps.model.ProductsProductIdDelete200Response;
import com.echohealthcare.mvps.model.ProductsProductIdGet200Response;
import com.echohealthcare.mvps.model.ProductsProductIdPut200Response;
import com.echohealthcare.mvps.repository.ProductCategoryRepository;
import com.echohealthcare.mvps.repository.ProductRepository;
import com.echohealthcare.mvps.util.CursorPaginationUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository,
                          ProductCategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public ProductsGet200Response getProducts(Integer categoryId,
                                              Boolean isActive,
                                              Boolean prescriptionRequired,
                                              String search,
                                              int page,
                                              int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), limit);
        Page<com.echohealthcare.mvps.domain.Product> productPage =
            productRepository.search(categoryId, isActive, prescriptionRequired, search, pageable);

        ProductsGet200Response response = new ProductsGet200Response();
        response.setSuccess(true);

        productPage.getContent().forEach(product -> response.addDataItem(mapToModel(product)));

        Pagination pagination = new Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
		pagination.setTotalItems((int) productPage.getTotalElements());
		pagination.setTotalPages(productPage.getTotalPages());
        response.setPagination(pagination);
        return response;
    }

    /**
     * Get products using cursor-based pagination.
     * Provides efficient navigation through large product datasets.
     *
     * @param cursor the cursor from which to start fetching (null for first page)
     * @param size the page size
     * @param categoryId optional category filter
     * @param isActive optional active status filter
     * @param prescriptionRequired optional prescription requirement filter
     * @param search optional search term
     * @return cursor page response with products and navigation metadata
     */
    public CursorPageResponse<com.echohealthcare.mvps.model.Product> getProductsByCursor(
            String cursor,
            Integer size,
            Integer categoryId,
            Boolean isActive,
            Boolean prescriptionRequired,
            String search) {

        int validatedSize = CursorPaginationUtils.validatePageSize(size);
        Integer decodedCursor = CursorPaginationUtils.decodeCursor(cursor);

        // Fetch size+1 to check if there's a next page
        Pageable pageable = PageRequest.of(0, validatedSize + 1);
        List<com.echohealthcare.mvps.domain.Product> products =
            productRepository.searchByCursor(decodedCursor, categoryId, isActive, prescriptionRequired, search, pageable);

        boolean hasNext = products.size() > validatedSize;
        List<com.echohealthcare.mvps.domain.Product> pageItems = hasNext
            ? products.subList(0, validatedSize)
            : products;

        Integer nextCursorValue = hasNext && !pageItems.isEmpty()
            ? pageItems.get(pageItems.size() - 1).getId()
            : null;

        List<com.echohealthcare.mvps.model.Product> responseData = pageItems.stream()
            .map(this::mapToModel)
            .collect(Collectors.toList());

        return new CursorPageResponse<>(
            responseData,
            validatedSize,
            CursorPaginationUtils.encodeCursor(nextCursorValue),
            hasNext
        );
    }

    public ProductsPost201Response createProduct(ProductCreate request) {
        com.echohealthcare.mvps.domain.Product product = new com.echohealthcare.mvps.domain.Product();
        applyCreate(request, product);

        com.echohealthcare.mvps.domain.Product saved = productRepository.save(product);

        ProductsPost201Response response = new ProductsPost201Response();
        response.setSuccess(true);
        response.setMessage("Product created successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public ProductsProductIdGet200Response getProductById(Integer productId) {
        com.echohealthcare.mvps.domain.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        ProductsProductIdGet200Response response = new ProductsProductIdGet200Response();
        response.setSuccess(true);
        response.setData(mapToModel(product));
        return response;
    }

    public ProductsProductIdPut200Response updateProduct(Integer productId, ProductUpdate request) {
        com.echohealthcare.mvps.domain.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        applyUpdate(request, product);
        com.echohealthcare.mvps.domain.Product saved = productRepository.save(product);

        ProductsProductIdPut200Response response = new ProductsProductIdPut200Response();
        response.setSuccess(true);
        response.setMessage("Product updated successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public ProductsProductIdDelete200Response softDeleteProduct(Integer productId) {
        com.echohealthcare.mvps.domain.Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setActive(false);
        productRepository.save(product);

        ProductsProductIdDelete200Response response = new ProductsProductIdDelete200Response();
        response.setSuccess(true);
        response.setMessage("Product deleted successfully");
        return response;
    }

    private void applyCreate(ProductCreate request, com.echohealthcare.mvps.domain.Product product) {
        product.setName(request.getProductName());
        product.setGenericName(request.getGenericName());
        if (request.getCategoryId() != null) {
            ProductCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }
        product.setDescription(request.getDescription());
        product.setManufacturer(request.getManufacturer());
        product.setHsnCode(request.getHsnCode());
        product.setUnitOfMeasure(request.getUnitOfMeasure());
        product.setPrescriptionRequired(Boolean.TRUE.equals(request.getPrescriptionRequired()));
        product.setActive(Boolean.TRUE.equals(request.getIsActive()));
    }

    private void applyUpdate(ProductUpdate request, com.echohealthcare.mvps.domain.Product product) {
        if (request.getProductName() != null) {
            product.setName(request.getProductName());
        }
        if (request.getGenericName() != null) {
            product.setGenericName(request.getGenericName());
        }
        if (request.getCategoryId() != null) {
            ProductCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getManufacturer() != null) {
            product.setManufacturer(request.getManufacturer());
        }
        if (request.getHsnCode() != null) {
            product.setHsnCode(request.getHsnCode());
        }
        if (request.getUnitOfMeasure() != null) {
            product.setUnitOfMeasure(request.getUnitOfMeasure());
        }
        if (request.getPrescriptionRequired() != null) {
            product.setPrescriptionRequired(request.getPrescriptionRequired());
        }
        if (request.getIsActive() != null) {
            product.setActive(request.getIsActive());
        }
    }

    private com.echohealthcare.mvps.model.Product mapToModel(com.echohealthcare.mvps.domain.Product entity) {
        com.echohealthcare.mvps.model.Product model = new com.echohealthcare.mvps.model.Product();
        model.productId(entity.getId());
        model.productName(entity.getName());
        model.genericName(entity.getGenericName());
        model.categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null);
        model.description(entity.getDescription());
        model.manufacturer(entity.getManufacturer());
        model.hsnCode(entity.getHsnCode());
        model.unitOfMeasure(entity.getUnitOfMeasure());
        model.prescriptionRequired(entity.getPrescriptionRequired());
        model.isActive(entity.getActive());
        model.createdAt(entity.getCreatedAt());
        model.updatedAt(entity.getUpdatedAt());
        return model;
    }
}
