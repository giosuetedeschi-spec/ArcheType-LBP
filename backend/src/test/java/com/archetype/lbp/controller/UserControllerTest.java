package com.archetype.lbp.controller;

import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.repository.UserRepository;
import com.archetype.lbp.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController controller;

    @Test
    void list_returns200() {
        when(userRepo.findAll()).thenReturn(List.of());
        var resp = controller.list();
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void create_returns201() {
        var req = new UserRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("password123");
        var created = new UserResponse();
        created.setUsername("alice");
        when(userService.register(any())).thenReturn(created);

        var resp = controller.create(req);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void get_returns200() {
        var user = new User();
        user.setId(1L);
        user.setUsername("alice");
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        var resp = controller.get(1L);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
