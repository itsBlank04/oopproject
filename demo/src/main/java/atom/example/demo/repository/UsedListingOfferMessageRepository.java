package atom.example.demo.repository;
import atom.example.demo.model.UsedListingOfferMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UsedListingOfferMessageRepository extends JpaRepository<UsedListingOfferMessage, Long> {
    List<UsedListingOfferMessage> findByOfferIdOrderByCreatedAtAsc(Long offerId);
}
