package com.javatechie.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Item {
    @Id
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;

}