package atom.example.demo.service;

import atom.example.demo.model.Address;
import atom.example.demo.model.User;
import atom.example.demo.repository.AddressRepository;
import atom.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<Address> getAddressesByUser(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
    }

    public Address getAddressById(Long id) {
        return addressRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
    }

    @Transactional
    public Address createAddress(Long userId, Address address) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        address.setUser(user);
        return addressRepository.save(address);
    }

    @Transactional
    public Address updateAddress(Long id, Address address) {
        Address existing = addressRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        existing.setLabel(address.getLabel());
        existing.setFullName(address.getFullName());
        existing.setPhone(address.getPhone());
        existing.setAddressLine(address.getAddressLine());
        existing.setCity(address.getCity());
        existing.setArea(address.getArea());
        existing.setPostalCode(address.getPostalCode());
        existing.setIsDefault(address.getIsDefault());
        return addressRepository.save(existing);
    }

    @Transactional
    public void deleteAddress(Long id) {
        Address address = addressRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        addressRepository.delete(address);
    }

    @Transactional
    public void setDefault(Long id, Long userId) {
        List<Address> userAddresses = addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
        for (Address addr : userAddresses) {
            addr.setIsDefault(addr.getId().equals(id));
            addressRepository.save(addr);
        }
    }
}
