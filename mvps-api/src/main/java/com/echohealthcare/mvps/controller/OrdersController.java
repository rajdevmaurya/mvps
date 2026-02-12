package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.OrdersApi;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class OrdersController implements OrdersApi {

    private final OrderService orderService;

    public OrdersController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Override
    public ResponseEntity<OrdersGet200Response> ordersGet(@Nullable Integer customerId,
                                                          @Nullable String orderStatus,
                                                          @Nullable String paymentStatus,
                                                          @Nullable String orderType,
                                                          @Nullable LocalDate fromDate,
                                                          @Nullable LocalDate toDate,
                                                          Integer page,
                                                          Integer limit) {
        return ResponseEntity.ok(orderService.getOrders(customerId, orderStatus, paymentStatus, orderType, fromDate, toDate, page, limit));
    }

    @Override
    public ResponseEntity<OrdersPost201Response> ordersPost(@Valid @RequestBody OrderCreate orderCreate) {
        return ResponseEntity.status(201).body(orderService.createOrder(orderCreate));
    }

    @Override
    public ResponseEntity<OrdersOrderIdGet200Response> ordersOrderIdGet(@PathVariable("orderId") Integer orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @Override
    public ResponseEntity<OrdersOrderIdPut200Response> ordersOrderIdPut(@PathVariable("orderId") Integer orderId,
                                                                       @Valid @RequestBody OrderUpdate orderUpdate) {
        return ResponseEntity.ok(orderService.updateOrder(orderId, orderUpdate));
    }

    @Override
    public ResponseEntity<OrdersOrderIdDelete200Response> ordersOrderIdDelete(@PathVariable("orderId") Integer orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId));
    }

    @Override
    public ResponseEntity<OrdersOrderIdPaymentStatusPatch200Response> ordersOrderIdPaymentStatusPatch(@PathVariable("orderId") Integer orderId,
                                                                                                      @Valid @RequestBody OrdersOrderIdPaymentStatusPatchRequest request) {
        return ResponseEntity.ok(orderService.updatePaymentStatus(orderId, request));
    }

    @Override
    public ResponseEntity<OrdersOrderIdStatusPatch200Response> ordersOrderIdStatusPatch(@PathVariable("orderId") Integer orderId,
                                                                                       @Valid @RequestBody OrdersOrderIdStatusPatchRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, request));
    }
}
