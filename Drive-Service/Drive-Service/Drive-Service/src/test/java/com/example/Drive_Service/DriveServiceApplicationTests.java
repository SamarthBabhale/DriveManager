package com.example.Drive_Service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:drive-test;DB_CLOSE_DELAY=-1")
class DriveServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
