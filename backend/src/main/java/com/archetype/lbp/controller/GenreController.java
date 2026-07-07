package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.model.Genre;
import com.archetype.lbp.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreRepository genreRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<String>>> list() {
        List<String> names = genreRepository.findAll(Sort.by("name")).stream()
                .map(Genre::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(names));
    }
}
