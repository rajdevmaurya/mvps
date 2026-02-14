package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.CustomersApi;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.service.CustomerService;
import com.echohealthcare.mvps.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class CustomersController implements CustomersApi {

    private final CustomerService customerService;

    public CustomersController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Override
    public ResponseEntity<CustomersCustomerIdDelete200Response> customersCustomerIdDelete(@PathVariable("customerId") Integer customerId) {
        return ResponseEntity.ok(customerService.deleteCustomer(customerId));
    }

    @Override
    public ResponseEntity<CustomersCustomerIdGet200Response> customersCustomerIdGet(@PathVariable("customerId") Integer customerId) {
        return ResponseEntity.ok(customerService.getCustomerById(customerId));
    }

    @Override
    public ResponseEntity<CustomersCustomerIdOrdersGet200Response> customersCustomerIdOrdersGet(@PathVariable("customerId") Integer customerId,
                                                                                               @Nullable String orderStatus,
                                                                                               @Nullable LocalDate fromDate,
                                                                                               @Nullable LocalDate toDate) {
        return ResponseEntity.ok(customerService.getCustomerOrders(customerId, orderStatus, fromDate, toDate));
    }

    @Override
    public ResponseEntity<CustomersCustomerIdPut200Response> customersCustomerIdPut(@PathVariable("customerId") Integer customerId,
                                                                                   @Valid @RequestBody CustomerUpdate customerUpdate) {
        return ResponseEntity.ok(customerService.updateCustomer(customerId, customerUpdate));
    }

    @Override
    public ResponseEntity<CustomersGet200Response> customersGet(@Nullable String customerType,
                                                                @Nullable Boolean isActive,
                                                                @Nullable String city,
                                                                @Nullable String search,
                                                                Integer page,
                                                                Integer limit) {
        int[] validated = PaginationUtils.validatePagination(page, limit);
        return ResponseEntity.ok(customerService.getCustomers(customerType, isActive, city, search, validated[0], validated[1]));
    }

    @Override
    public ResponseEntity<CustomersPost201Response> customersPost(@Valid @RequestBody CustomerCreate customerCreate) {
        return ResponseEntity.status(201).body(customerService.createCustomer(customerCreate));
    }
}
