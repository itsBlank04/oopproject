package atom.example.demo.repository;
import atom.example.demo.model.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {
    List<ConversationMember> findByUserId(Long userId);
    List<ConversationMember> findByConversationId(Long conversationId);
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);
}
