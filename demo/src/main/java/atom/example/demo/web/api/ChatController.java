package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Conversation;
import atom.example.demo.model.ConversationMember;
import atom.example.demo.model.Message;
import atom.example.demo.model.User;
import atom.example.demo.repository.ConversationMemberRepository;
import atom.example.demo.repository.ConversationRepository;
import atom.example.demo.repository.MessageRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api", "/api/chat"})
public class ChatController {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public ChatController(ConversationRepository conversationRepository,
            ConversationMemberRepository conversationMemberRepository,
            MessageRepository messageRepository, UserRepository userRepository,
            EntityManager entityManager) {
        this.conversationRepository = conversationRepository;
        this.conversationMemberRepository = conversationMemberRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            userId = SecurityConfig.getSessionUserId();
        }
        return userId;
    }

    @GetMapping("/conversations")
    public List<Map<String, Object>> listConversations(HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        List<ConversationMember> members = conversationMemberRepository.findByUserId(userId);
        return members.stream().map(m -> {
            Conversation conv = m.getConversation();
            List<ConversationMember> allMembers = conversationMemberRepository.findByConversationId(conv.getId());
            ConversationMember otherMember = allMembers.stream()
                .filter(cm -> !cm.getUser().getId().equals(userId))
                .findFirst().orElse(null);
            User otherUser = otherMember != null ? otherMember.getUser() : null;
            Message lastMsg = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conv.getId()).orElse(null);
            long unreadCount = messageRepository.countByConversationIdAndIsReadFalseAndSenderIdNot(conv.getId(), userId);
            Map<String, Object> result = new HashMap<>();
            result.put("id", conv.getId());
            result.put("createdAt", conv.getCreatedAt());
            if (otherUser != null) {
                result.put("otherUserId", otherUser.getId());
                result.put("otherUserName", otherUser.getDisplayName());
                result.put("otherUserAvatar", otherUser.getAvatarUrl() != null ? otherUser.getAvatarUrl() : "");
            }
            if (lastMsg != null) {
                result.put("lastMessage", lastMsg.getBody());
                result.put("lastMessageAt", lastMsg.getCreatedAt());
                result.put("lastMessageSenderId", lastMsg.getSender().getId());
            }
            result.put("unreadCount", unreadCount);
            return result;
        }).collect(Collectors.toList());
    }

    @PostMapping("/conversations")
    public Map<String, Object> createConversation(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Long otherUserId = Long.valueOf(body.get("otherUserId").toString());
        if (otherUserId.equals(userId)) {
            throw new IllegalArgumentException("Cannot start a conversation with yourself");
        }
        // Check for existing conversation between these two users
        List<ConversationMember> myMemberships = conversationMemberRepository.findByUserId(userId);
        for (ConversationMember member : myMemberships) {
            if (conversationMemberRepository.existsByConversationIdAndUserId(member.getConversation().getId(), otherUserId)) {
                Conversation existing = member.getConversation();
                Map<String, Object> result = new HashMap<>();
                result.put("id", existing.getId());
                result.put("createdAt", existing.getCreatedAt());
                result.put("existing", true);
                return result;
            }
        }
        User me = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        User other = userRepository.findById(otherUserId).orElseThrow(() -> new IllegalArgumentException("Other user not found"));
        Conversation conversation = new Conversation();
        conversation = conversationRepository.save(conversation);
        ConversationMember member1 = new ConversationMember();
        member1.setConversation(conversation);
        member1.setUser(me);
        conversationMemberRepository.save(member1);
        ConversationMember member2 = new ConversationMember();
        member2.setConversation(conversation);
        member2.setUser(other);
        conversationMemberRepository.save(member2);
        Map<String, Object> result = new HashMap<>();
        result.put("id", conversation.getId());
        result.put("createdAt", conversation.getCreatedAt());
        return result;
    }

    @GetMapping("/conversations/{id}/messages")
    public List<Map<String, Object>> getMessages(@PathVariable Long id, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!conversationMemberRepository.existsByConversationIdAndUserId(id, userId)) {
            throw new IllegalArgumentException("Not a member of this conversation");
        }
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id);
        messages.stream()
            .filter(msg -> !msg.getSender().getId().equals(userId) && !msg.isRead())
            .forEach(msg -> { msg.setRead(true); messageRepository.save(msg); });
        return messages.stream().map(msg -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", msg.getId());
            m.put("body", msg.getBody());
            m.put("senderId", msg.getSender().getId());
            m.put("senderName", msg.getSender().getDisplayName());
            m.put("senderAvatar", msg.getSender().getAvatarUrl() != null ? msg.getSender().getAvatarUrl() : "");
            m.put("isMine", msg.getSender().getId().equals(userId));
            m.put("isRead", msg.isRead());
            m.put("createdAt", msg.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
    }

    @PostMapping("/conversations/{id}/messages")
    public Map<String, Object> sendMessage(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!conversationMemberRepository.existsByConversationIdAndUserId(id, userId)) {
            throw new IllegalArgumentException("Not a member of this conversation");
        }
        User sender = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Conversation conversation = conversationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setBody((String) body.get("body"));
        message = messageRepository.save(message);
        Map<String, Object> result = new HashMap<>();
        result.put("id", message.getId());
        result.put("body", message.getBody());
        result.put("senderId", sender.getId());
        result.put("senderName", sender.getDisplayName());
        result.put("senderAvatar", sender.getAvatarUrl() != null ? sender.getAvatarUrl() : "");
        result.put("isMine", true);
        result.put("createdAt", message.getCreatedAt());
        return result;
    }

    @Transactional
    @DeleteMapping("/conversations")
    public String deleteAllConversations() {
        entityManager.createNativeQuery("DELETE FROM messages").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM conversation_members").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM conversations").executeUpdate();
        return "ok";
    }
}
