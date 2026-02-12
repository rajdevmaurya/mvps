package com.echohealthcare.mvps.controller;

import com.echohealthcare.mvps.api.ProductCategoriesApi;
import com.echohealthcare.mvps.model.*;
import com.echohealthcare.mvps.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductCategoriesController implements ProductCategoriesApi {

	private final CategoryService categoryService;

	public ProductCategoriesController(CategoryService categoryService) {
		this.categoryService = categoryService;
	}

	@Override
	public ResponseEntity<CategoriesGet200Response> categoriesGet(@Nullable Integer parentCategoryId) {
		return ResponseEntity.ok(categoryService.getCategories(parentCategoryId));
	}

	@Override
	public ResponseEntity<CategoriesPost201Response> categoriesPost(@Valid @RequestBody ProductCategoryCreate productCategoryCreate) {
		return ResponseEntity.status(201).body(categoryService.createCategory(productCategoryCreate));
	}

	@Override
	public ResponseEntity<CategoriesCategoryIdGet200Response> categoriesCategoryIdGet(@PathVariable("categoryId") Integer categoryId) {
		return ResponseEntity.ok(categoryService.getCategoryById(categoryId));
	}

	@Override
	public ResponseEntity<CategoriesCategoryIdPut200Response> categoriesCategoryIdPut(@PathVariable("categoryId") Integer categoryId,
			@Valid @RequestBody ProductCategoryUpdate productCategoryUpdate) {
		return ResponseEntity.ok(categoryService.updateCategory(categoryId, productCategoryUpdate));
	}

	@Override
	public ResponseEntity<CategoriesCategoryIdDelete200Response> categoriesCategoryIdDelete(@PathVariable("categoryId") Integer categoryId) {
		return ResponseEntity.ok(categoryService.deleteCategory(categoryId));
	}
}
