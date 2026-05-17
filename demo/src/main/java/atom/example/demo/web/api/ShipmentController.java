package atom.example.demo.web.api;

import atom.example.demo.model.Shipment;
import atom.example.demo.repository.ShipmentRepository;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentRepository shipmentRepository;

    public ShipmentController(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @GetMapping("/order/{orderId}")
    public Shipment getShipmentByOrder(@PathVariable Long orderId) {
        return shipmentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));
    }

    @PutMapping("/{id}")
    public Shipment updateShipmentStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Shipment shipment = shipmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Shipment not found"));
        if (body.containsKey("status")) {
            shipment.setStatus(body.get("status"));
        }
        if (body.containsKey("carrier")) {
            shipment.setCarrier(body.get("carrier"));
        }
        if (body.containsKey("trackingNumber")) {
            shipment.setTrackingNumber(body.get("trackingNumber"));
        }
        return shipmentRepository.save(shipment);
    }
}
