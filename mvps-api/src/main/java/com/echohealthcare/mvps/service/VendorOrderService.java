package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.VendorOrder;
import com.echohealthcare.mvps.model.Pagination;
import com.echohealthcare.mvps.model.VendorOrderCreate;
import com.echohealthcare.mvps.model.VendorOrderUpdate;
import com.echohealthcare.mvps.model.VendorOrdersGet200Response;
import com.echohealthcare.mvps.model.VendorOrdersPost201Response;
import com.echohealthcare.mvps.model.VendorOrdersVendorOrderIdDelete200Response;
import com.echohealthcare.mvps.model.VendorOrdersVendorOrderIdGet200Response;
import com.echohealthcare.mvps.model.VendorOrdersVendorOrderIdPut200Response;
import com.echohealthcare.mvps.repository.VendorOrderRepository;
import com.echohealthcare.mvps.repository.VendorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class VendorOrderService {

    private final VendorOrderRepository vendorOrderRepository;
    private final VendorRepository vendorRepository;

    public VendorOrderService(VendorOrderRepository vendorOrderRepository,
                              VendorRepository vendorRepository) {
        this.vendorOrderRepository = vendorOrderRepository;
        this.vendorRepository = vendorRepository;
    }

    public VendorOrdersGet200Response getVendorOrders(Integer vendorId,
                                                      String status,
                                                      LocalDate fromDate,
                                                      LocalDate toDate,
                                                      int page,
                                                      int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), limit);
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        Page<VendorOrder> orderPage = vendorOrderRepository.search(vendorId, status, from, to, pageable);

        VendorOrdersGet200Response response = new VendorOrdersGet200Response();
        response.setSuccess(true);
        orderPage.getContent().forEach(vo -> response.addDataItem(mapToModel(vo)));

        Pagination pagination = new Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
		pagination.setTotalItems((int) orderPage.getTotalElements());
		pagination.setTotalPages(orderPage.getTotalPages());
        response.setPagination(pagination);
        return response;
    }

    public VendorOrdersPost201Response createVendorOrder(VendorOrderCreate request) {
        VendorOrder vendorOrder = new VendorOrder();
        vendorOrder.setVendor(vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found")));
        vendorOrder.setPoNumber(generatePoNumber());
        vendorOrder.setTotalAmount(request.getTotalAmount());
        vendorOrder.setStatus("pending");
        vendorOrder.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        vendorOrder.setNotes(request.getNotes());

        VendorOrder saved = vendorOrderRepository.save(vendorOrder);

        VendorOrdersPost201Response response = new VendorOrdersPost201Response();
        response.setSuccess(true);
        response.setMessage("Vendor order created successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public VendorOrdersVendorOrderIdGet200Response getVendorOrder(Integer vendorOrderId) {
        VendorOrder vendorOrder = vendorOrderRepository.findById(vendorOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor order not found"));

        VendorOrdersVendorOrderIdGet200Response response = new VendorOrdersVendorOrderIdGet200Response();
        response.setSuccess(true);
        response.setData(mapToModel(vendorOrder));
        return response;
    }

    public VendorOrdersVendorOrderIdPut200Response updateVendorOrder(Integer vendorOrderId, VendorOrderUpdate update) {
        VendorOrder vendorOrder = vendorOrderRepository.findById(vendorOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor order not found"));

        if (update.getTotalAmount() != null) {
            vendorOrder.setTotalAmount(update.getTotalAmount());
        }
        if (update.getStatus() != null) {
            vendorOrder.setStatus(update.getStatus().getValue());
        }
        if (update.getExpectedDeliveryDate() != null) {
            vendorOrder.setExpectedDeliveryDate(update.getExpectedDeliveryDate());
        }
        if (update.getActualDeliveryDate() != null) {
            vendorOrder.setActualDeliveryDate(update.getActualDeliveryDate());
        }
        if (update.getNotes() != null) {
            vendorOrder.setNotes(update.getNotes());
        }

        VendorOrder saved = vendorOrderRepository.save(vendorOrder);

        VendorOrdersVendorOrderIdPut200Response response = new VendorOrdersVendorOrderIdPut200Response();
        response.setSuccess(true);
        response.setMessage("Vendor order updated successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public VendorOrdersVendorOrderIdDelete200Response cancelVendorOrder(Integer vendorOrderId) {
        VendorOrder vendorOrder = vendorOrderRepository.findById(vendorOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor order not found"));
        vendorOrder.setStatus("cancelled");
        vendorOrderRepository.save(vendorOrder);

        VendorOrdersVendorOrderIdDelete200Response response = new VendorOrdersVendorOrderIdDelete200Response();
        response.setSuccess(true);
        response.setMessage("Vendor order cancelled successfully");
        return response;
    }

    private com.echohealthcare.mvps.model.VendorOrder mapToModel(VendorOrder vendorOrder) {
        com.echohealthcare.mvps.model.VendorOrder model = new com.echohealthcare.mvps.model.VendorOrder();
        model.setVendorOrderId(vendorOrder.getId());
        model.setVendorId(vendorOrder.getVendor() != null ? vendorOrder.getVendor().getId() : null);
        model.setPoNumber(vendorOrder.getPoNumber());
        model.setOrderDate(vendorOrder.getOrderDate());
        model.setTotalAmount(vendorOrder.getTotalAmount());
        if (vendorOrder.getStatus() != null) {
            try {
                model.setStatus(com.echohealthcare.mvps.model.VendorOrder.StatusEnum.fromValue(vendorOrder.getStatus()));
            } catch (IllegalArgumentException ignored) {
                // leave null if status does not match enum
            }
        }
        if (vendorOrder.getExpectedDeliveryDate() != null) {
            model.expectedDeliveryDate(vendorOrder.getExpectedDeliveryDate());
        }
        if (vendorOrder.getActualDeliveryDate() != null) {
            model.actualDeliveryDate(vendorOrder.getActualDeliveryDate());
        }
        if (vendorOrder.getNotes() != null) {
            model.notes(vendorOrder.getNotes());
        }
        model.setCreatedAt(vendorOrder.getCreatedAt());
        model.setUpdatedAt(vendorOrder.getUpdatedAt());
        return model;
    }

    private String generatePoNumber() {
        return "PO-" + LocalDate.now() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
