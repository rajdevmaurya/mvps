package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.Customer;
import com.echohealthcare.mvps.domain.Order;
import com.echohealthcare.mvps.domain.OrderItem;
import com.echohealthcare.mvps.domain.Product;
import com.echohealthcare.mvps.domain.VendorProduct;
import com.echohealthcare.mvps.dto.CursorPageResponse;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.repository.CustomerRepository;
import com.echohealthcare.mvps.repository.OrderItemRepository;
import com.echohealthcare.mvps.repository.OrderRepository;
import com.echohealthcare.mvps.repository.ProductRepository;
import com.echohealthcare.mvps.repository.VendorProductRepository;
import com.echohealthcare.mvps.util.CursorPaginationUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final VendorProductRepository vendorProductRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        CustomerRepository customerRepository,
                        ProductRepository productRepository,
                        VendorProductRepository vendorProductRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.vendorProductRepository = vendorProductRepository;
    }

    public OrdersGet200Response getOrders(Integer customerId,
                                          String orderStatus,
                                          String paymentStatus,
                                          String orderType,
                                          LocalDate fromDate,
                                          LocalDate toDate,
                                          String search,
                                          int page,
                                          int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), limit);
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        Page<Order> orderPage = orderRepository.search(customerId, orderStatus, paymentStatus, orderType, from, to, search, pageable);

        OrdersGet200Response response = new OrdersGet200Response();
        response.setSuccess(true);
        for (Order order : orderPage.getContent()) {
            com.echohealthcare.mvps.model.Order model = mapToOrderModel(order);
            response.addDataItem(model);
        }

        Pagination pagination = new Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
		pagination.setTotalItems((int) orderPage.getTotalElements());
		pagination.setTotalPages(orderPage.getTotalPages());
        response.setPagination(pagination);
        return response;
    }

    /**
     * Get orders using cursor-based pagination.
     */
    public CursorPageResponse<com.echohealthcare.mvps.model.Order> getOrdersByCursor(
            String cursor,
            Integer size,
            Integer customerId,
            String orderStatus,
            String paymentStatus,
            String orderType,
            LocalDate fromDate,
            LocalDate toDate) {

        int validatedSize = CursorPaginationUtils.validatePageSize(size);
        Integer decodedCursor = CursorPaginationUtils.decodeCursor(cursor);
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        Pageable pageable = PageRequest.of(0, validatedSize + 1);
        List<Order> orders = orderRepository.searchByCursor(
            decodedCursor, customerId, orderStatus, paymentStatus, orderType, from, to, pageable);

        boolean hasNext = orders.size() > validatedSize;
        List<Order> pageItems = hasNext ? orders.subList(0, validatedSize) : orders;

        Integer nextCursorValue = hasNext && !pageItems.isEmpty()
            ? pageItems.get(pageItems.size() - 1).getId()
            : null;

        List<com.echohealthcare.mvps.model.Order> responseData = pageItems.stream()
            .map(this::mapToOrderModel)
            .collect(Collectors.toList());

        return new CursorPageResponse<>(
            responseData,
            validatedSize,
            CursorPaginationUtils.encodeCursor(nextCursorValue),
            hasNext
        );
    }

    public OrdersPost201Response createOrder(OrderCreate request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderNumber(generateOrderNumber());
        order.setOrderType(request.getOrderType() != null ? request.getOrderType().getValue() : null);
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setNotes(request.getNotes());
        order.setOrderStatus("pending");
        order.setPaymentStatus("pending");

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        List<OrderItem> items = new ArrayList<>();
        for (OrderCreateItemsInner itemRequest : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);

            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            item.setProduct(product);

            Integer vendorProductId = itemRequest.getVendorProductId().orElse(null);
            VendorProduct vendorProduct;
            if (vendorProductId != null) {
                vendorProduct = vendorProductRepository.findById(vendorProductId)
                        .orElseThrow(() -> new ResourceNotFoundException("Vendor product not found"));
            } else {
                vendorProduct = selectLowestPriceVendorProduct(product.getId());
                if (vendorProduct == null) {
                    throw new ResourceNotFoundException("No vendor product available for product " + product.getId());
                }
            }
            item.setVendorProduct(vendorProduct);
            item.setVendor(vendorProduct.getVendor());

            int quantity = itemRequest.getQuantity();
            item.setQuantity(quantity);

            BigDecimal unitPrice = getEffectiveFinalPrice(vendorProduct);
            if (unitPrice == null) {
                unitPrice = vendorProduct.getCostPrice();
            }
            item.setUnitPrice(unitPrice);
            item.setDiscountPercentage(vendorProduct.getDiscountPercentage());
            item.setTaxPercentage(BigDecimal.ZERO);

            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            item.setLineTotal(lineTotal);

            totalAmount = totalAmount.add(lineTotal);

            // Accumulate discount: difference between cost price and discounted unit price
            BigDecimal discountPct = vendorProduct.getDiscountPercentage();
            if (discountPct != null && discountPct.compareTo(BigDecimal.ZERO) > 0
                    && vendorProduct.getCostPrice() != null) {
                BigDecimal fullPrice = vendorProduct.getCostPrice().multiply(BigDecimal.valueOf(quantity));
                totalDiscount = totalDiscount.add(fullPrice.subtract(lineTotal));
            }

            // Accumulate tax per item
            BigDecimal taxPct = item.getTaxPercentage();
            if (taxPct != null && taxPct.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal itemTax = lineTotal.multiply(taxPct)
                        .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                totalTax = totalTax.add(itemTax);
            }

            items.add(item);
        }

        order.setTotalAmount(totalAmount);
        order.setDiscountAmount(totalDiscount);
        order.setTaxAmount(totalTax);
        order.setFinalAmount(totalAmount.subtract(totalDiscount).add(totalTax));

        order.setItems(items);
        Order savedOrder = orderRepository.save(order);

        OrdersPost201Response response = new OrdersPost201Response();
        response.setSuccess(true);
        response.setMessage("Order created successfully");
        response.setData(mapToOrderWithItems(savedOrder));
        return response;
    }

    public OrdersOrderIdGet200Response getOrderById(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        OrdersOrderIdGet200Response response = new OrdersOrderIdGet200Response();
        response.setSuccess(true);
        response.setData(mapToOrderWithItems(order));
        return response;
    }

    public OrdersOrderIdPut200Response updateOrder(Integer orderId, OrderUpdate request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (request.getOrderStatus() != null) {
            order.setOrderStatus(request.getOrderStatus().getValue());
        }
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(request.getPaymentStatus().getValue());
        }
        if (request.getDeliveryAddress() != null) {
            order.setDeliveryAddress(request.getDeliveryAddress());
        }
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        if (request.getDiscountAmount() != null) {
            order.setDiscountAmount(request.getDiscountAmount());
        }
        if (request.getTaxAmount() != null) {
            order.setTaxAmount(request.getTaxAmount());
        }
        if (order.getTotalAmount() != null) {
            BigDecimal finalAmount = order.getTotalAmount();
            if (order.getDiscountAmount() != null) {
                finalAmount = finalAmount.subtract(order.getDiscountAmount());
            }
            if (order.getTaxAmount() != null) {
                finalAmount = finalAmount.add(order.getTaxAmount());
            }
            order.setFinalAmount(finalAmount);
        }

        Order saved = orderRepository.save(order);

        OrdersOrderIdPut200Response response = new OrdersOrderIdPut200Response();
        response.setSuccess(true);
        response.setMessage("Order updated successfully");
        response.setData(mapToOrderModel(saved));
        return response;
    }

    public OrdersOrderIdDelete200Response cancelOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setOrderStatus("cancelled");
        orderRepository.save(order);

        OrdersOrderIdDelete200Response response = new OrdersOrderIdDelete200Response();
        response.setSuccess(true);
        response.setMessage("Order cancelled successfully");
        return response;
    }

    public OrdersOrderIdPaymentStatusPatch200Response updatePaymentStatus(Integer orderId,
                                                                          OrdersOrderIdPaymentStatusPatchRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setPaymentStatus(request.getPaymentStatus().getValue());
        Order saved = orderRepository.save(order);

        OrdersOrderIdPaymentStatusPatch200Response response = new OrdersOrderIdPaymentStatusPatch200Response();
        response.setSuccess(true);
        response.setMessage("Payment status updated successfully");
        response.setData(mapToOrderModel(saved));
        return response;
    }

    public OrdersOrderIdStatusPatch200Response updateOrderStatus(Integer orderId,
                                                                 OrdersOrderIdStatusPatchRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setOrderStatus(request.getOrderStatus().getValue());
        Order saved = orderRepository.save(order);

        OrdersOrderIdStatusPatch200Response response = new OrdersOrderIdStatusPatch200Response();
        response.setSuccess(true);
        response.setMessage("Order status updated successfully");
        response.setData(mapToOrderModel(saved));
        return response;
    }

    private com.echohealthcare.mvps.model.Order mapToOrderModel(Order order) {
        com.echohealthcare.mvps.model.Order model = new com.echohealthcare.mvps.model.Order();
        model.setOrderId(order.getId());
        model.setOrderNumber(order.getOrderNumber());
        model.setCustomerId(order.getCustomer() != null ? order.getCustomer().getId() : null);
        if (order.getOrderType() != null) {
            try {
                model.setOrderType(com.echohealthcare.mvps.model.Order.OrderTypeEnum.fromValue(order.getOrderType()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (order.getOrderStatus() != null) {
            try {
                model.setOrderStatus(com.echohealthcare.mvps.model.Order.OrderStatusEnum.fromValue(order.getOrderStatus()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (order.getPaymentStatus() != null) {
            try {
                model.setPaymentStatus(com.echohealthcare.mvps.model.Order.PaymentStatusEnum.fromValue(order.getPaymentStatus()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        model.setOrderDate(order.getOrderDate());
        model.setTotalAmount(order.getTotalAmount());
        model.setDiscountAmount(order.getDiscountAmount());
        model.setTaxAmount(order.getTaxAmount());
        model.setFinalAmount(order.getFinalAmount());
        if (order.getDeliveryAddress() != null) {
            model.deliveryAddress(order.getDeliveryAddress());
        }
        if (order.getNotes() != null) {
            model.notes(order.getNotes());
        }
        model.setCreatedAt(order.getCreatedAt());
        model.setUpdatedAt(order.getUpdatedAt());
        return model;
    }

    private OrderWithItems mapToOrderWithItems(Order order) {
        OrderWithItems dto = new OrderWithItems();
        dto.setOrderId(order.getId());
        dto.setCustomerId(order.getCustomer() != null ? order.getCustomer().getId() : null);
        dto.setOrderNumber(order.getOrderNumber());
        dto.setOrderDate(order.getOrderDate());
        if (order.getOrderType() != null) {
            try {
                dto.setOrderType(OrderWithItems.OrderTypeEnum.fromValue(order.getOrderType()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        dto.setTotalAmount(order.getTotalAmount());
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setFinalAmount(order.getFinalAmount());
        if (order.getPaymentStatus() != null) {
            try {
                dto.setPaymentStatus(OrderWithItems.PaymentStatusEnum.fromValue(order.getPaymentStatus()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (order.getOrderStatus() != null) {
            try {
                dto.setOrderStatus(OrderWithItems.OrderStatusEnum.fromValue(order.getOrderStatus()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        if (order.getDeliveryAddress() != null) {
			dto.deliveryAddress(order.getDeliveryAddress());
        }
        if (order.getNotes() != null) {
			dto.notes(order.getNotes());
        }
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        List<com.echohealthcare.mvps.model.OrderItem> itemDtos = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                com.echohealthcare.mvps.model.OrderItem m = new com.echohealthcare.mvps.model.OrderItem();
                m.setOrderItemId(item.getId());
                m.setOrderId(order.getId());
                m.setVendorProductId(item.getVendorProduct() != null ? item.getVendorProduct().getId() : null);
                m.setProductId(item.getProduct() != null ? item.getProduct().getId() : null);
                m.setVendorId(item.getVendor() != null ? item.getVendor().getId() : null);
                m.setQuantity(item.getQuantity());
                m.setUnitPrice(item.getUnitPrice());
                m.setDiscountPercentage(item.getDiscountPercentage());
                m.setTaxPercentage(item.getTaxPercentage());
                m.setLineTotal(item.getLineTotal());
                m.setCreatedAt(item.getCreatedAt());
                if (item.getProduct() != null) {
                    m.setProductName(item.getProduct().getName());
                }
                if (item.getVendor() != null) {
                    m.setVendorName(item.getVendor().getName());
                }
                itemDtos.add(m);
            }
        }
        dto.setItems(itemDtos);

        if (order.getCustomer() != null) {
            Customer customer = order.getCustomer();
            com.echohealthcare.mvps.model.Customer c = new com.echohealthcare.mvps.model.Customer();
            c.setCustomerId(customer.getId());
            c.setCustomerName(customer.getName());
            c.setEmail(customer.getEmail());
            c.setPhone(customer.getPhone());
            c.setAddress(customer.getAddress());
            c.setCity(customer.getCity());
            c.setState(customer.getState());
            c.setPincode(customer.getPincode());
            if (customer.getCustomerType() != null) {
                try {
                    c.setCustomerType(com.echohealthcare.mvps.model.Customer.CustomerTypeEnum.fromValue(customer.getCustomerType()));
                } catch (IllegalArgumentException ignored) {
                }
            }
            c.setRegistrationDate(customer.getRegistrationDate());
            c.setIsActive(customer.getActive());
            dto.setCustomer(c);
        }

        return dto;
    }

    private VendorProduct selectLowestPriceVendorProduct(Integer productId) {
        List<VendorProduct> candidates = vendorProductRepository.search(null, productId, true, null, null, Pageable.unpaged()).getContent();
        return candidates.stream()
                .filter(vp -> vp.getStockQuantity() != null && vp.getStockQuantity() > 0)
                .min(Comparator.comparing(this::getEffectiveFinalPriceSafe))
                .orElse(null);
    }

    private BigDecimal getEffectiveFinalPriceSafe(VendorProduct vp) {
        BigDecimal price = getEffectiveFinalPrice(vp);
        if (price == null) {
            return vp.getCostPrice();
        }
        return price;
    }

    private BigDecimal getEffectiveFinalPrice(VendorProduct vp) {
        if (vp.getFinalPrice() != null) {
            return vp.getFinalPrice();
        }
        if (vp.getCostPrice() == null) {
            return null;
        }
        BigDecimal discount = vp.getDiscountPercentage() != null ? vp.getDiscountPercentage() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) <= 0) {
            return vp.getCostPrice();
        }
        BigDecimal hundred = BigDecimal.valueOf(100);
        BigDecimal factor = hundred.subtract(discount).divide(hundred, 10, java.math.RoundingMode.HALF_UP);
        return vp.getCostPrice().multiply(factor).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String generateOrderNumber() {
        return "ORD-" + LocalDate.now() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
