package com.archetype.lbp.controller;

import com.archetype.lbp.User;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/users")
@RequiredArgsConstructor @CrossOrigin(origins = "*")
public class UserController {
    private final UserRepository userRepo;

    @GetMapping
    public List<User> list() { return userRepo.findAll(); }

    @GetMapping("/{id}")
    public User get(@PathVariable Long id) { return userRepo.findById(id).orElseThrow(); }

    @PostMapping
    public User create(@RequestBody User user) { return userRepo.save(user); }
}
