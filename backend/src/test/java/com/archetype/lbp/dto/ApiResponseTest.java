package com.archetype.lbp.dto;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class ApiResponseTest {

    @Test
    void ok_returnsSuccess() {
        var resp = ApiResponse.ok("data");
        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getData()).isEqualTo("data");
        assertThat(resp.getMessage()).isNull();
    }

    @Test
    void ok_withMessage() {
        var resp = ApiResponse.ok("data", "done");
        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getMessage()).isEqualTo("done");
    }

    @Test
    void error_returnsFailure() {
        var resp = ApiResponse.error("something broke");
        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getData()).isNull();
        assertThat(resp.getMessage()).isEqualTo("something broke");
    }

    @Test
    void ok_withNullData() {
        var resp = ApiResponse.ok(null);
        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getData()).isNull();
    }
}
