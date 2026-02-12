package com.echohealthcare.mvps;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@EnableDiscoveryClient
@SpringBootApplication
public class MvpsApplication {

	public static void main(String[] args) {
		SpringApplication.run(MvpsApplication.class, args);
	}

}
