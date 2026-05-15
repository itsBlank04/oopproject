package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
}
