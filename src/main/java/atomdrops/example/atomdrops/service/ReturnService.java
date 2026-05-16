package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.OrderItem;
import atomdrops.example.atomdrops.model.Return;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.ReturnStatus;
import atomdrops.example.atomdrops.repository.OrderItemRepository;
import atomdrops.example.atomdrops.repository.ReturnRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReturnService {

    private final ReturnRepository returnRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public ReturnService(ReturnRepository returnRepository, OrderItemRepository orderItemRepository, UserRepository userRepository) {
        this.returnRepository = returnRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
    }

    public Return createReturn(Long customerId, Long orderItemId, String reason) {
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        OrderItem item = orderItemRepository.findById(orderItemId)
            .orElseThrow(() -> new IllegalArgumentException("Order item not found"));
        if (!item.getOrder().getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Not your order item");
        }
        Return r = new Return();
        r.setCustomer(customer);
        r.setOrderItem(item);
        r.setReason(reason);
        r.setStatus(ReturnStatus.OPEN);
        return returnRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<Return> getReturns(Long customerId) {
        return returnRepository.findByCustomer_Id(customerId);
    }

    @Transactional(readOnly = true)
    public List<Return> getAllReturns() {
        return returnRepository.findAll();
    }

    public void approveReturn(Long returnId) {
        Return r = returnRepository.findById(returnId)
            .orElseThrow(() -> new IllegalArgumentException("Return not found"));
        r.setStatus(ReturnStatus.APPROVED);
        returnRepository.save(r);
    }

    public void rejectReturn(Long returnId) {
        Return r = returnRepository.findById(returnId)
            .orElseThrow(() -> new IllegalArgumentException("Return not found"));
        r.setStatus(ReturnStatus.REJECTED);
        returnRepository.save(r);
    }
}
