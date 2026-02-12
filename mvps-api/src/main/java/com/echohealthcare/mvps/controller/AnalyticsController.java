package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.AnalyticsApi;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class AnalyticsController implements AnalyticsApi {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Override
    public ResponseEntity<AnalyticsExpiringProductsGet200Response> analyticsExpiringProductsGet(Integer days) {
        return ResponseEntity.ok(analyticsService.getExpiringProducts(days != null ? days : 30));
    }

    @Override
    public ResponseEntity<AnalyticsInventoryStatusGet200Response> analyticsInventoryStatusGet(Integer lowStockThreshold) {
        return ResponseEntity.ok(analyticsService.getInventoryStatus(lowStockThreshold != null ? lowStockThreshold : 50));
    }

    @Override
    public ResponseEntity<AnalyticsSalesSummaryGet200Response> analyticsSalesSummaryGet(LocalDate fromDate,
                                                                                       LocalDate toDate,
                                                                                       String groupBy) {
        return ResponseEntity.ok(analyticsService.getSalesSummary(fromDate, toDate, groupBy));
    }

    @Override
    public ResponseEntity<AnalyticsTopCustomersGet200Response> analyticsTopCustomersGet(LocalDate fromDate,
                                                                                         LocalDate toDate,
                                                                                         Integer limit) {
        return ResponseEntity.ok(analyticsService.getTopCustomers(fromDate, toDate, limit != null ? limit : 10));
    }

    @Override
    public ResponseEntity<AnalyticsTopProductsGet200Response> analyticsTopProductsGet(LocalDate fromDate,
                                                                                       LocalDate toDate,
                                                       Integer limit,
                                                       String sortBy) {
        return ResponseEntity.ok(analyticsService.getTopProducts(fromDate, toDate, limit != null ? limit : 10, sortBy));
    }

    @Override
    public ResponseEntity<AnalyticsVendorRevenueGet200Response> analyticsVendorRevenueGet(LocalDate fromDate,
                                                                                           LocalDate toDate) {
        return ResponseEntity.ok(analyticsService.getVendorRevenue(fromDate, toDate));
    }

    @org.springframework.web.bind.annotation.GetMapping("/analytics/stock-history")
    public ResponseEntity<java.util.List<StockHistoryEntry>> analyticsStockHistoryGet() {
        return ResponseEntity.ok(analyticsService.getStockHistory());
    }
}
