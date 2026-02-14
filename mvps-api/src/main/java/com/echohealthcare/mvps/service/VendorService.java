package com.echohealthcare.mvps.service;

import com.echohealthcare.mvps.domain.Vendor;
import com.echohealthcare.mvps.dto.CursorPageResponse;
import com.echohealthcare.mvps.model.Pagination;
import com.echohealthcare.mvps.model.VendorCreate;
import com.echohealthcare.mvps.model.VendorUpdate;
import com.echohealthcare.mvps.model.VendorsGet200Response;
import com.echohealthcare.mvps.model.VendorsPost201Response;
import com.echohealthcare.mvps.model.VendorsVendorIdDelete200Response;
import com.echohealthcare.mvps.model.VendorsVendorIdGet200Response;
import com.echohealthcare.mvps.model.VendorsVendorIdPut200Response;
import com.echohealthcare.mvps.repository.VendorRepository;
import com.echohealthcare.mvps.util.CursorPaginationUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VendorService {

	private final VendorRepository vendorRepository;

	public VendorService(VendorRepository vendorRepository) {
		this.vendorRepository = vendorRepository;
	}

	public VendorsGet200Response getVendors(Boolean isActive, String city, String state, int page, int limit) {
		Pageable pageable = PageRequest.of(Math.max(page - 1, 0), limit);
		Page<Vendor> vendorPage = vendorRepository.search(isActive, city, state, pageable);

		VendorsGet200Response response = new VendorsGet200Response();
		response.setSuccess(true);
		for (Vendor vendor : vendorPage.getContent()) {
			response.addDataItem(mapToVendorModel(vendor));
		}

		Pagination pagination = new Pagination();
		pagination.setPage(page);
		pagination.setLimit(limit);
		pagination.setTotalItems((int) vendorPage.getTotalElements());
		pagination.setTotalPages(vendorPage.getTotalPages());
		response.setPagination(pagination);
		return response;
	}

	/**
	 * Get vendors using cursor-based pagination.
	 */
	public CursorPageResponse<com.echohealthcare.mvps.model.Vendor> getVendorsByCursor(
			String cursor,
			Integer size,
			Boolean isActive,
			String city,
			String state) {

		int validatedSize = CursorPaginationUtils.validatePageSize(size);
		Integer decodedCursor = CursorPaginationUtils.decodeCursor(cursor);

		Pageable pageable = PageRequest.of(0, validatedSize + 1);
		List<Vendor> vendors = vendorRepository.searchByCursor(
			decodedCursor, isActive, city, state, pageable);

		boolean hasNext = vendors.size() > validatedSize;
		List<Vendor> pageItems = hasNext ? vendors.subList(0, validatedSize) : vendors;

		Integer nextCursorValue = hasNext && !pageItems.isEmpty()
			? pageItems.get(pageItems.size() - 1).getId()
			: null;

		List<com.echohealthcare.mvps.model.Vendor> responseData = pageItems.stream()
			.map(this::mapToVendorModel)
			.collect(Collectors.toList());

		return new CursorPageResponse<>(
			responseData,
			validatedSize,
			CursorPaginationUtils.encodeCursor(nextCursorValue),
			hasNext
		);
	}

	public VendorsPost201Response createVendor(VendorCreate request) {
		Vendor vendor = new Vendor();
		vendor.setName(request.getVendorName());
		vendor.setContactPerson(request.getContactPerson());
		vendor.setEmail(request.getEmail());
		vendor.setPhone(request.getPhone());
		vendor.setAddress(request.getAddress());
		vendor.setCity(request.getCity());
		vendor.setState(request.getState());
		vendor.setPincode(request.getPincode());
		vendor.setGstNumber(request.getGstNumber());
		vendor.setActive(Boolean.TRUE.equals(request.getIsActive()));
		vendor.setRating(request.getRating() != null ? request.getRating() : BigDecimal.ZERO);

		Vendor saved = vendorRepository.save(vendor);

		VendorsPost201Response response = new VendorsPost201Response();
		response.setSuccess(true);
		response.setMessage("Vendor created successfully");
		response.setData(mapToVendorModel(saved));
		return response;
	}

	public VendorsVendorIdGet200Response getVendorById(Integer vendorId) {
		Vendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

		VendorsVendorIdGet200Response response = new VendorsVendorIdGet200Response();
		response.setSuccess(true);
		response.setData(mapToVendorModel(vendor));
		return response;
	}

	public VendorsVendorIdPut200Response updateVendor(Integer vendorId, VendorUpdate request) {
		Vendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

		if (request.getVendorName() != null) {
			vendor.setName(request.getVendorName());
		}
		if (request.getContactPerson() != null) {
			vendor.setContactPerson(request.getContactPerson());
		}
		if (request.getEmail() != null) {
			vendor.setEmail(request.getEmail());
		}
		if (request.getPhone() != null) {
			vendor.setPhone(request.getPhone());
		}
		if (request.getAddress() != null) {
			vendor.setAddress(request.getAddress());
		}
		if (request.getCity() != null) {
			vendor.setCity(request.getCity());
		}
		if (request.getState() != null) {
			vendor.setState(request.getState());
		}
		if (request.getPincode() != null) {
			vendor.setPincode(request.getPincode());
		}
		if (request.getGstNumber() != null) {
			vendor.setGstNumber(request.getGstNumber());
		}
		if (request.getIsActive() != null) {
			vendor.setActive(request.getIsActive());
		}
		if (request.getRating() != null) {
			vendor.setRating(request.getRating());
		}

		Vendor saved = vendorRepository.save(vendor);

		VendorsVendorIdPut200Response response = new VendorsVendorIdPut200Response();
		response.setSuccess(true);
		response.setMessage("Vendor updated successfully");
		response.setData(mapToVendorModel(saved));
		return response;
	}

	public VendorsVendorIdDelete200Response softDeleteVendor(Integer vendorId) {
		Vendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
		vendor.setActive(false);
		vendorRepository.save(vendor);

		VendorsVendorIdDelete200Response response = new VendorsVendorIdDelete200Response();
		response.setSuccess(true);
		response.setMessage("Vendor deleted successfully");
		return response;
	}

	private Vendor mapToEntity(VendorCreate request) {
		Vendor vendor = new Vendor();
		vendor.setName(request.getVendorName());
		vendor.setContactPerson(request.getContactPerson());
		vendor.setEmail(request.getEmail());
		vendor.setPhone(request.getPhone());
		vendor.setAddress(request.getAddress());
		vendor.setCity(request.getCity());
		vendor.setState(request.getState());
		vendor.setPincode(request.getPincode());
		vendor.setGstNumber(request.getGstNumber());
		vendor.setActive(Boolean.TRUE.equals(request.getIsActive()));
		vendor.setRating(request.getRating() != null ? request.getRating() : BigDecimal.ZERO);
		return vendor;
	}

	private Vendor mapUpdateToEntity(Vendor vendor, VendorUpdate request) {
		if (request.getVendorName() != null) {
			vendor.setName(request.getVendorName());
		}
		if (request.getContactPerson() != null) {
			vendor.setContactPerson(request.getContactPerson());
		}
		if (request.getEmail() != null) {
			vendor.setEmail(request.getEmail());
		}
		if (request.getPhone() != null) {
			vendor.setPhone(request.getPhone());
		}
		if (request.getAddress() != null) {
			vendor.setAddress(request.getAddress());
		}
		if (request.getCity() != null) {
			vendor.setCity(request.getCity());
		}
		if (request.getState() != null) {
			vendor.setState(request.getState());
		}
		if (request.getPincode() != null) {
			vendor.setPincode(request.getPincode());
		}
		if (request.getGstNumber() != null) {
			vendor.setGstNumber(request.getGstNumber());
		}
		if (request.getIsActive() != null) {
			vendor.setActive(request.getIsActive());
		}
		if (request.getRating() != null) {
			vendor.setRating(request.getRating());
		}
		return vendor;
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

