package com.plainoldmoose.IDLWebApp;

import com.plainoldmoose.IDLWebApp.dto.request.SeasonSignupRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SeasonSignupRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private boolean valid(String rolePreference) {
        return validator.validate(new SeasonSignupRequest(rolePreference, false)).isEmpty();
    }

    @Test
    void rolePreference() {
        for (String ok : new String[]{"1 > 2 > 3/4", "2/3>1>>>>>5", "5", " 1 > 2 "}) {
            assertEquals(true, valid(ok), ok);
        }
        // The last one matches the pattern but is too long for the column
        for (String bad : new String[]{"1 > 1", "2/2 > 1", "6", "1 >", ">1", "1,2", "", null, "1 " + ">".repeat(300) + " 2"}) {
            assertEquals(false, valid(bad), bad);
        }
    }
}
