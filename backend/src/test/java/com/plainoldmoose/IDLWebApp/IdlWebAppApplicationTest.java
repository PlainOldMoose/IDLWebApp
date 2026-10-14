package com.plainoldmoose.IDLWebApp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// Boots the whole app, so a bean nothing can supply (the other tests build or mock their own) fails here, not on deploy.
// H2 stands in for Postgres, which CI doesn't have
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:startup;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class IdlWebAppApplicationTest {

    @Test
    void starts() {
    }
}
