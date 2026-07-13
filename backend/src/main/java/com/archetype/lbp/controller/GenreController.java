package com.archetype.lbp.controller;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.model.Genre;
import com.archetype.lbp.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreRepository genreRepository;

    // Stessi nomi esatti (case-sensitive) usati da populate_db.py per
    // decidere games.mature in fase di import (ADULT_GENRE_NAMES lì). Tenuti
    // fuori dall'elenco genere di default per coerenza con l'esclusione dei
    // giochi 18+ dal catalogo (issue #87, poi estesa a Gore/Violent): non
    // avrebbe senso proporre come filtro un genere i cui giochi sono
    // comunque nascosti.
    private static final List<String> ADULT_GENRE_NAMES = List.of("Nudity", "Sexual Content", "Gore", "Violent");

    @GetMapping
    public ResponseEntity<ApiResponse<List<String>>> list(
            @RequestParam(required = false) Boolean mature) {
        List<String> names = genreRepository.findAll(Sort.by("name")).stream()
                .map(Genre::getName)
                .filter(n -> Boolean.TRUE.equals(mature) || !ADULT_GENRE_NAMES.contains(n))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(names));
    }
}
