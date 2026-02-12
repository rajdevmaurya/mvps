package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.VendorOrdersApi;
import com.echohealthcare.mvps.model.VendorOrderCreate;
import com.echohealthcare.mvps.model.VendorOrderUpdate;
import com.echohealthcare.mvps.model.VendorOrdersGet200Response;
import com.echohealthcare.mvps.model.VendorOrdersPost201Response;
import com.echohealthcare.mvps.model.VendorOrdersVendorOrderIdDelete200Response;
import com.echohealthcare.mvps.model.VendorOrdersVendorOrderIdGet200Response;
import com.echohealthcare.mvps.model.VendorOrdersVendorOrderIdPut200Response;
import com.echohealthcare.mvps.service.VendorOrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class VendorOrdersController implements VendorOrdersApi {

    private final VendorOrderService vendorOrderService;

    public VendorOrdersController(VendorOrderService vendorOrderService) {
        this.vendorOrderService = vendorOrderService;
    }

    @Override
    public ResponseEntity<VendorOrdersGet200Response> vendorOrdersGet(@Nullable Integer vendorId,
                                                                      @Nullable String status,
                                                                      @Nullable LocalDate fromDate,
                                                                      @Nullable LocalDate toDate,
                                                                      Integer page,
                                                                      Integer limit) {
        return ResponseEntity.ok(vendorOrderService.getVendorOrders(vendorId, status, fromDate, toDate, page, limit));
    }

    @Override
    public ResponseEntity<VendorOrdersPost201Response> vendorOrdersPost(@Valid @RequestBody VendorOrderCreate vendorOrderCreate) {
        return ResponseEntity.status(201).body(vendorOrderService.createVendorOrder(vendorOrderCreate));
    }

    @Override
    public ResponseEntity<VendorOrdersVendorOrderIdGet200Response> vendorOrdersVendorOrderIdGet(@PathVariable("vendorOrderId") Integer vendorOrderId) {
        return ResponseEntity.ok(vendorOrderService.getVendorOrder(vendorOrderId));
    }

    @Override
    public ResponseEntity<VendorOrdersVendorOrderIdPut200Response> vendorOrdersVendorOrderIdPut(@PathVariable("vendorOrderId") Integer vendorOrderId,
                                                                                               @Valid @RequestBody VendorOrderUpdate vendorOrderUpdate) {
        return ResponseEntity.ok(vendorOrderService.updateVendorOrder(vendorOrderId, vendorOrderUpdate));
    }

    @Override
    public ResponseEntity<VendorOrdersVendorOrderIdDelete200Response> vendorOrdersVendorOrderIdDelete(@PathVariable("vendorOrderId") Integer vendorOrderId) {
        return ResponseEntity.ok(vendorOrderService.cancelVendorOrder(vendorOrderId));
    }
}
