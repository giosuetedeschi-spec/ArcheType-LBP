package com.archetype.lbp.service;

import com.archetype.lbp.Game;
import com.archetype.lbp.dto.*;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GameService {
    private final GameRepository gameRepo;

    @Transactional(readOnly = true)
    public List<GameResponse> listAll() {
        return gameRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<GameResponse> filter(GameFilterRequest filter) {
        Sort sort = Sort.by(filter.getSortDir().equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                filter.getSortBy());
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);

        Page<Game> page = gameRepo.findAll(
                GameRepository.withFilters(
                        filter.getName(),
                        filter.getGenre(),
                        filter.getDeveloper(),
                        filter.getMinPrice(),
                        filter.getMaxPrice(),
                        filter.getMinRating(),
                        filter.getReleasedAfter(),
                        filter.getReleasedBefore()
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
        return toResponse(findById(id));
    }

    public GameResponse create(GameRequest req) {
        Game game = new Game();
        fillEntity(game, req);
        return toResponse(gameRepo.save(game));
    }

    public GameResponse update(Long id, GameRequest req) {
        Game existing = findById(id);
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
    public List<GameResponse> search(String q) {
        return gameRepo.findAll().stream()
                .filter(g -> g.getName().toLowerCase().contains(q.toLowerCase()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Game findById(Long id) {
        return gameRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Game", "id", id));
    }

    private void fillEntity(Game game, GameRequest req) {
        game.setAppid(req.getSteamAppId());
        game.setName(req.getName());
        game.setReleaseDate(req.getReleaseDate());
        game.setDeveloper(req.getDeveloperId() != null ? new com.archetype.lbp.Developer(req.getDeveloperId()) : null);
        game.setPublisher(req.getPublisherId() != null ? new com.archetype.lbp.Publisher(req.getPublisherId()) : null);
        game.setPrice(req.getPrice());
        game.setRating(req.getRating());
        game.setDescription(req.getDescription());
        game.setHeaderImageUrl(req.getHeaderImageUrl());
        game.setMultiplayer(req.getMultiplayer());
    }

    private GameResponse toResponse(Game game) {
        GameResponse r = new GameResponse();
        r.setId(game.getId());
        r.setSteamAppId(game.getAppid());
        r.setName(game.getName());
        r.setReleaseDate(game.getReleaseDate());
        r.setDeveloper(game.getDeveloper() != null ? game.getDeveloper().getName() : null);
        r.setPublisher(game.getPublisher() != null ? game.getPublisher().getName() : null);
        r.setPrice(game.getPrice());
        r.setRating(game.getRating());
        r.setDescription(game.getDescription());
        r.setHeaderImageUrl(game.getHeaderImageUrl());
        r.setMultiplayer(game.getMultiplayer());
        r.setCreatedAt(game.getCreatedAt());
        return r;
    }
}
