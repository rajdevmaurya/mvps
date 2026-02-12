package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.Customer;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.repository.CustomerRepository;
import com.echohealthcare.mvps.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    public CustomerService(CustomerRepository customerRepository,
                           OrderRepository orderRepository) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
    }

    public CustomersGet200Response getCustomers(String customerType,
                                                Boolean isActive,
                                                String city,
                                                String search,
                                                int page,
                                                int limit) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), limit);
        Page<Customer> customerPage = customerRepository.findAll(pageable);

        CustomersGet200Response response = new CustomersGet200Response();
        response.setSuccess(true);
        customerPage.getContent().forEach(c -> response.addDataItem(mapToModel(c)));

        Pagination pagination = new Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
		pagination.setTotalItems((int) customerPage.getTotalElements());
		pagination.setTotalPages(customerPage.getTotalPages());
        response.setPagination(pagination);
        return response;
    }

    public CustomersPost201Response createCustomer(CustomerCreate request) {
        Customer customer = new Customer();
        applyCreate(request, customer);
        Customer saved = customerRepository.save(customer);

        CustomersPost201Response response = new CustomersPost201Response();
        response.setSuccess(true);
        response.setMessage("Customer created successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public CustomersCustomerIdGet200Response getCustomerById(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        CustomersCustomerIdGet200Response response = new CustomersCustomerIdGet200Response();
        response.setSuccess(true);
        response.setData(mapToModel(customer));
        return response;
    }

    public CustomersCustomerIdPut200Response updateCustomer(Integer customerId, CustomerUpdate request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        applyUpdate(request, customer);
        Customer saved = customerRepository.save(customer);

        CustomersCustomerIdPut200Response response = new CustomersCustomerIdPut200Response();
        response.setSuccess(true);
        response.setMessage("Customer updated successfully");
        response.setData(mapToModel(saved));
        return response;
    }

    public CustomersCustomerIdDelete200Response deleteCustomer(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        customer.setActive(false);
        customerRepository.save(customer);

        CustomersCustomerIdDelete200Response response = new CustomersCustomerIdDelete200Response();
        response.setSuccess(true);
        response.setMessage("Customer deleted successfully");
        return response;
    }

    public CustomersCustomerIdOrdersGet200Response getCustomerOrders(Integer customerId,
                                                                     String orderStatus,
                                                                     LocalDate fromDate,
                                                                     LocalDate toDate) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        // reuse OrderService-style projection via repository search
        var page = orderRepository.search(customerId, orderStatus, null, null, from, to, Pageable.unpaged());

        CustomersCustomerIdOrdersGet200Response response = new CustomersCustomerIdOrdersGet200Response();
        response.setSuccess(true);
        page.getContent().forEach(order -> {
            com.echohealthcare.mvps.model.Order model = new com.echohealthcare.mvps.model.Order();
            model.orderId(order.getId());
            model.orderNumber(order.getOrderNumber());
            model.customerId(order.getCustomer() != null ? order.getCustomer().getId() : null);
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
            model.orderDate(order.getOrderDate());
            model.totalAmount(order.getTotalAmount());
            model.discountAmount(order.getDiscountAmount());
            model.taxAmount(order.getTaxAmount());
            model.finalAmount(order.getFinalAmount());
            model.deliveryAddress(order.getDeliveryAddress());
            model.notes(order.getNotes());
            model.createdAt(order.getCreatedAt());
            model.updatedAt(order.getUpdatedAt());
            response.addDataItem(model);
        });
        return response;
    }

    private void applyCreate(CustomerCreate request, Customer customer) {
        customer.setName(request.getCustomerName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPincode(request.getPincode());
        customer.setCustomerType(request.getCustomerType() != null ? request.getCustomerType().getValue() : null);
        customer.setActive(Boolean.TRUE.equals(request.getIsActive()));
    }

    private void applyUpdate(CustomerUpdate request, Customer customer) {
        if (request.getCustomerName() != null) {
            customer.setName(request.getCustomerName());
        }
        if (request.getEmail() != null) {
            customer.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            customer.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            customer.setCity(request.getCity());
        }
        if (request.getState() != null) {
            customer.setState(request.getState());
        }
        if (request.getPincode() != null) {
            customer.setPincode(request.getPincode());
        }
        if (request.getCustomerType() != null) {
            customer.setCustomerType(request.getCustomerType().getValue());
        }
        if (request.getIsActive() != null) {
            customer.setActive(request.getIsActive());
        }
    }

    private com.echohealthcare.mvps.model.Customer mapToModel(Customer entity) {
        com.echohealthcare.mvps.model.Customer model = new com.echohealthcare.mvps.model.Customer();
        model.customerId(entity.getId());
        model.customerName(entity.getName());
        model.email(entity.getEmail());
        model.phone(entity.getPhone());
        model.address(entity.getAddress());
        model.city(entity.getCity());
        model.state(entity.getState());
        model.pincode(entity.getPincode());
        if (entity.getCustomerType() != null) {
            try {
                model.setCustomerType(com.echohealthcare.mvps.model.Customer.CustomerTypeEnum.fromValue(entity.getCustomerType()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        model.registrationDate(entity.getRegistrationDate());
        model.isActive(entity.getActive());
        return model;
    }
}
