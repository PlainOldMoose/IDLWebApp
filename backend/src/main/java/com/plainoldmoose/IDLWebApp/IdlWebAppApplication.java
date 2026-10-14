package com.plainoldmoose.IDLWebApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class IdlWebAppApplication {

	public static void main(String[] args) {
		// Prod's container is UTC, so every LocalDateTime.now() is UTC wherever it runs: match times are UTC too
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(IdlWebAppApplication.class, args);
	}
}
