package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Conversation;
import atomdrops.example.atomdrops.model.ConversationMember;
import atomdrops.example.atomdrops.model.Message;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.repository.ConversationMemberRepository;
import atomdrops.example.atomdrops.repository.ConversationRepository;
import atomdrops.example.atomdrops.repository.MessageRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatService(
            ConversationRepository conversationRepository,
            ConversationMemberRepository conversationMemberRepository,
            MessageRepository messageRepository,
            UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.conversationMemberRepository = conversationMemberRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public Conversation createConversation(Long userId1, Long userId2) {
        Conversation c = new Conversation();
        c = conversationRepository.save(c);
        ConversationMember cm1 = new ConversationMember();
        cm1.setConversation(c);
        cm1.setUser(userRepository.getReferenceById(userId1));
        ConversationMember cm2 = new ConversationMember();
        cm2.setConversation(c);
        cm2.setUser(userRepository.getReferenceById(userId2));
        conversationMemberRepository.save(cm1);
        conversationMemberRepository.save(cm2);
        return c;
    }

    public Message sendMessage(Long conversationId, Long senderId, String text) {
        Conversation c = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        boolean isMember = conversationMemberRepository
            .findByConversation_IdAndUser_Id(conversationId, senderId).isPresent();
        if (!isMember) throw new IllegalArgumentException("Not a member of this conversation");
        Message m = new Message();
        m.setConversation(c);
        m.setSender(sender);
        m.setMessage(text);
        return messageRepository.save(m);
    }

    @Transactional(readOnly = true)
    public List<Conversation> getConversations(Long userId) {
        List<ConversationMember> members = conversationMemberRepository.findByUser_Id(userId);
        return members.stream().map(ConversationMember::getConversation).toList();
    }

    @Transactional(readOnly = true)
    public List<Message> getMessages(Long conversationId, Long userId) {
        boolean isMember = conversationMemberRepository
            .findByConversation_IdAndUser_Id(conversationId, userId).isPresent();
        if (!isMember) throw new IllegalArgumentException("Not a member of this conversation");
        return messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional(readOnly = true)
    public Message getLastMessage(Long conversationId) {
        List<Message> msgs = messageRepository.findByConversation_IdOrderByCreatedAtAsc(conversationId);
        return msgs.isEmpty() ? null : msgs.getLast();
    }

    public Conversation findExistingConversation(Long userId1, Long userId2) {
        List<ConversationMember> members1 = conversationMemberRepository.findByUser_Id(userId1);
        for (ConversationMember cm1 : members1) {
            for (ConversationMember cm2 : conversationMemberRepository.findByUser_Id(userId2)) {
                if (cm1.getConversation().getId().equals(cm2.getConversation().getId())) {
                    return cm1.getConversation();
                }
            }
        }
        return null;
    }
}
