package com.archetype.lbp.service;

import com.archetype.lbp.model.Developer;
import com.archetype.lbp.model.Game;
import com.archetype.lbp.model.Genre;
import com.archetype.lbp.model.Publisher;

import com.archetype.lbp.dto.*;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.DeveloperRepository;
import com.archetype.lbp.repository.GameRepository;
import com.archetype.lbp.repository.GenreRepository;
import com.archetype.lbp.repository.PublisherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GameService {

    private final GameRepository gameRepo;
    private final DeveloperRepository developerRepo;
    private final PublisherRepository publisherRepo;
    private final GenreRepository genreRepo;

    @Transactional(readOnly = true)
    public PagedResponse<GameResponse> filter(GameFilterRequest filter) {
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(filter.getSortDir())
                        ? Sort.Direction.DESC : Sort.Direction.ASC,
                filter.getSortBy() != null ? filter.getSortBy() : "name"
        );
        Pageable pageable = PageRequest.of(
                filter.getPage() >= 0 ? filter.getPage() : 0,
                filter.getSize() > 0  ? filter.getSize() : 20,
                sort
        );

        Page<Game> page = gameRepo.findAll(
                GameRepository.withFilters(
                        filter.getName(),
                        filter.getGenre(),
                        filter.getDeveloper(),
                        filter.getMinPrice(),
                        filter.getMaxPrice(),
                        filter.getMinRating(),
                        filter.getReleasedAfter(),
                        filter.getReleasedBefore(),
                        filter.getOs(),
                        filter.getVr(),
                        filter.getMature()
                ),
                pageable
        );

        PagedResponse<GameResponse> resp = new PagedResponse<>();
        resp.setContent(page.getContent().stream().map(this::toResponse).collect(Collectors.toList()));
        resp.setPage(page.getNumber());
        resp.setSize(page.getSize());
        resp.setTotalElements(page.getTotalElements());
        resp.setTotalPages(page.getTotalPages());
        return resp;
    }

    @Transactional(readOnly = true)
    public GameResponse getById(Long id) {
        return toResponse(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public GameResponse getBySteamAppId(Integer steamAppId) {
        Game game = gameRepo.findBySteamAppId(steamAppId);
        if (game == null) {
            throw new ResourceNotFoundException("Game", "steamAppId", steamAppId);
        }
        return toResponse(game);
    }

    public GameResponse create(GameRequest req) {
        Game game = new Game();
        fillEntity(game, req);
        return toResponse(gameRepo.save(game));
    }

    public GameResponse update(Long id, GameRequest req) {
        Game existing = findEntityById(id);
        fillEntity(existing, req);
        return toResponse(gameRepo.save(existing));
    }

    public void delete(Long id) {
        if (!gameRepo.existsById(id)) {
            throw new ResourceNotFoundException("Game", "id", id);
        }
        gameRepo.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<GameResponse> search(String q, int limit) {
        return gameRepo.findByNameContainingIgnoreCase(q)
                .stream()
                .limit(limit)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GameResponse> byGenre(String genre) {
        return gameRepo.findByGenres_NameContainingIgnoreCase(genre)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Game findEntityById(Long id) {
        return gameRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", id));
    }

    private void fillEntity(Game game, GameRequest req) {
        game.setSteamAppId(req.getSteamAppId());
        game.setName(req.getName());
        game.setReleaseDate(req.getReleaseDate());
        game.setDeveloper(findOrCreateDeveloper(req.getDeveloper()));
        game.setPublisher(findOrCreatePublisher(req.getPublisher()));
        game.setPrice(req.getPrice());
        game.setRating(req.getRating());
        game.setGenres(parseGenres(req.getGenres()));
        game.setDescription(req.getDescription());
        game.setHeaderImageUrl(req.getHeaderImageUrl());
        game.setWindows(req.getWindows() != null ? req.getWindows() : false);
        game.setMac(req.getMac() != null ? req.getMac() : false);
        game.setLinux(req.getLinux() != null ? req.getLinux() : false);
        game.setMature(req.getMature() != null ? req.getMature() : false);
    }

    /**
     * Il client manda il nome dello sviluppatore come stringa semplice
     * (es. "Valve"), come fa già per ogni altro campo del form. Qui lo
     * traduciamo nella relazione vera: se esiste già un Developer con
     * quel nome lo riusiamo, altrimenti lo creiamo al volo.
     */
    private Developer findOrCreateDeveloper(String name) {
        if (name == null || name.isBlank()) return null;
        return developerRepo.findByName(name)
                .orElseGet(() -> developerRepo.save(new Developer(null, name, null)));
    }

    private Publisher findOrCreatePublisher(String name) {
        if (name == null || name.isBlank()) return null;
        return publisherRepo.findByName(name)
                .orElseGet(() -> publisherRepo.save(new Publisher(null, name, null)));
    }

    /**
     * Il client manda i generi come stringa comma-separated (es.
     * "Action,RPG"), per restare compatibile con il contratto API
     * esistente (GameRequest.genres è ancora una String). Qui splittiamo
     * e troviamo/creiamo ogni Genre, popolando la relazione N:N vera.
     */
    private Set<Genre> parseGenres(String genresCsv) {
        Set<Genre> result = new HashSet<>();
        if (genresCsv == null || genresCsv.isBlank()) return result;
        for (String raw : genresCsv.split(",")) {
            String name = raw.trim();
            if (name.isEmpty()) continue;
            Genre genre = genreRepo.findByName(name)
                    .orElseGet(() -> genreRepo.save(new Genre(null, name, null)));
            result.add(genre);
        }
        return result;
    }

    public GameResponse toResponse(Game game) {
        GameResponse r = new GameResponse();
        r.setId(game.getId());
        r.setSteamAppId(game.getSteamAppId());
        r.setName(game.getName());
        r.setReleaseDate(game.getReleaseDate());
        r.setDeveloper(game.getDeveloper() != null ? game.getDeveloper().getName() : null);
        r.setPublisher(game.getPublisher() != null ? game.getPublisher().getName() : null);
        r.setPrice(game.getPrice());
        r.setRating(game.getRating());
        r.setGenres(game.getGenres().stream()
                .map(Genre::getName)
                .collect(Collectors.joining(",")));
        r.setDescription(game.getDescription());
        r.setHeaderImageUrl(game.getHeaderImageUrl());
        r.setWindows(game.getWindows());
        r.setMac(game.getMac());
        r.setLinux(game.getLinux());
        r.setMature(game.getMature());
        r.setCreatedAt(game.getCreatedAt());
        return r;
    }
}
