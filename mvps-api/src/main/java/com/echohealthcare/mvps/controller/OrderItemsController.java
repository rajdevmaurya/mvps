package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.OrderItemsApi;
import com.echohealthcare.mvps.model.OrderItemUpdate;
import com.echohealthcare.mvps.model.OrderItemsGet200Response;
import com.echohealthcare.mvps.model.OrderItemsOrderItemIdDelete200Response;
import com.echohealthcare.mvps.model.OrderItemsOrderItemIdGet200Response;
import com.echohealthcare.mvps.model.OrderItemsOrderItemIdPut200Response;
import com.echohealthcare.mvps.service.OrderItemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderItemsController implements OrderItemsApi {

    private final OrderItemService orderItemService;

    public OrderItemsController(OrderItemService orderItemService) {
        this.orderItemService = orderItemService;
    }

    @Override
    public ResponseEntity<OrderItemsGet200Response> orderItemsGet(@Nullable Integer orderId,
                                                                  @Nullable Integer vendorId,
                                                                  @Nullable Integer productId) {
        return ResponseEntity.ok(orderItemService.getOrderItems(orderId, vendorId, productId));
    }

    @Override
    public ResponseEntity<OrderItemsOrderItemIdGet200Response> orderItemsOrderItemIdGet(@PathVariable("orderItemId") Integer orderItemId) {
        return ResponseEntity.ok(orderItemService.getOrderItem(orderItemId));
    }

    @Override
    public ResponseEntity<OrderItemsOrderItemIdPut200Response> orderItemsOrderItemIdPut(@PathVariable("orderItemId") Integer orderItemId,
                                                                                       @Valid @RequestBody OrderItemUpdate orderItemUpdate) {
        return ResponseEntity.ok(orderItemService.updateOrderItem(orderItemId, orderItemUpdate));
    }

    @Override
    public ResponseEntity<OrderItemsOrderItemIdDelete200Response> orderItemsOrderItemIdDelete(@PathVariable("orderItemId") Integer orderItemId) {
        return ResponseEntity.ok(orderItemService.deleteOrderItem(orderItemId));
    }
}
