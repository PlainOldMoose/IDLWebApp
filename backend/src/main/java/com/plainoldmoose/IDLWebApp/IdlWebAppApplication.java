package com.plainoldmoose.IDLWebApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IdlWebAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(IdlWebAppApplication.class, args);
	}
}
