package com.archetype.lbp.service;

import com.archetype.lbp.model.User;

import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

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
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepo.save(any(User.class))).thenReturn(user);

        var req = new UserRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("password123");

        UserResponse result = userService.register(req);
        assertThat(result.getUsername()).isEqualTo("alice");
        // Il primo save assegna l'id, il secondo persiste l'avatar_url
        // derivato da quell'id (vedi UserService.buildCatAvatarUrl).
        assertThat(result.getAvatarUrl()).isEqualTo("https://loremflickr.com/200/200/cat?lock=1");
        verify(userRepo, times(2)).save(any(User.class));
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
                .hasMessageContaining("Username");
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
                .hasMessageContaining("Email");
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

    @Test
    void listAll_returnsAllUsers() {
        when(userRepo.findAll()).thenReturn(java.util.List.of(user));
        var result = userService.listAll();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("alice");
    }

    @Test
    void update_changesFields() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenReturn(user);

        var req = new UserRequest();
        req.setBio("I love gaming");
        req.setStatus("playing");

        var result = userService.update(1L, req);
        assertThat(result.getUsername()).isEqualTo("alice");
        verify(userRepo).save(any(User.class));
    }
}
