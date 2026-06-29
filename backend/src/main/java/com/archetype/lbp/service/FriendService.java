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

    public List<FriendResponse> getPending(Long userId) {
        return friendRepo.findByUser_IdAndStatus(userId, "pending").stream()
                .map(this::toResponse)
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

    @Transactional
    public void updateStatus(Long userId, Long friendId, String action) {
        Friend friend = friendRepo.findByUser_IdAndFriend_Id(userId, friendId)
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
}
