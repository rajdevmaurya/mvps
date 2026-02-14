package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.ProductsApi;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.service.ProductService;
import com.echohealthcare.mvps.service.VendorProductService;
import com.echohealthcare.mvps.model.VendorProductsGet200Response;
import com.echohealthcare.mvps.util.PaginationUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.lang.Nullable;

@RestController
public class ProductsController implements ProductsApi {

	private final ProductService productService;
	private final VendorProductService vendorProductService;

	public ProductsController(ProductService productService, VendorProductService vendorProductService) {
		this.productService = productService;
		this.vendorProductService = vendorProductService;
	}

	@Override
	public ResponseEntity<ProductsGet200Response> productsGet(@Nullable Integer categoryId,
															  @Nullable Boolean isActive,
															  @Nullable Boolean prescriptionRequired,
															  @Nullable String search,
															  Integer page,
															  Integer limit) {
		int[] validated = PaginationUtils.validatePagination(page, limit);
		return ResponseEntity.ok(productService.getProducts(categoryId, isActive, prescriptionRequired, search, validated[0], validated[1]));
	}

	@Override
	public ResponseEntity<ProductsPost201Response> productsPost(@Valid @RequestBody ProductCreate productCreate) {
		return ResponseEntity.status(201).body(productService.createProduct(productCreate));
	}

	@Override
	public ResponseEntity<ProductsProductIdGet200Response> productsProductIdGet(@PathVariable("productId") Integer productId) {
		return ResponseEntity.ok(productService.getProductById(productId));
	}

	// --- New endpoint: Get vendors for a product ---
	@org.springframework.web.bind.annotation.GetMapping("/products/{productId}/vendors")
	public ResponseEntity<VendorProductsGet200Response> getVendorsForProduct(
		@PathVariable("productId") Integer productId) {
		VendorProductsGet200Response response = vendorProductService.getVendorProducts(
			null, productId, true, null, null, 1, 100);
		return ResponseEntity.ok(response);
	}

	@Override
	public ResponseEntity<ProductsProductIdPut200Response> productsProductIdPut(@PathVariable("productId") Integer productId,
																			   @Valid @RequestBody ProductUpdate productUpdate) {
		return ResponseEntity.ok(productService.updateProduct(productId, productUpdate));
	}

	@Override
	public ResponseEntity<ProductsProductIdDelete200Response> productsProductIdDelete(@PathVariable("productId") Integer productId) {
		return ResponseEntity.ok(productService.softDeleteProduct(productId));
	}
}
