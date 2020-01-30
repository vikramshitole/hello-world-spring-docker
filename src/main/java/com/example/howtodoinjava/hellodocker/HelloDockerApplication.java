package com.example.howtodoinjava.hellodocker;

import java.io.IOException;
import java.util.Date;
import java.util.Properties;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class HelloDockerApplication {

	public static void main(String[] args) {
		SpringApplication.run(HelloDockerApplication.class, args);
	}
}

@RestController
class HelloDockerRestController {
	@RequestMapping("/hello/{name}")
	public String helloDocker(@PathVariable(value = "name") String name) {
		String environment = System.getenv("STAGE");
		String password = System.getenv("DB_PASSWORD");
		environment = environment!=null?environment : "Dev";
		password = password!=null?password : "not provided";

		String response = "Hello ECS Cluster " + name + " you are on "+ environment +" db password "+ password+ " response received on : " + new Date();
		System.out.println(response);
		return response;

	}

	private String getVersion() {
		Properties prop = new Properties();
		java.io.InputStream is = this.getClass().getClassLoader().getResourceAsStream("version.properties");

		if (is != null) {
			try {
				prop.load(is);
			} catch (IOException e) {
				e.printStackTrace();
			}
		} else {
			throw new RuntimeException("property file not found in the classpath");
		}
		return prop.getProperty("version");
	}

	@RequestMapping("/version")
	@ResponseStatus(HttpStatus.OK)
	public String version() {
		String response = getVersion();
		return response;

	}

	@RequestMapping("/health")
	@ResponseStatus(HttpStatus.OK)
	public String health() {
		String response = "ok";
		return response;

	}
}
