package com.archetype.lbp.service;

import com.archetype.lbp.model.Friend;
import com.archetype.lbp.model.User;

import com.archetype.lbp.dto.FriendResponse;
import com.archetype.lbp.exception.ResourceNotFoundException;
import com.archetype.lbp.repository.FriendRepository;
import com.archetype.lbp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {
    private final FriendRepository friendRepo;
    private final UserRepository userRepo;

    public List<FriendResponse> getFriends(Long userId) {
        return friendRepo.findByUser_IdAndStatus(userId, "accepted").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Richieste di amicizia RICEVUTE da questo utente, in attesa di
     * accettazione/rifiuto.
     *
     * addFriend crea una sola riga (user=mittente, friend=destinatario,
     * status=pending): per vedere le richieste in arrivo va interrogata la
     * colonna friend_id (dove l'utente è il destinatario), non user_id
     * (che mostrerebbe invece le richieste INVIATE da lui — bug corretto
     * qui: prima usava findByUser_IdAndStatus, quindi il destinatario non
     * vedeva mai le richieste ricevute). Il DTO mostra i dati del
     * mittente (friend.getUser()), non del destinatario.
     */
    public List<FriendResponse> getPending(Long userId) {
        return friendRepo.findByFriend_IdAndStatus(userId, "pending").stream()
                .map(this::toResponseFromSender)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addFriend(Long userId, Long friendId) {
        if (userId.equals(friendId)) {
            throw new IllegalArgumentException("Cannot add yourself as friend");
        }
        if (friendRepo.existsByUser_IdAndFriend_Id(userId, friendId)) {
            throw new IllegalArgumentException("Friend request already exists");
        }
        User user = userRepo.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        User friend = userRepo.findById(friendId).orElseThrow(() -> new ResourceNotFoundException("User", "id", friendId));

        Friend f = new Friend();
        f.setUser(user);
        f.setFriend(friend);
        f.setStatus("pending");
        friendRepo.save(f);
    }

    /**
     * Accetta o rifiuta una richiesta ricevuta. userId è chi chiama
     * l'endpoint (il destinatario), friendId è il mittente originale.
     *
     * La riga da aggiornare è quella creata da addFriend, cioè
     * (user=friendId, friend=userId) — non (user=userId, friend=friendId),
     * che non esiste finché il destinatario non ha mai inviato a sua volta
     * una richiesta al mittente. Bug corretto qui: prima cercava la riga
     * con gli argomenti invertiti, quindi accept/reject fallivano sempre
     * con 404 per chi riceve la richiesta.
     */
    @Transactional
    public void updateStatus(Long userId, Long friendId, String action) {
        Friend friend = friendRepo.findByUser_IdAndFriend_Id(friendId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend", "id", friendId));
        if ("accept".equals(action)) {
            friend.setStatus("accepted");
            friendRepo.save(friend);

            // ponytail: bidirectional — create reverse Friend entry too
            Friend reverse = new Friend();
            reverse.setUser(friend.getFriend());
            reverse.setFriend(friend.getUser());
            reverse.setStatus("accepted");
            friendRepo.save(reverse);
        } else {
            friendRepo.delete(friend);
        }
    }

    @Transactional
    public void removeFriend(Long userId, Long friendId) {
        Friend friend = friendRepo.findByUser_IdAndFriend_Id(userId, friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend", "id", friendId));
        friendRepo.delete(friend);

        // ponytail: remove reverse too
        friendRepo.findByUser_IdAndFriend_Id(friendId, userId).ifPresent(friendRepo::delete);
    }

    private FriendResponse toResponse(Friend friend) {
        User f = friend.getFriend();
        FriendResponse r = new FriendResponse();
        r.setFriendId(f.getId());
        r.setUsername(f.getUsername());
        r.setAvatarUrl(f.getAvatarUrl());
        r.setStatus(friend.getStatus());
        r.setCreatedAt(friend.getCreatedAt());
        return r;
    }

    // Come toResponse, ma mostra il MITTENTE (friend.getUser()) invece del
    // destinatario — usato da getPending, dove la riga è (user=mittente,
    // friend=me) e vogliamo comunque restituire "chi mi ha inviato la
    // richiesta", non me stesso.
    private FriendResponse toResponseFromSender(Friend friend) {
        User sender = friend.getUser();
        FriendResponse r = new FriendResponse();
        r.setFriendId(sender.getId());
        r.setUsername(sender.getUsername());
        r.setAvatarUrl(sender.getAvatarUrl());
        r.setStatus(friend.getStatus());
        r.setCreatedAt(friend.getCreatedAt());
        return r;
    }
}
