package atom.example.demo.repository;
import atom.example.demo.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
}
