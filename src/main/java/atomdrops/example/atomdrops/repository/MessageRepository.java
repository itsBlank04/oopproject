package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Message;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @EntityGraph(attributePaths = {"sender", "conversation"})
    List<Message> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);
}
