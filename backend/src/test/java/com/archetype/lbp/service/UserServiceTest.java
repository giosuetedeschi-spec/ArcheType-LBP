package com.archetype.lbp.service;

import com.archetype.lbp.User;
import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepo;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPasswordHash("hashed");
    }

    @Test
    void register_createsUser() {
        when(userRepo.findByUsername("alice")).thenReturn(Optional.empty());
        when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(userRepo.save(any(User.class))).thenReturn(user);

        var req = new UserRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        UserResponse result = userService.register(req);
        assertThat(result.getUsername()).isEqualTo("alice");
        verify(userRepo).save(any(User.class));
    }

    @Test
    void register_throws_whenUsernameTaken() {
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));

        var req = new UserRequest();
        req.setUsername("alice");
        req.setEmail("new@example.com");
        req.setPassword("password123");

        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already taken");
    }

    @Test
    void register_throws_whenEmailTaken() {
        when(userRepo.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        var req = new UserRequest();
        req.setUsername("newuser");
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void findByUsername_returnsUser() {
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));
        var result = userService.findByUsername("alice");
        assertThat(result.getUsername()).isEqualTo("alice");
    }

    @Test
    void findByUsername_throws_whenNotFound() {
        when(userRepo.findByUsername("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.findByUsername("ghost"))
                .isInstanceOf(Exception.class);
    }
}
