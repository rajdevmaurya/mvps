package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.VendorsApi;
import com.echohealthcare.mvps.dto.CursorPageResponse;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.service.VendorService;
import com.echohealthcare.mvps.service.AnalyticsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VendorsController implements VendorsApi {

    private final VendorService vendorService;
    private final AnalyticsService analyticsService;

    public VendorsController(VendorService vendorService, AnalyticsService analyticsService) {
        this.vendorService = vendorService;
        this.analyticsService = analyticsService;
    }

    @Override
    public ResponseEntity<VendorsGet200Response> vendorsGet(@Nullable Boolean isActive,
                                                            @Nullable String city,
                                                            @Nullable String state,
                                                            Integer page,
                                                            Integer limit) {
        return ResponseEntity.ok(vendorService.getVendors(isActive, city, state, page, limit));
    }

    /**
     * Cursor-based pagination endpoint for vendors.
     */
    @GetMapping("/vendors/cursor")
    public ResponseEntity<CursorPageResponse<Vendor>> vendorsGetByCursor(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state) {
        return ResponseEntity.ok(vendorService.getVendorsByCursor(
            cursor, size, isActive, city, state));
    }

    @Override
    public ResponseEntity<VendorsPost201Response> vendorsPost(@Valid @RequestBody VendorCreate vendorCreate) {
        return ResponseEntity.status(201).body(vendorService.createVendor(vendorCreate));
    }

    @Override
    public ResponseEntity<VendorsVendorIdGet200Response> vendorsVendorIdGet(@PathVariable("vendorId") Integer vendorId) {
        return ResponseEntity.ok(vendorService.getVendorById(vendorId));
    }

    @Override
    public ResponseEntity<VendorsVendorIdPut200Response> vendorsVendorIdPut(@PathVariable("vendorId") Integer vendorId,
                                                                            @Valid @RequestBody VendorUpdate vendorUpdate) {
        return ResponseEntity.ok(vendorService.updateVendor(vendorId, vendorUpdate));
    }

    @Override
    public ResponseEntity<VendorsVendorIdDelete200Response> vendorsVendorIdDelete(@PathVariable("vendorId") Integer vendorId) {
        return ResponseEntity.ok(vendorService.softDeleteVendor(vendorId));
    }

    @Override
    public ResponseEntity<VendorsPerformanceGet200Response> vendorsPerformanceGet() {
        return ResponseEntity.ok(analyticsService.getVendorPerformance());
    }
}
