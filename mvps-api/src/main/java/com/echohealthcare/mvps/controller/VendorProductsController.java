package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.VendorProductsApi;
import com.echohealthcare.mvps.domain.VendorStockMovement;
import com.echohealthcare.mvps.model.VendorProductCreate;
import com.echohealthcare.mvps.model.VendorProductUpdate;
import com.echohealthcare.mvps.model.VendorProductsGet200Response;
import com.echohealthcare.mvps.model.VendorProductsLowestPricesGet200Response;
import com.echohealthcare.mvps.model.VendorProductsPost201Response;
import com.echohealthcare.mvps.model.VendorProductsPriceComparisonGet200Response;
import com.echohealthcare.mvps.model.VendorProductsUpdateStockPatch200Response;
import com.echohealthcare.mvps.model.VendorProductsUpdateStockPatchRequest;
import com.echohealthcare.mvps.model.VendorProductsVendorProductIdDelete200Response;
import com.echohealthcare.mvps.model.VendorProductsVendorProductIdGet200Response;
import com.echohealthcare.mvps.model.VendorProductsVendorProductIdPut200Response;
import com.echohealthcare.mvps.service.VendorProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
public class VendorProductsController implements VendorProductsApi {

    private final VendorProductService vendorProductService;

    public VendorProductsController(VendorProductService vendorProductService) {
        this.vendorProductService = vendorProductService;
    }

    @Override
    public ResponseEntity<VendorProductsGet200Response> vendorProductsGet(@Nullable Integer vendorId,
                                                                          @Nullable Integer productId,
                                                                          @Nullable Boolean isAvailable,
                                                                          @Nullable BigDecimal minPrice,
                                                                          @Nullable BigDecimal maxPrice,
                                                                          Integer page,
                                                                          Integer limit) {
        return ResponseEntity.ok(vendorProductService.getVendorProducts(vendorId, productId, isAvailable, minPrice, maxPrice, page, limit));
    }

    @Override
    public ResponseEntity<VendorProductsLowestPricesGet200Response> vendorProductsLowestPricesGet(@Nullable Integer categoryId,
                                                                                                  @Nullable BigDecimal maxPrice,
                                                                                                  @Nullable Integer minStock) {
        return ResponseEntity.ok(vendorProductService.getLowestPriceProducts(categoryId, maxPrice, minStock));
    }

    @Override
    public ResponseEntity<VendorProductsPost201Response> vendorProductsPost(@Valid @RequestBody VendorProductCreate vendorProductCreate) {
        return ResponseEntity.status(201).body(vendorProductService.createVendorProduct(vendorProductCreate));
    }

    @Override
    public ResponseEntity<VendorProductsPriceComparisonGet200Response> vendorProductsPriceComparisonGet() {
        return ResponseEntity.ok(vendorProductService.getPriceComparison());
    }

    @Override
    public ResponseEntity<VendorProductsUpdateStockPatch200Response> vendorProductsUpdateStockPatch(@Valid @RequestBody VendorProductsUpdateStockPatchRequest vendorProductsUpdateStockPatchRequest) {
        return ResponseEntity.ok(vendorProductService.updateStock(vendorProductsUpdateStockPatchRequest));
    }

    @Override
    public ResponseEntity<VendorProductsVendorProductIdDelete200Response> vendorProductsVendorProductIdDelete(@PathVariable("vendorProductId") Integer vendorProductId) {
        return ResponseEntity.ok(vendorProductService.deleteVendorProduct(vendorProductId));
    }

    @Override
    public ResponseEntity<VendorProductsVendorProductIdGet200Response> vendorProductsVendorProductIdGet(@PathVariable("vendorProductId") Integer vendorProductId) {
        return ResponseEntity.ok(vendorProductService.getVendorProductById(vendorProductId));
    }

    @Override
    public ResponseEntity<VendorProductsVendorProductIdPut200Response> vendorProductsVendorProductIdPut(@PathVariable("vendorProductId") Integer vendorProductId,
                                                                                                       @Valid @RequestBody VendorProductUpdate vendorProductUpdate) {
        return ResponseEntity.ok(vendorProductService.updateVendorProduct(vendorProductId, vendorProductUpdate));
    }

    @org.springframework.web.bind.annotation.GetMapping("/vendor-products/{vendorProductId}/stock-history")
    public ResponseEntity<java.util.List<VendorStockMovement>> getVendorProductStockHistory(@PathVariable("vendorProductId") Integer vendorProductId) {
        return ResponseEntity.ok(vendorProductService.getStockHistory(vendorProductId));
    }
    @org.springframework.web.bind.annotation.GetMapping("/vendors/{vendorId}/products")
    public ResponseEntity<?> getProductsForVendor(
            @PathVariable("vendorId") Integer vendorId,
            @org.springframework.web.bind.annotation.RequestParam(value = "is_available", required = false) Boolean isAvailable) {
        VendorProductsGet200Response serviceResponse = vendorProductService.getVendorProducts(
            vendorId, null, isAvailable, null, null, 1, 100);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", serviceResponse.getSuccess());
        response.put("data", serviceResponse.getData());
        return ResponseEntity.ok(response);
    }
}
