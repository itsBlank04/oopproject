package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "conversation_members")
@IdClass(ConversationMember.ConversationMemberId.class)
public class ConversationMember {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    public ConversationMember() {}

    public Conversation getConversation() { return conversation; }
    public void setConversation(Conversation conversation) { this.conversation = conversation; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public static class ConversationMemberId implements Serializable {
        private Long conversation;
        private Long user;

        public ConversationMemberId() {}
        public ConversationMemberId(Long conversation, Long user) {
            this.conversation = conversation;
            this.user = user;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ConversationMemberId that = (ConversationMemberId) o;
            return Objects.equals(conversation, that.conversation) && Objects.equals(user, that.user);
        }

        @Override
        public int hashCode() { return Objects.hash(conversation, user); }
    }
}
