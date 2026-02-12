# MVPS API Endpoint Usage Report

This document summarizes which `mvps-api` HTTP endpoints are currently used by the `mvps-ui` frontend and which are not.

All paths below are relative to the API base used by the UI:

- Base from browser: `/mvps-api/v1`

---

## Endpoints Used by mvps-ui

| API Path (under `/mvps-api/v1`) | Methods (from OpenAPI/controllers) | Used by UI? | UI Locations (examples) |
| --- | --- | --- | --- |
| `/vendors` | `GET`, `POST` | Yes | Vendors list page, Dashboard vendor metrics, Order create dropdowns (indirect via vendor performance) |
| `/vendors/{vendorId}` | `GET`, `PUT`, `DELETE` | Yes | Vendor details page (view/update/delete) |
| `/vendors/{vendorId}/products` | `GET` | Yes | Vendor details → products list for a vendor |
| `/vendors/performance` | `GET` | Yes | Vendors page performance table, Dashboard MVPS Overview cards |
| `/categories` | `GET`, `POST` (only `GET` used) | Yes (GET) | Products page filters, Product details form category dropdown |
| `/products` | `GET`, `POST` | Yes | Products Catalog page, Order Create product dropdown, Dashboard summary call (for total products) |
| `/products/{productId}` | `GET`, `PUT`, `DELETE` | Yes | Product details page (view/update/delete) |
| `/products/{productId}/vendors` | `GET` | Yes | Product details → vendor comparison table |
| `/vendor-products` | `GET`, `POST` (only `GET` used) | Yes (GET) | Inventory & Stock page – vendor SKUs for a selected product |
| `/vendor-products/lowest-prices` | `GET` | Yes | Products Catalog, Pricing page, Dashboard "Best deals" table |
| `/vendor-products/price-comparison` | `GET` | Yes | Pricing page tables, Inventory overview pricing comparison |
| `/vendor-products/update-stock` | `PATCH` | Yes | Inventory page "Manage stock" modal (bulk stock updates) |
| `/vendor-products/{vendorProductId}/stock-history` | `GET` | Yes | Inventory page – full stock history per SKU/vendor (custom endpoint in `VendorProductsController`) |
| `/customers` | `GET`, `POST` | Yes | Customers list page, Order Create customer dropdown |
| `/customers/{customerId}` | `GET`, `PUT`, `DELETE` | Yes | Customer details page (view/update/delete) |
| `/customers/{customerId}/orders` | `GET` | Yes | Customer details → orders tab/list |
| `/orders` | `GET`, `POST` | Yes | Orders list page (filter & pagination), Create order (submit) |
| `/orders/{orderId}` | `GET`, `PUT`, `DELETE` | Yes | Order details page (view/update/delete), Orders list "View items" modal |
| `/analytics/inventory-status` | `GET` | Yes | Inventory overview cards, Dashboard MVPS Overview widgets |
| `/analytics/sales-summary` | `GET` | Yes | Reports page – Daily Sales (last snapshot / last 30 days) |
| `/analytics/top-products` | `GET` | Yes | Reports page – Top Products table |
| `/analytics/vendor-revenue` | `GET` | Yes | Reports page – Vendor performance table |
| `/analytics/stock-history` | `GET` | Yes | Stock History page – global audit trail of stock movements |

---

## Endpoints Defined but Not Used by mvps-ui

These endpoints exist in `openapi.yaml` and backing controllers/services, but are not currently called anywhere in `mvps-ui` (no occurrences in `fetchData`, `postJson`, `putJson`, `patchJson`, or `deleteJson` paths).

| API Path (under `/mvps-api/v1`) | Methods | Notes / Potential Use |
| --- | --- | --- |
| `/categories/{categoryId}` | `GET`, `PUT`, `DELETE` | Category detail management not exposed in current UI; could be used for an admin category editor. |
| `/products/{productId}/lowest-price` | `GET` | Redundant with `/vendor-products/lowest-prices`; UI prefers vendor-products analytics endpoints. |
| `/vendor-products/{vendorProductId}` | `GET`, `PUT`, `DELETE` | Direct CRUD on a single vendor product is not exposed in the UI (only listing and stock updates are used). |
| `/vendor-orders` | `GET`, `POST` | Vendor purchase orders are not surfaced in `mvps-ui`; could back a future "Vendor Orders" module. |
| `/vendor-orders/{vendorOrderId}` | `GET`, `PUT`, `DELETE` | Same as above – no current UI for viewing/updating individual vendor orders. |
| `/order-items` | `GET` | Line-item level search/listing not used; orders are viewed via `/orders` with embedded items. |
| `/order-items/{orderItemId}` | `GET`, `PUT`, `DELETE` | No UI for editing a single order item in isolation. |
| `/orders/{orderId}/status` | `PATCH` | Status updates are not called directly; UI currently does not expose a separate status-only control. |
| `/orders/{orderId}/payment-status` | `PATCH` | Same as above for payment status; could support a dedicated payment workflow. |
| `/search/products` | `GET` | Not used; product search is implemented as filters on `/products`. |
| `/search/vendors` | `GET` | Not used; vendor search is implemented as filters on `/vendors`. |
| `/analytics/top-customers` | `GET` | Not used; could power a future "Top Customers" card or report. |
| `/analytics/expiring-products` | `GET` | Not used; could drive an expiring stock / near-expiry report in inventory or analytics. |

---

## How this report was generated

- **Backend source of truth:** [src/main/resources/openapi.yaml](src/main/resources/openapi.yaml) in `mvps-api`, plus custom controller methods (e.g., `/analytics/stock-history`, `/vendor-products/{vendorProductId}/stock-history`).
- **Frontend usage scan:** Searched `mvps-ui/src/**` for all usages of `fetchData`, `postJson`, `putJson`, `patchJson`, and `deleteJson` and collected their `path` arguments.
- **Mapping:** Normalized those paths against the OpenAPI paths to determine which endpoints are currently exercised by the UI.

If you add new UI features or endpoints, remember to update this report so it stays in sync with the actual usage.