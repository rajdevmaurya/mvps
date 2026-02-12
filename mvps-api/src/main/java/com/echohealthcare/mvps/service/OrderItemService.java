package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.OrderItem;
import com.echohealthcare.mvps.model.OrderItemUpdate;
import com.echohealthcare.mvps.model.OrderItemsGet200Response;
import com.echohealthcare.mvps.model.OrderItemsOrderItemIdDelete200Response;
import com.echohealthcare.mvps.model.OrderItemsOrderItemIdGet200Response;
import com.echohealthcare.mvps.model.OrderItemsOrderItemIdPut200Response;
import com.echohealthcare.mvps.repository.OrderItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class OrderItemService {

    private final OrderItemRepository orderItemRepository;

    public OrderItemService(OrderItemRepository orderItemRepository) {
        this.orderItemRepository = orderItemRepository;
    }

    public OrderItemsGet200Response getOrderItems(Integer orderId, Integer vendorId, Integer productId) {
        List<OrderItem> items = orderItemRepository.search(orderId, vendorId, productId);

        OrderItemsGet200Response response = new OrderItemsGet200Response();
        response.setSuccess(true);
        for (OrderItem item : items) {
            response.addDataItem(mapToModel(item));
        }
        return response;
    }

    public OrderItemsOrderItemIdGet200Response getOrderItem(Integer orderItemId) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));

        OrderItemsOrderItemIdGet200Response response = new OrderItemsOrderItemIdGet200Response();
        response.setSuccess(true);
        response.setData(mapToModel(item));
        return response;
    }

    public OrderItemsOrderItemIdPut200Response updateOrderItem(Integer orderItemId, OrderItemUpdate update) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));

        if (update.getQuantity() != null) {
            item.setQuantity(update.getQuantity());
        }
        if (update.getUnitPrice() != null) {
            item.setUnitPrice(update.getUnitPrice());
        }
        if (update.getDiscountPercentage() != null) {
            item.setDiscountPercentage(update.getDiscountPercentage());
        }
        if (update.getTaxPercentage() != null) {
            item.setTaxPercentage(update.getTaxPercentage());
        }

        BigDecimal lineTotal = item.getUnitPrice() != null && item.getQuantity() != null
                ? item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                : BigDecimal.ZERO;
        item.setLineTotal(lineTotal);

        OrderItem saved = orderItemRepository.save(item);

        OrderItemsOrderItemIdPut200Response response = new OrderItemsOrderItemIdPut200Response();
        response.setSuccess(true);
        response.setMessage("Order item updated successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public OrderItemsOrderItemIdDelete200Response deleteOrderItem(Integer orderItemId) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));
        orderItemRepository.delete(item);

        OrderItemsOrderItemIdDelete200Response response = new OrderItemsOrderItemIdDelete200Response();
        response.setSuccess(true);
        response.setMessage("Order item deleted successfully");
        return response;
    }

    private com.echohealthcare.mvps.model.OrderItem mapToModel(OrderItem item) {
        com.echohealthcare.mvps.model.OrderItem model = new com.echohealthcare.mvps.model.OrderItem();
        model.setOrderItemId(item.getId());
        model.setOrderId(item.getOrder() != null ? item.getOrder().getId() : null);
        model.setVendorProductId(item.getVendorProduct() != null ? item.getVendorProduct().getId() : null);
        model.setProductId(item.getProduct() != null ? item.getProduct().getId() : null);
        model.setVendorId(item.getVendor() != null ? item.getVendor().getId() : null);
        model.setQuantity(item.getQuantity());
        model.setUnitPrice(item.getUnitPrice());
        model.setDiscountPercentage(item.getDiscountPercentage());
        model.setTaxPercentage(item.getTaxPercentage());
        model.setLineTotal(item.getLineTotal());
        model.setCreatedAt(item.getCreatedAt());
		model.setProductName(item.getProduct() != null ? item.getProduct().getName() : null);
		model.setVendorName(item.getVendor() != null ? item.getVendor().getName() : null);
        return model;
    }
}
