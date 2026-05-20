package atom.example.demo.repository;
import atom.example.demo.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);
    long countByConversationIdAndIsReadFalseAndSenderIdNot(Long conversationId, Long senderId);
}
