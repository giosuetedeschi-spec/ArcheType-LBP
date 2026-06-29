package com.archetype.lbp.service;

import com.archetype.lbp.model.User;

import com.archetype.lbp.dto.UserRequest;
import com.archetype.lbp.dto.UserResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepo;

    public UserResponse register(UserRequest req) {
        if (userRepo.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username già in uso: " + req.getUsername());
        }
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email già registrata: " + req.getEmail());
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        // TODO: sostituire con BCryptPasswordEncoder quando si aggiunge Spring Security
        user.setPasswordHash(req.getPassword());

        return toResponse(userRepo.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return userRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return toResponse(findEntityById(id));
    }

    public UserResponse update(Long id, UserRequest req) {
        User user = findEntityById(id);
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        if (req.getStatus()    != null) user.setStatus(req.getStatus());
        if (req.getBio()       != null) user.setBio(req.getBio());
        return toResponse(userRepo.save(user));
    }

    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    public User findEntityById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public UserResponse toResponse(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setUsername(user.getUsername());
        r.setEmail(user.getEmail());
        r.setAvatarUrl(user.getAvatarUrl());
        r.setStatus(user.getStatus());
        r.setBio(user.getBio());
        r.setCreatedAt(user.getCreatedAt());
        return r;
    }
}
