package com.plainoldmoose.IDLWebApp;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CreateSeasonRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private boolean valid(String name, LocalDate start, LocalDate end) {
        return validator.validate(new CreateSeasonRequest(name, start, end)).isEmpty();
    }

    @Test
    void dates() {
        LocalDate day = LocalDate.of(2026, 10, 1);
        assertEquals(true, valid("Season 9", day, day.plusWeeks(6)));
        assertEquals(true, valid("Season 9", day, day));
        assertEquals(false, valid("Season 9", day, day.minusDays(1)));
        assertEquals(false, valid("Season 9", null, day));
        assertEquals(false, valid("Season 9", day, null));
        assertEquals(false, valid("S".repeat(65), day, day));
    }
}
