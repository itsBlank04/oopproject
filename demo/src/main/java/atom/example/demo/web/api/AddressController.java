package atom.example.demo.web.api;

import atom.example.demo.model.Address;
import atom.example.demo.model.User;
import atom.example.demo.repository.AddressRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressController(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Address> listAddresses(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
    }

    @PostMapping
    public Address createAddress(@RequestBody Address address, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        address.setUser(user);
        return addressRepository.save(address);
    }

    @PutMapping("/{id}")
    public Address updateAddress(@PathVariable Long id, @RequestBody Address address) {
        Address existing = addressRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        if (address.getLabel() != null) existing.setLabel(address.getLabel());
        if (address.getFullName() != null) existing.setFullName(address.getFullName());
        if (address.getPhone() != null) existing.setPhone(address.getPhone());
        if (address.getAddressLine() != null) existing.setAddressLine(address.getAddressLine());
        if (address.getCity() != null) existing.setCity(address.getCity());
        if (address.getArea() != null) existing.setArea(address.getArea());
        if (address.getPostalCode() != null) existing.setPostalCode(address.getPostalCode());
        return addressRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public String deleteAddress(@PathVariable Long id) {
        addressRepository.deleteById(id);
        return "ok";
    }

    @PutMapping("/{id}/default")
    public Address setDefault(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
        for (Address addr : addresses) {
            addr.setIsDefault(addr.getId().equals(id));
            addressRepository.save(addr);
        }
        return addressRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
    }
}
