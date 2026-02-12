package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.repository.ProductCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {

	private final ProductCategoryRepository categoryRepository;

	public CategoryService(ProductCategoryRepository categoryRepository) {
		this.categoryRepository = categoryRepository;
	}

	public com.echohealthcare.mvps.model.CategoriesGet200Response getCategories(Integer parentCategoryId) {
		java.util.List<com.echohealthcare.mvps.domain.ProductCategory> categories;
		java.util.List<com.echohealthcare.mvps.domain.ProductCategory> all = categoryRepository.findAll();
		if (parentCategoryId != null) {
			categories = all.stream()
					.filter(c -> c.getParentCategory() != null && parentCategoryId.equals(c.getParentCategory().getId()))
					.toList();
		} else {
			categories = all;
		}

		com.echohealthcare.mvps.model.CategoriesGet200Response response = new com.echohealthcare.mvps.model.CategoriesGet200Response();
		response.setSuccess(true);
		categories.forEach(c -> response.addDataItem(mapToModel(c)));
		return response;
	}

	public com.echohealthcare.mvps.model.CategoriesPost201Response createCategory(com.echohealthcare.mvps.model.ProductCategoryCreate request) {
		com.echohealthcare.mvps.domain.ProductCategory category = new com.echohealthcare.mvps.domain.ProductCategory();
		applyCreate(request, category);
		com.echohealthcare.mvps.domain.ProductCategory saved = categoryRepository.save(category);

		com.echohealthcare.mvps.model.CategoriesPost201Response response = new com.echohealthcare.mvps.model.CategoriesPost201Response();
		response.setSuccess(true);
		response.setMessage("Category created successfully");
		response.setData(mapToModel(saved));
		return response;
	}

	public com.echohealthcare.mvps.model.CategoriesCategoryIdGet200Response getCategoryById(Integer categoryId) {
		com.echohealthcare.mvps.domain.ProductCategory category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new ResourceNotFoundException("Category not found"));

		com.echohealthcare.mvps.model.CategoriesCategoryIdGet200Response response = new com.echohealthcare.mvps.model.CategoriesCategoryIdGet200Response();
		response.setSuccess(true);
		response.setData(mapToModel(category));
		return response;
	}

	public com.echohealthcare.mvps.model.CategoriesCategoryIdPut200Response updateCategory(Integer categoryId,
			com.echohealthcare.mvps.model.ProductCategoryUpdate request) {
		com.echohealthcare.mvps.domain.ProductCategory category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new ResourceNotFoundException("Category not found"));

		applyUpdate(request, category);
		com.echohealthcare.mvps.domain.ProductCategory saved = categoryRepository.save(category);

		com.echohealthcare.mvps.model.CategoriesCategoryIdPut200Response response = new com.echohealthcare.mvps.model.CategoriesCategoryIdPut200Response();
		response.setSuccess(true);
		response.setMessage("Category updated successfully");
		response.setData(mapToModel(saved));
		return response;
	}

	public com.echohealthcare.mvps.model.CategoriesCategoryIdDelete200Response deleteCategory(Integer categoryId) {
		com.echohealthcare.mvps.domain.ProductCategory category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new ResourceNotFoundException("Category not found"));
		categoryRepository.delete(category);

		com.echohealthcare.mvps.model.CategoriesCategoryIdDelete200Response response = new com.echohealthcare.mvps.model.CategoriesCategoryIdDelete200Response();
		response.setSuccess(true);
		response.setMessage("Category deleted successfully");
		return response;
	}

	private void applyCreate(com.echohealthcare.mvps.model.ProductCategoryCreate request,
			com.echohealthcare.mvps.domain.ProductCategory category) {
		category.setName(request.getCategoryName());
		category.setDescription(request.getDescription());
		if (request.getParentCategoryId() != null && request.getParentCategoryId().isPresent()) {
			Integer parentId = request.getParentCategoryId().get();
			com.echohealthcare.mvps.domain.ProductCategory parent = categoryRepository.findById(parentId)
					.orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
			category.setParentCategory(parent);
		}
	}

	private void applyUpdate(com.echohealthcare.mvps.model.ProductCategoryUpdate request,
			com.echohealthcare.mvps.domain.ProductCategory category) {
		if (request.getCategoryName() != null) {
			category.setName(request.getCategoryName());
		}
		if (request.getDescription() != null) {
			category.setDescription(request.getDescription());
		}
		if (request.getParentCategoryId() != null && request.getParentCategoryId().isPresent()) {
			Integer parentId = request.getParentCategoryId().get();
			com.echohealthcare.mvps.domain.ProductCategory parent = categoryRepository.findById(parentId)
					.orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
			category.setParentCategory(parent);
		}
	}

	private com.echohealthcare.mvps.model.ProductCategory mapToModel(com.echohealthcare.mvps.domain.ProductCategory entity) {
		com.echohealthcare.mvps.model.ProductCategory model = new com.echohealthcare.mvps.model.ProductCategory();
		model.categoryId(entity.getId());
		model.categoryName(entity.getName());
		model.description(entity.getDescription());
		if (entity.getParentCategory() != null) {
			model.parentCategoryId(entity.getParentCategory().getId());
		}
		model.createdAt(entity.getCreatedAt());
		return model;
	}
}
