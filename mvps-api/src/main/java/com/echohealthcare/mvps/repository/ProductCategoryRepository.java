package com.echohealthcare.mvps.repository;

import com.echohealthcare.mvps.domain.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Integer> {
}
