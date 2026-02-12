package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.SearchApi;
import com.echohealthcare.mvps.domain.Vendor;
import com.echohealthcare.mvps.model.LowestPriceProduct;
import com.echohealthcare.mvps.model.SearchVendorsGet200Response;
import com.echohealthcare.mvps.model.VendorProductsLowestPricesGet200Response;
import com.echohealthcare.mvps.service.VendorProductService;
import com.echohealthcare.mvps.repository.VendorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
public class SearchController implements SearchApi {

    private final VendorProductService vendorProductService;
    private final VendorRepository vendorRepository;

    public SearchController(VendorProductService vendorProductService,
                            VendorRepository vendorRepository) {
        this.vendorProductService = vendorProductService;
        this.vendorRepository = vendorRepository;
    }

    @Override
    public ResponseEntity<VendorProductsLowestPricesGet200Response> searchProductsGet(String q,
                                                                                      Integer categoryId,
                                                                                      BigDecimal minPrice,
                                                                                      BigDecimal maxPrice,
                                                                                      Boolean prescriptionRequired,
                                                                                      Boolean inStock) {
        // Reuse existing lowest-price view and apply additional filters here.
        VendorProductsLowestPricesGet200Response base =
                vendorProductService.getLowestPriceProducts(categoryId, maxPrice, null);

        List<LowestPriceProduct> items = new ArrayList<>();
        if (base.getData() != null) {
            items.addAll(base.getData());
        }

        // Filter by minimum price if provided
        if (minPrice != null) {
            items = items.stream()
                    .filter(lp -> lp.getFinalPrice() != null
                            && lp.getFinalPrice().compareTo(minPrice) >= 0)
                    .collect(Collectors.toList());
        }

        // Basic text search across product name, generic name and vendor name
        if (q != null && !q.isBlank()) {
            final String term = q.toLowerCase(Locale.ROOT).trim();
            items = items.stream()
                    .filter(lp ->
                            (lp.getProductName() != null && lp.getProductName().toLowerCase(Locale.ROOT).contains(term))
                                    || (lp.getGenericName() != null && lp.getGenericName().toLowerCase(Locale.ROOT).contains(term))
                                    || (lp.getVendorName() != null && lp.getVendorName().toLowerCase(Locale.ROOT).contains(term))
                    )
                    .collect(Collectors.toList());
        }

        // inStock flag: current lowest-price view already excludes zero/negative stock and unavailable items.
        // If inStock is explicitly false, we still return the same list for now.

        VendorProductsLowestPricesGet200Response response = new VendorProductsLowestPricesGet200Response();
        response.setSuccess(true);
        response.setData(items);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<SearchVendorsGet200Response> searchVendorsGet(String q,
                                                                         String city,
                                                                         String state,
                                                                         Boolean isActive) {
        // Fetch a reasonable slice of vendors using existing search criteria.
        Pageable pageable = PageRequest.of(0, 1000);
        Page<Vendor> vendorPage = vendorRepository.search(isActive, city, state, pageable);

        List<Vendor> vendors = new ArrayList<>(vendorPage.getContent());

        // Apply free-text search on vendor name and city if q is provided.
        if (q != null && !q.isBlank()) {
            final String term = q.toLowerCase(Locale.ROOT).trim();
            vendors = vendors.stream()
                    .filter(v ->
                            (v.getName() != null && v.getName().toLowerCase(Locale.ROOT).contains(term))
                                    || (v.getCity() != null && v.getCity().toLowerCase(Locale.ROOT).contains(term))
                    )
                    .collect(Collectors.toList());
        }

        SearchVendorsGet200Response response = new SearchVendorsGet200Response();
        response.setSuccess(true);
        for (Vendor vendor : vendors) {
            response.addDataItem(mapToVendorModel(vendor));
        }

        return ResponseEntity.ok(response);
    }

    private com.echohealthcare.mvps.model.Vendor mapToVendorModel(Vendor entity) {
        com.echohealthcare.mvps.model.Vendor model = new com.echohealthcare.mvps.model.Vendor();
        model.vendorId(entity.getId());
        model.vendorName(entity.getName());
        model.contactPerson(entity.getContactPerson());
        model.email(entity.getEmail());
        model.phone(entity.getPhone());
        model.address(entity.getAddress());
        model.city(entity.getCity());
        model.state(entity.getState());
        model.pincode(entity.getPincode());
        model.gstNumber(entity.getGstNumber());
        model.isActive(entity.getActive());
        model.rating(entity.getRating());
        model.createdAt(entity.getCreatedAt());
        model.updatedAt(entity.getUpdatedAt());
        return model;
    }
}
