package com.plainoldmoose.IDLWebApp;

import com.plainoldmoose.IDLWebApp.dto.request.DraftPickRequest;
import com.plainoldmoose.IDLWebApp.dto.request.RenameTeamRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DraftRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void teamName() {
        assertEquals(true, validator.validate(new RenameTeamRequest("RIP Ollie's IDL streak")).isEmpty());
        assertEquals(true, validator.validate(new RenameTeamRequest("T".repeat(32))).isEmpty());
        assertEquals(false, validator.validate(new RenameTeamRequest("T".repeat(33))).isEmpty());
        assertEquals(false, validator.validate(new RenameTeamRequest(" ")).isEmpty());
        assertEquals(false, validator.validate(new RenameTeamRequest(null)).isEmpty());
        assertEquals(false, validator.validate(new RenameTeamRequest("\u200B\u200B")).isEmpty());
        assertEquals(false, validator.validate(new RenameTeamRequest("\u202Emaet s'ylloP")).isEmpty());
    }

    @Test
    void pick() {
        assertEquals(true, validator.validate(new DraftPickRequest("76561198000000000")).isEmpty());
        assertEquals(false, validator.validate(new DraftPickRequest("")).isEmpty());
    }
}
