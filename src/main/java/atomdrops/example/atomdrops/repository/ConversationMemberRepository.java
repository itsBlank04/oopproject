package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.ConversationMember;
import atomdrops.example.atomdrops.model.ConversationMember.ConversationMemberId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, ConversationMemberId> {
    List<ConversationMember> findByUser_Id(Long userId);
}
