package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.Product;
import com.echohealthcare.mvps.domain.Vendor;
import com.echohealthcare.mvps.domain.VendorProduct;
import com.echohealthcare.mvps.domain.VendorStockMovement;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.repository.ProductRepository;
import com.echohealthcare.mvps.repository.VendorProductRepository;
import com.echohealthcare.mvps.repository.VendorRepository;
import com.echohealthcare.mvps.repository.VendorStockMovementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class VendorProductService {

    private static final Logger log = LoggerFactory.getLogger(VendorProductService.class);

    private final VendorProductRepository vendorProductRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final VendorStockMovementRepository vendorStockMovementRepository;

    public VendorProductService(VendorProductRepository vendorProductRepository,
                                VendorRepository vendorRepository,
                                ProductRepository productRepository,
                                VendorStockMovementRepository vendorStockMovementRepository) {
        this.vendorProductRepository = vendorProductRepository;
        this.vendorRepository = vendorRepository;
        this.productRepository = productRepository;
        this.vendorStockMovementRepository = vendorStockMovementRepository;
    }

    public VendorProductsGet200Response getVendorProducts(Integer vendorId,
                                                          Integer productId,
                                                          Boolean isAvailable,
                                                          BigDecimal minPrice,
                                                          BigDecimal maxPrice,
                                                          int page,
                                                          int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), limit);
        Page<VendorProduct> vendorProductPage = vendorProductRepository.search(vendorId, productId, isAvailable, minPrice, maxPrice, pageable);

        VendorProductsGet200Response response = new VendorProductsGet200Response();
        response.setSuccess(true);

        vendorProductPage.getContent().forEach(vp -> response.addDataItem(mapToModel(vp)));

        Pagination pagination = new Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
		pagination.setTotalItems((int) vendorProductPage.getTotalElements());
		pagination.setTotalPages(vendorProductPage.getTotalPages());
        response.setPagination(pagination);
        return response;
    }

    public VendorProductsPost201Response createVendorProduct(VendorProductCreate request) {
        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        VendorProduct entity = new VendorProduct();
        entity.setVendor(vendor);
        entity.setProduct(product);
        applyCreate(request, entity);

        VendorProduct saved = vendorProductRepository.save(entity);

        VendorProductsPost201Response response = new VendorProductsPost201Response();
        response.setSuccess(true);
        response.setMessage("Vendor product created successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public VendorProductsVendorProductIdGet200Response getVendorProductById(Integer vendorProductId) {
        VendorProduct vendorProduct = vendorProductRepository.findById(vendorProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor product not found"));

        VendorProductsVendorProductIdGet200Response response = new VendorProductsVendorProductIdGet200Response();
        response.setSuccess(true);
        response.setData(mapToModel(vendorProduct));
        return response;
    }

    public VendorProductsVendorProductIdPut200Response updateVendorProduct(Integer vendorProductId,
                                                                           VendorProductUpdate request) {
        VendorProduct entity = vendorProductRepository.findById(vendorProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor product not found"));

        applyUpdate(request, entity);
        VendorProduct saved = vendorProductRepository.save(entity);

        VendorProductsVendorProductIdPut200Response response = new VendorProductsVendorProductIdPut200Response();
        response.setSuccess(true);
        response.setMessage("Vendor product updated successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public VendorProductsVendorProductIdDelete200Response deleteVendorProduct(Integer vendorProductId) {
        VendorProduct entity = vendorProductRepository.findById(vendorProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor product not found"));

        // Soft delete semantics: mark unavailable and zero stock
        entity.setAvailable(false);
        entity.setStockQuantity(0);
        vendorProductRepository.save(entity);

        VendorProductsVendorProductIdDelete200Response response = new VendorProductsVendorProductIdDelete200Response();
        response.setSuccess(true);
        response.setMessage("Vendor product deleted successfully");
        return response;
    }

    public VendorProductsLowestPricesGet200Response getLowestPriceProducts(Integer categoryId,
                                                                           BigDecimal maxPrice,
                                                                           Integer minStock) {
        List<VendorProduct> candidates = vendorProductRepository.findForLowestPriceView(categoryId);

        Map<Integer, VendorProduct> lowestByProduct = new HashMap<>();
        for (VendorProduct vp : candidates) {
            if (vp.getStockQuantity() == null || vp.getStockQuantity() <= 0) {
                continue;
            }
            if (minStock != null && vp.getStockQuantity() < minStock) {
                continue;
            }

            BigDecimal effectiveFinalPrice = getEffectiveFinalPrice(vp);
            if (effectiveFinalPrice == null) {
                continue;
            }
            if (maxPrice != null && effectiveFinalPrice.compareTo(maxPrice) > 0) {
                continue;
            }

            Integer productId = vp.getProduct().getId();
            VendorProduct current = lowestByProduct.get(productId);
            if (current == null || getEffectiveFinalPrice(current).compareTo(effectiveFinalPrice) > 0) {
                lowestByProduct.put(productId, vp);
            }
        }

        List<LowestPriceProduct> models = new ArrayList<>();
        for (VendorProduct vp : lowestByProduct.values()) {
            models.add(mapToLowestPriceProduct(vp));
        }
        // sort by product name for stable ordering
        models.sort(Comparator.comparing(lp -> lp.getProductName() != null ? lp.getProductName() : ""));

        VendorProductsLowestPricesGet200Response response = new VendorProductsLowestPricesGet200Response();
        response.setSuccess(true);
        response.setData(models);
        return response;
    }

    public VendorProductsPriceComparisonGet200Response getPriceComparison() {
        List<VendorProduct> all = vendorProductRepository.findAll();

        // Group by product to determine lowest price per product
        Map<Integer, BigDecimal> minPriceByProduct = new HashMap<>();
        for (VendorProduct vp : all) {
            if (vp.getStockQuantity() == null || vp.getStockQuantity() <= 0) {
                continue;
            }
            if (Boolean.FALSE.equals(vp.getAvailable())) {
                continue;
            }
            BigDecimal effectiveFinalPrice = getEffectiveFinalPrice(vp);
            if (effectiveFinalPrice == null) {
                continue;
            }
            Integer productId = vp.getProduct().getId();
            BigDecimal currentMin = minPriceByProduct.get(productId);
            if (currentMin == null || currentMin.compareTo(effectiveFinalPrice) > 0) {
                minPriceByProduct.put(productId, effectiveFinalPrice);
            }
        }

        List<PriceComparison> comparisons = new ArrayList<>();
        for (VendorProduct vp : all) {
            if (vp.getStockQuantity() == null || vp.getStockQuantity() <= 0) {
                continue;
            }
            if (Boolean.FALSE.equals(vp.getAvailable())) {
                continue;
            }
            BigDecimal effectiveFinalPrice = getEffectiveFinalPrice(vp);
            if (effectiveFinalPrice == null) {
                continue;
            }
            Integer productId = vp.getProduct().getId();
            BigDecimal minPrice = minPriceByProduct.get(productId);
            if (minPrice == null) {
                continue;
            }

            PriceComparison pc = new PriceComparison();
            pc.setProductId(productId);
            pc.setProductName(vp.getProduct().getName());
            pc.setVendorId(vp.getVendor().getId());
            pc.setVendorName(vp.getVendor().getName());
            pc.setCostPrice(vp.getCostPrice());
            pc.setDiscountPercentage(vp.getDiscountPercentage());
            pc.setFinalPrice(effectiveFinalPrice);
            pc.setStockQuantity(vp.getStockQuantity());
            pc.setPriceStatus(effectiveFinalPrice.compareTo(minPrice) == 0 ? "LOWEST PRICE" : "HIGHER PRICE");
            comparisons.add(pc);
        }

        VendorProductsPriceComparisonGet200Response response = new VendorProductsPriceComparisonGet200Response();
        response.setSuccess(true);
        response.setData(comparisons);
        return response;
    }

    public VendorProductsUpdateStockPatch200Response updateStock(VendorProductsUpdateStockPatchRequest request) {
        if (request == null || request.getUpdates() == null || request.getUpdates().isEmpty()) {
            VendorProductsUpdateStockPatch200Response response = new VendorProductsUpdateStockPatch200Response();
            response.setSuccess(true);
            response.setMessage("No updates provided");
            response.setUpdatedCount(0);
            return response;
        }

        int updatedCount = 0;
        for (VendorProductsUpdateStockPatchRequestUpdatesInner update : request.getUpdates()) {
            VendorProduct vp = vendorProductRepository.findById(update.getVendorProductId()).orElse(null);
            if (vp == null) {
                continue;
            }

            Integer previousQuantity = vp.getStockQuantity() != null ? vp.getStockQuantity() : 0;
            Integer newQuantity = update.getStockQuantity();
            if (newQuantity == null || newQuantity < 0) {
                continue;
            }
            if (previousQuantity.equals(newQuantity)) {
                continue;
            }

            vp.setStockQuantity(newQuantity);
            vendorProductRepository.save(vp);

            try {
                VendorStockMovement movement = new VendorStockMovement();
                movement.setVendorProduct(vp);
                movement.setPreviousQuantity(previousQuantity);
                movement.setNewQuantity(newQuantity);
                movement.setChangeAmount(newQuantity - previousQuantity);
                vendorStockMovementRepository.save(movement);
            } catch (Exception ex) {
                // Do not fail the stock update if audit logging fails (e.g., missing table)
                log.warn("Failed to record stock movement audit for vendorProductId={}", vp.getId(), ex);
            }

            updatedCount++;
        }

        VendorProductsUpdateStockPatch200Response response = new VendorProductsUpdateStockPatch200Response();
        response.setSuccess(true);
        response.setMessage("Stock updated successfully");
        response.setUpdatedCount(updatedCount);
        return response;
    }

    public List<VendorStockMovement> getStockHistory(Integer vendorProductId) {
        VendorProduct vendorProduct = vendorProductRepository.findById(vendorProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor product not found"));
        return vendorStockMovementRepository.findByVendorProductOrderByChangedAtDesc(vendorProduct);
    }

    private void applyCreate(VendorProductCreate request, VendorProduct entity) {
        entity.setVendorSku(request.getVendorSku());
        entity.setCostPrice(request.getCostPrice());
        entity.setMrp(request.getMrp());
        entity.setDiscountPercentage(request.getDiscountPercentage());
        entity.setMinimumOrderQuantity(request.getMinimumOrderQuantity());
        entity.setStockQuantity(request.getStockQuantity());
        entity.setExpiryDate(request.getExpiryDate().orElse(null));
        entity.setAvailable(request.getIsAvailable());
        entity.setDeliveryTimeDays(request.getDeliveryTimeDays());
    }

    private void applyUpdate(VendorProductUpdate request, VendorProduct entity) {
        if (request.getVendorSku() != null) {
            entity.setVendorSku(request.getVendorSku());
        }
        if (request.getCostPrice() != null) {
            entity.setCostPrice(request.getCostPrice());
        }
        if (request.getMrp() != null) {
            entity.setMrp(request.getMrp());
        }
        if (request.getDiscountPercentage() != null) {
            entity.setDiscountPercentage(request.getDiscountPercentage());
        }
        if (request.getMinimumOrderQuantity() != null) {
            entity.setMinimumOrderQuantity(request.getMinimumOrderQuantity());
        }
        if (request.getStockQuantity() != null) {
            entity.setStockQuantity(request.getStockQuantity());
        }
        if (request.getExpiryDate() != null && request.getExpiryDate().isPresent()) {
            entity.setExpiryDate(request.getExpiryDate().get());
        }
        if (request.getIsAvailable() != null) {
            entity.setAvailable(request.getIsAvailable());
        }
        if (request.getDeliveryTimeDays() != null) {
            entity.setDeliveryTimeDays(request.getDeliveryTimeDays());
        }
    }

    private com.echohealthcare.mvps.model.VendorProduct mapToModel(VendorProduct entity) {
        com.echohealthcare.mvps.model.VendorProduct model = new com.echohealthcare.mvps.model.VendorProduct();
        model.vendorProductId(entity.getId());
        model.vendorId(entity.getVendor() != null ? entity.getVendor().getId() : null);
        model.productId(entity.getProduct() != null ? entity.getProduct().getId() : null);
        model.vendorSku(entity.getVendorSku());
        model.costPrice(entity.getCostPrice());
        model.mrp(entity.getMrp());
        model.discountPercentage(entity.getDiscountPercentage());
        model.finalPrice(getEffectiveFinalPrice(entity));
        model.minimumOrderQuantity(entity.getMinimumOrderQuantity());
        model.stockQuantity(entity.getStockQuantity());
        if (entity.getExpiryDate() != null) {
            model.expiryDate(entity.getExpiryDate());
        }
        model.isAvailable(entity.getAvailable());
        model.deliveryTimeDays(entity.getDeliveryTimeDays());
        model.createdAt(entity.getCreatedAt());
        model.updatedAt(entity.getUpdatedAt());
        return model;
    }

    private LowestPriceProduct mapToLowestPriceProduct(VendorProduct entity) {
        LowestPriceProduct model = new LowestPriceProduct();
        model.setProductId(entity.getProduct().getId());
        model.setProductName(entity.getProduct().getName());
        model.setGenericName(entity.getProduct().getGenericName());
        model.setVendorProductId(entity.getId());
        model.setVendorId(entity.getVendor().getId());
        model.setVendorName(entity.getVendor().getName());
        model.setCostPrice(entity.getCostPrice());
        model.setDiscountPercentage(entity.getDiscountPercentage());
        model.setFinalPrice(getEffectiveFinalPrice(entity));
        model.setStockQuantity(entity.getStockQuantity());
        model.setIsAvailable(entity.getAvailable());
        return model;
    }

    private BigDecimal getEffectiveFinalPrice(VendorProduct entity) {
        if (entity.getFinalPrice() != null) {
            return entity.getFinalPrice();
        }
        if (entity.getCostPrice() == null) {
            return null;
        }
        BigDecimal discount = entity.getDiscountPercentage() != null ? entity.getDiscountPercentage() : BigDecimal.ZERO;
        BigDecimal hundred = new BigDecimal("100");
        BigDecimal multiplier = BigDecimal.ONE.subtract(discount.divide(hundred));
        return entity.getCostPrice().multiply(multiplier);
    }
}
