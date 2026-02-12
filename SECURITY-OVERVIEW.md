# Security Overview

Short reference for how authentication and authorization work across `api-gateway`, `core-service`, and `mvps-api` (with `mvps-ui`).

## Components

- **authorization-server** (port 9000)
	- OpenID Connect provider issuing ID tokens, access tokens, and refresh tokens.

- **api-gateway** (port 8082)
	- Spring Cloud Gateway acting as the **single entry point** for browser clients.
	- Acts as an **OAuth2 client** (login, logout, session) and **token relay** to backend services.

- **core-service** and **mvps-api**
	- Spring Boot **resource servers** that validate JWTs and enforce `authenticated` access.

- **mvps-ui**
	- React SPA served via `api-gateway` and calling backend APIs **through** the gateway.

## api-gateway Security

Code: `api-gateway/src/main/java/com/cbs/apigateway/configuration/security/SecurityConfig.java`

- Disables CSRF and CORS at the gateway level.
- Configures:
	- `oauth2Login` using the `gateway` client registration.
	- `oauth2Client` for token management.
	- `/logout` using `OidcClientInitiatedServerLogoutSuccessHandler` with post-logout redirect to `{baseUrl}/logged-out`.
- Authorizes exchanges:
	- `pathMatchers("/**").permitAll()` – gateway itself does not block routes.
	- **Backends are protected by their own resource-server security.**
- Default filter:
	- `CustomTokenRelayGatewayFilterFactory` (see `CustomTokenRelayGatewayFilterFactory.java`).
	- On each request:
		- Loads the current OAuth2 authorized client (if logged in).
		- Refreshes access token if close to expiry (using refresh token).
		- Adds `Authorization: Bearer <access_token>` to the forwarded request.

### Routes

Defined in `api-gateway/src/main/resources/application.yaml`:

- `/banking-core/**` → `lb://core-service` (strip prefix `1`).
- `/mvps-api/**` → `lb://mvps-api` (strip prefix `1`).
- `/**` → `http://localhost:4200/` (React SPA, route id `mvps-ui`).

Effect:
- Browser only talks to `http://127.0.0.1:8082`.
- All backend calls go through the gateway, which attaches JWTs when the user is logged in.

## Resource Server Security (core-service, mvps-api)

Example: `core-service/src/main/java/com/cbs/core/config/SecurityConfig.java`

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.disable())
				.authorizeHttpRequests(auth -> auth
						.anyRequest().authenticated())
				.oauth2ResourceServer(oauth2 -> oauth2
						.jwt(jwt -> jwt.decoder(JwtDecoders.fromIssuerLocation(issuerUri))))
				.build();
}
```

`mvps-api` mirrors this pattern in:
- `mvps-api/src/main/java/com/echohealthcare/mvps/config/SecurityConfig.java`

Key points:
- All endpoints require a **valid JWT**.
- JWTs are validated against the same `issuer-uri` as used by the gateway client.
- No endpoint should be exposed with `permitAll()` in production unless explicitly required.

## mvps-ui Integration

### API Base URL

File: `mvps-ui/src/apiClient.js`

- Default API base is **relative to the gateway**:

```js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/mvps-api/v1';
```

- `buildUrl` resolves this relative base against `window.location.origin`:

```js
const fullPath = `${base}${cleanPath}`;
const url = (fullPath.startsWith('http://') || fullPath.startsWith('https://'))
	? new URL(fullPath)
	: new URL(fullPath, window.location.origin);
```

Result:
- From the browser, calls like `fetchData('/products')` go to:
	- `http://127.0.0.1:8082/mvps-api/v1/products?...`
	- Gateway forwards to `mvps-api` with bearer token attached.

### 401 Handling

To keep behavior consistent after logout, `apiClient.js` contains centralized 401 handling:

```js
if (!response.ok) {
	if (response.status === 401 && typeof window !== 'undefined') {
		window.location.href = '/oauth2/authorization/gateway';
	}
	throw new Error(`API request failed with status ${response.status}`);
}
```

Effect:
- If mvps-api/core-service return `401 Unauthorized` (e.g., session expired or after logout),
	the user is automatically redirected to the gateway login.

### Logout Behavior

File: `mvps-ui/src/layout/Header.js`

- Auth button behavior:
	- **Login**: `window.location.href = '/oauth2/authorization/gateway';`
	- **Logout**:
		- Clears any local tokens/session cache.
		- Redirects to gateway `/logout`.

Simplified logout logic:

```js
if (isAuthenticated) {
	try {
		localStorage.removeItem('access_token');
		localStorage.removeItem('id_token');
		localStorage.removeItem('refresh_token');
		sessionStorage.clear();
	} catch (e) {}

	window.location.href = '/logout';
} else {
	window.location.href = '/oauth2/authorization/gateway';
}
```

End-to-end flow:
- Login via gateway → tokens stored in gateway session.
- mvps-ui calls `/mvps-api/v1/...` → gateway relays JWT → mvps-api/core-service return data.
- Logout via gateway → tokens cleared, subsequent calls return `401` → apiClient redirects back to login.

## Local Development Notes

- Access the app via gateway: `http://127.0.0.1:8082`.
- React dev server runs on `http://localhost:4200`, but is **proxied** by gateway.
- Direct calls to `http://localhost:8888/v1/...` (bypassing the gateway) will **not** go through the token relay and should be avoided from the browser.

