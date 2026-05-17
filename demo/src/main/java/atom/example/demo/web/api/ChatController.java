package atom.example.demo.web.api;

import atom.example.demo.model.Conversation;
import atom.example.demo.model.ConversationMember;
import atom.example.demo.model.Message;
import atom.example.demo.model.User;
import atom.example.demo.repository.ConversationMemberRepository;
import atom.example.demo.repository.ConversationRepository;
import atom.example.demo.repository.MessageRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatController(ConversationRepository conversationRepository,
            ConversationMemberRepository conversationMemberRepository,
            MessageRepository messageRepository, UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.conversationMemberRepository = conversationMemberRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/conversations")
    public List<Conversation> listConversations(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        List<ConversationMember> members = conversationMemberRepository.findByUserId(userId);
        return members.stream().map(ConversationMember::getConversation).collect(Collectors.toList());
    }

    @PostMapping("/conversations")
    public Conversation createConversation(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User me = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Long otherUserId = Long.valueOf(body.get("otherUserId").toString());
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
        return conversation;
    }

    @GetMapping("/conversations/{id}/messages")
    public List<Message> getMessages(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!conversationMemberRepository.existsByConversationIdAndUserId(id, userId)) {
            throw new IllegalArgumentException("Not a member of this conversation");
        }
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(id);
    }

    @PostMapping("/conversations/{id}/messages")
    public Message sendMessage(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
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
        return messageRepository.save(message);
    }
}
