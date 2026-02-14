package com.echohealthcare.mvps.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Jackson configuration for proper JsonNullable serialization and flexible property naming.
 * This ensures that:
 * - JsonNullable fields in OpenAPI-generated models are correctly serialized to JSON
 * - Both snake_case and camelCase property names are accepted during deserialization
 * - Unknown properties don't cause deserialization failures
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register JavaTimeModule for LocalDate/LocalDateTime serialization
        mapper.registerModule(new JavaTimeModule());

        // Register JsonNullableModule for JsonNullable serialization
        // This allows JsonNullable.of(value) to be serialized as the value itself
        // and JsonNullable.of(null) to be serialized as null (not omitted)
        mapper.registerModule(new JsonNullableModule());

        // Accept both snake_case and camelCase property names
        // This allows the API to accept vendor_sku or vendorSku
        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);

        // Don't fail on unknown properties - this makes the API more resilient
        // to frontend sending extra fields or using different naming conventions
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        return mapper;
    }
}
