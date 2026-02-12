package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.Order;
import com.echohealthcare.mvps.domain.OrderItem;
import com.echohealthcare.mvps.domain.VendorProduct;
import com.echohealthcare.mvps.domain.VendorStockMovement;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.repository.OrderItemRepository;
import com.echohealthcare.mvps.repository.OrderRepository;
import com.echohealthcare.mvps.repository.VendorProductRepository;
import com.echohealthcare.mvps.repository.CustomerRepository;
import com.echohealthcare.mvps.repository.VendorRepository;
import com.echohealthcare.mvps.repository.VendorStockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final VendorProductRepository vendorProductRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final VendorRepository vendorRepository;
    private final VendorStockMovementRepository vendorStockMovementRepository;

    public AnalyticsService(VendorProductRepository vendorProductRepository,
                            OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            CustomerRepository customerRepository,
                            VendorRepository vendorRepository,
                            VendorStockMovementRepository vendorStockMovementRepository) {
        this.vendorProductRepository = vendorProductRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.vendorRepository = vendorRepository;
        this.vendorStockMovementRepository = vendorStockMovementRepository;
    }

    public AnalyticsExpiringProductsGet200Response getExpiringProducts(int days) {
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(days);

        List<VendorProduct> products = vendorProductRepository.findAll();

        AnalyticsExpiringProductsGet200Response response = new AnalyticsExpiringProductsGet200Response();
        response.setSuccess(true);

        products.stream()
                .filter(vp -> vp.getExpiryDate() != null
                        && !vp.getExpiryDate().isBefore(today)
                        && !vp.getExpiryDate().isAfter(threshold)
                        && vp.getStockQuantity() != null
                        && vp.getStockQuantity() > 0)
                .sorted(Comparator.comparing(VendorProduct::getExpiryDate))
                .forEach(vp -> {
                    ExpiringProduct ep = new ExpiringProduct();
                    ep.setVendorProductId(vp.getId());
					ep.setProductName(vp.getProduct() != null ? vp.getProduct().getName() : null);
					ep.setVendorName(vp.getVendor() != null ? vp.getVendor().getName() : null);
                    ep.setStockQuantity(vp.getStockQuantity());
                    ep.setExpiryDate(vp.getExpiryDate());
                    ep.setDaysToExpiry((int) (vp.getExpiryDate().toEpochDay() - today.toEpochDay()));
                    response.addDataItem(ep);
                });

        return response;
    }

    public AnalyticsInventoryStatusGet200Response getInventoryStatus(int lowStockThreshold) {
        List<VendorProduct> products = vendorProductRepository.findAll();

        Map<Integer, InventoryStatusProductsInner> perProduct = new HashMap<>();

        for (VendorProduct vp : products) {
            if (vp.getProduct() == null) {
                continue;
            }
            Integer productId = vp.getProduct().getId();
            InventoryStatusProductsInner entry = perProduct.computeIfAbsent(productId, id -> {
                InventoryStatusProductsInner i = new InventoryStatusProductsInner();
                i.setProductId(id);
				i.setProductName(vp.getProduct().getName());
                i.setTotalStock(0);
                i.setVendorsCarrying(0);
                return i;
            });

            int stock = vp.getStockQuantity() != null ? vp.getStockQuantity() : 0;
            entry.setTotalStock((entry.getTotalStock() != null ? entry.getTotalStock() : 0) + stock);
            entry.setVendorsCarrying((entry.getVendorsCarrying() != null ? entry.getVendorsCarrying() : 0) + 1);
        }

        InventoryStatus status = new InventoryStatus();
        status.setTotalProducts(perProduct.size());
        int totalStock = perProduct.values().stream()
                .mapToInt(p -> p.getTotalStock() != null ? p.getTotalStock() : 0)
                .sum();
        status.setTotalStock(totalStock);

        int lowStock = (int) perProduct.values().stream()
                .filter(p -> {
                    int stock = p.getTotalStock() != null ? p.getTotalStock() : 0;
                    return stock > 0 && stock <= lowStockThreshold;
                })
                .count();
        status.setLowStockProducts(lowStock);

        int outOfStock = (int) perProduct.values().stream()
                .filter(p -> p.getTotalStock() == null || p.getTotalStock() == 0)
                .count();
        status.setOutOfStock(outOfStock);

        status.setProducts(perProduct.values().stream()
                .sorted(Comparator.comparing(InventoryStatusProductsInner::getProductName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList()));

        AnalyticsInventoryStatusGet200Response response = new AnalyticsInventoryStatusGet200Response();
        response.setSuccess(true);
        response.setData(status);
        return response;
    }

    public AnalyticsSalesSummaryGet200Response getSalesSummary(LocalDate fromDate, LocalDate toDate, String groupBy) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderDate() != null
                        && !o.getOrderDate().isBefore(from)
                        && !o.getOrderDate().isAfter(to))
                .collect(Collectors.toList());

        SalesSummary summary = new SalesSummary();

        int totalOrders = orders.size();
        summary.setTotalOrders(totalOrders);

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getFinalAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalRevenue(totalRevenue);

        if (totalOrders > 0) {
            summary.setAvgOrderValue(totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP));
        }

        int onlineOrders = (int) orders.stream()
                .filter(o -> "online".equalsIgnoreCase(o.getOrderType()))
                .count();
        summary.setOnlineOrders(onlineOrders);

        int d2dOrders = (int) orders.stream()
                .filter(o -> "door_to_door".equalsIgnoreCase(o.getOrderType()) || "door-to-door".equalsIgnoreCase(o.getOrderType()))
                .count();
        summary.setDoorToDoorOrders(d2dOrders);

        Map<String, SalesSummaryPeriodDataInner> periodMap = new HashMap<>();
        DateTimeFormatter formatter;
        switch (groupBy == null ? "day" : groupBy.toLowerCase()) {
            case "week":
                formatter = DateTimeFormatter.ofPattern("YYYY-'W'ww");
                break;
            case "month":
                formatter = DateTimeFormatter.ofPattern("yyyy-MM");
                break;
            default:
                formatter = DateTimeFormatter.ISO_LOCAL_DATE;
                break;
        }

        for (Order order : orders) {
            if (order.getOrderDate() == null) {
                continue;
            }
            String key = order.getOrderDate().toLocalDate().format(formatter);
            SalesSummaryPeriodDataInner period = periodMap.computeIfAbsent(key, k -> {
                SalesSummaryPeriodDataInner p = new SalesSummaryPeriodDataInner();
                p.setPeriod(k);
                p.setOrders(0);
                p.setRevenue(BigDecimal.ZERO);
                return p;
            });

            period.setOrders((period.getOrders() != null ? period.getOrders() : 0) + 1);
            if (order.getFinalAmount() != null) {
                period.setRevenue(period.getRevenue().add(order.getFinalAmount()));
            }
        }

        summary.setPeriodData(periodMap.values().stream()
                .sorted(Comparator.comparing(SalesSummaryPeriodDataInner::getPeriod))
                .collect(Collectors.toList()));

        AnalyticsSalesSummaryGet200Response response = new AnalyticsSalesSummaryGet200Response();
        response.setSuccess(true);
        response.setData(summary);
        return response;
    }

    public AnalyticsTopCustomersGet200Response getTopCustomers(LocalDate fromDate, LocalDate toDate, int limit) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        List<Order> orders = orderRepository.findAll();

        Map<Integer, TopCustomer> topMap = new HashMap<>();

        for (Order order : orders) {
            if (order.getOrderDate() == null) {
                continue;
            }
            if (from != null && order.getOrderDate().isBefore(from)) {
                continue;
            }
            if (to != null && order.getOrderDate().isAfter(to)) {
                continue;
            }
            if (order.getCustomer() == null || order.getCustomer().getId() == null) {
                continue;
            }
            Integer customerId = order.getCustomer().getId();

            TopCustomer tc = topMap.computeIfAbsent(customerId, id -> {
                TopCustomer t = new TopCustomer();
                t.setCustomerId(id);
				t.setCustomerName(order.getCustomer().getName());
                t.setCustomerType(order.getCustomer().getCustomerType());
                t.setTotalOrders(0);
                t.setTotalSpent(BigDecimal.ZERO);
                return t;
            });

            tc.setTotalOrders((tc.getTotalOrders() != null ? tc.getTotalOrders() : 0) + 1);
            if (order.getFinalAmount() != null) {
                tc.setTotalSpent(tc.getTotalSpent().add(order.getFinalAmount()));
            }
        }

        List<TopCustomer> sorted = topMap.values().stream()
                .sorted(Comparator.comparing(TopCustomer::getTotalSpent, Comparator.nullsFirst(BigDecimal::compareTo)).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        AnalyticsTopCustomersGet200Response response = new AnalyticsTopCustomersGet200Response();
        response.setSuccess(true);
        response.setData(sorted);
        return response;
    }

    public java.util.List<StockHistoryEntry> getStockHistory() {
        java.util.List<VendorStockMovement> movements = vendorStockMovementRepository.findAll();

        return movements.stream()
                .sorted(Comparator.comparing(VendorStockMovement::getChangedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .map(movement -> {
                    StockHistoryEntry entry = new StockHistoryEntry();
                    entry.setVendorProductId(movement.getVendorProduct() != null ? movement.getVendorProduct().getId() : null);
                    if (movement.getVendorProduct() != null) {
                        if (movement.getVendorProduct().getProduct() != null) {
                            entry.setProductId(movement.getVendorProduct().getProduct().getId());
                            entry.setProductName(movement.getVendorProduct().getProduct().getName());
                        }
                        if (movement.getVendorProduct().getVendor() != null) {
                            entry.setVendorId(movement.getVendorProduct().getVendor().getId());
                            entry.setVendorName(movement.getVendorProduct().getVendor().getName());
                        }
                        entry.setVendorSku(movement.getVendorProduct().getVendorSku());
                    }
                    entry.setPreviousQuantity(movement.getPreviousQuantity());
                    entry.setNewQuantity(movement.getNewQuantity());
                    entry.setChangeAmount(movement.getChangeAmount());
                    entry.setChangedAt(movement.getChangedAt());
                    return entry;
                })
                .collect(Collectors.toList());
    }

    public AnalyticsTopProductsGet200Response getTopProducts(LocalDate fromDate, LocalDate toDate, int limit, String sortBy) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        List<OrderItem> items = orderItemRepository.findAll();

        Map<Integer, TopProduct> topMap = new HashMap<>();

        for (OrderItem item : items) {
            if (item.getOrder() == null || item.getOrder().getOrderDate() == null) {
                continue;
            }
            LocalDateTime od = item.getOrder().getOrderDate();
            if (from != null && od.isBefore(from)) {
                continue;
            }
            if (to != null && od.isAfter(to)) {
                continue;
            }
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                continue;
            }
            Integer productId = item.getProduct().getId();

            TopProduct tp = topMap.computeIfAbsent(productId, id -> {
                TopProduct t = new TopProduct();
                t.setProductId(id);
				t.setProductName(item.getProduct().getName());
                t.setUnitsSold(0);
                t.setTotalRevenue(BigDecimal.ZERO);
                t.setTimesOrdered(0);
                return t;
            });

            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            tp.setUnitsSold((tp.getUnitsSold() != null ? tp.getUnitsSold() : 0) + qty);
            if (item.getLineTotal() != null) {
                tp.setTotalRevenue(tp.getTotalRevenue().add(item.getLineTotal()));
            }
            tp.setTimesOrdered((tp.getTimesOrdered() != null ? tp.getTimesOrdered() : 0) + 1);
        }

        List<TopProduct> sorted = topMap.values().stream()
                .sorted((a, b) -> {
                    Comparator<BigDecimal> bigDecimalComparator = Comparator.nullsFirst(BigDecimal::compareTo);
                    Comparator<Integer> intComparator = Comparator.nullsFirst(Integer::compareTo);
                    if ("quantity".equalsIgnoreCase(sortBy)) {
                        return intComparator.compare(a.getUnitsSold(), b.getUnitsSold()) * -1;
                    }
                    return bigDecimalComparator.compare(a.getTotalRevenue(), b.getTotalRevenue()) * -1;
                })
                .limit(limit)
                .collect(Collectors.toList());

        AnalyticsTopProductsGet200Response response = new AnalyticsTopProductsGet200Response();
        response.setSuccess(true);
        response.setData(sorted);
        return response;
    }

    public AnalyticsVendorRevenueGet200Response getVendorRevenue(LocalDate fromDate, LocalDate toDate) {
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime to = toDate != null ? toDate.atTime(23, 59, 59) : null;

        List<OrderItem> items = orderItemRepository.findAll();

        Map<Integer, VendorRevenue> revenueMap = new HashMap<>();

        for (OrderItem item : items) {
            if (item.getOrder() == null || item.getOrder().getOrderDate() == null) {
                continue;
            }
            LocalDateTime od = item.getOrder().getOrderDate();
            if (from != null && od.isBefore(from)) {
                continue;
            }
            if (to != null && od.isAfter(to)) {
                continue;
            }
            if (item.getVendor() == null || item.getVendor().getId() == null) {
                continue;
            }
            Integer vendorId = item.getVendor().getId();

            VendorRevenue vr = revenueMap.computeIfAbsent(vendorId, id -> {
                VendorRevenue v = new VendorRevenue();
                v.setVendorId(id);
				v.setVendorName(item.getVendor().getName());
                v.setOrdersFulfilled(0);
                v.setUnitsSold(0);
                v.setTotalRevenue(BigDecimal.ZERO);
                return v;
            });

            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            vr.setUnitsSold((vr.getUnitsSold() != null ? vr.getUnitsSold() : 0) + qty);
            if (item.getLineTotal() != null) {
                vr.setTotalRevenue(vr.getTotalRevenue().add(item.getLineTotal()));
            }
            vr.setOrdersFulfilled((vr.getOrdersFulfilled() != null ? vr.getOrdersFulfilled() : 0) + 1);
        }

        List<VendorRevenue> sorted = revenueMap.values().stream()
                .sorted(Comparator.comparing(VendorRevenue::getTotalRevenue, Comparator.nullsFirst(BigDecimal::compareTo)).reversed())
                .collect(Collectors.toList());

        AnalyticsVendorRevenueGet200Response response = new AnalyticsVendorRevenueGet200Response();
        response.setSuccess(true);
        response.setData(sorted);
        return response;
    }

    public VendorsPerformanceGet200Response getVendorPerformance() {
        List<VendorProduct> allVendorProducts = vendorProductRepository.findAll();

        Map<Integer, VendorPerformance> byVendor = new HashMap<>();
        Map<Integer, Integer> productCountByVendor = new HashMap<>();
        Map<Integer, BigDecimal> totalPriceByVendor = new HashMap<>();
        Map<Integer, Integer> priceCountByVendor = new HashMap<>();

        Map<Integer, BigDecimal> minPriceByProduct = new HashMap<>();

        for (VendorProduct vp : allVendorProducts) {
            if (vp.getVendor() == null || vp.getVendor().getId() == null || vp.getProduct() == null
                    || vp.getProduct().getId() == null) {
                continue;
            }

            Integer vendorId = vp.getVendor().getId();
            Integer productId = vp.getProduct().getId();

            VendorPerformance perf = byVendor.computeIfAbsent(vendorId, id -> {
                VendorPerformance v = new VendorPerformance();
                v.setVendorId(id);
                v.setVendorName(vp.getVendor().getName());
                v.setTotalProducts(0);
                v.setTotalStock(0);
                v.setProductsWithLowestPrice(0);
                return v;
            });

            productCountByVendor.merge(vendorId, 1, Integer::sum);

            int stock = vp.getStockQuantity() != null ? vp.getStockQuantity() : 0;
            perf.setTotalStock((perf.getTotalStock() != null ? perf.getTotalStock() : 0) + stock);

            if (vp.getFinalPrice() != null) {
                totalPriceByVendor.merge(vendorId, vp.getFinalPrice(), BigDecimal::add);
                priceCountByVendor.merge(vendorId, 1, Integer::sum);
            }

            if (Boolean.TRUE.equals(vp.getAvailable()) && vp.getStockQuantity() != null && vp.getStockQuantity() > 0
                    && vp.getFinalPrice() != null) {
                minPriceByProduct.merge(productId, vp.getFinalPrice(), (oldVal, newVal) -> oldVal.min(newVal));
            }
        }

        Map<Integer, java.util.Set<Integer>> lowestPriceProductsByVendor = new HashMap<>();

        for (VendorProduct vp : allVendorProducts) {
            if (vp.getVendor() == null || vp.getVendor().getId() == null || vp.getProduct() == null
                    || vp.getProduct().getId() == null || vp.getFinalPrice() == null) {
                continue;
            }
            if (!Boolean.TRUE.equals(vp.getAvailable()) || vp.getStockQuantity() == null || vp.getStockQuantity() <= 0) {
                continue;
            }

            Integer vendorId = vp.getVendor().getId();
            Integer productId = vp.getProduct().getId();
            BigDecimal minPrice = minPriceByProduct.get(productId);
            if (minPrice != null && vp.getFinalPrice().compareTo(minPrice) == 0) {
                lowestPriceProductsByVendor
                        .computeIfAbsent(vendorId, id -> new java.util.HashSet<>())
                        .add(productId);
            }
        }

        for (Map.Entry<Integer, VendorPerformance> entry : byVendor.entrySet()) {
            Integer vendorId = entry.getKey();
            VendorPerformance perf = entry.getValue();

            perf.setTotalProducts(productCountByVendor.getOrDefault(vendorId, 0));

            BigDecimal totalPrice = totalPriceByVendor.get(vendorId);
            Integer count = priceCountByVendor.get(vendorId);
            if (totalPrice != null && count != null && count > 0) {
                perf.setAvgPrice(totalPrice.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP));
            }

            java.util.Set<Integer> lowestSet = lowestPriceProductsByVendor.get(vendorId);
            perf.setProductsWithLowestPrice(lowestSet != null ? lowestSet.size() : 0);
        }

        List<VendorPerformance> result = byVendor.values().stream()
                .sorted(Comparator.comparing(VendorPerformance::getVendorName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());

        VendorsPerformanceGet200Response response = new VendorsPerformanceGet200Response();
        response.setSuccess(true);
        response.setData(result);
        return response;
    }
}
