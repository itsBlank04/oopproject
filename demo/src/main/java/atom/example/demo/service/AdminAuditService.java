package atom.example.demo.service;

import atom.example.demo.model.AuditLog;
import atom.example.demo.repository.AuditLogRepository;
import atom.example.demo.repository.UserRepository;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AdminAuditService(AuditLogRepository auditLogRepository,
            UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void record(Long actorId, String action, String entityType, Long entityId,
            Map<String, Object> oldData, Map<String, Object> newData) {
        AuditLog log = new AuditLog();
        if (actorId != null) userRepository.findById(actorId).ifPresent(log::setActor);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setOldData(toJson(oldData));
        log.setNewData(toJson(newData));
        auditLogRepository.save(log);
    }

    private String toJson(Map<String, Object> data) {
        if (data == null || data.isEmpty()) return null;
        return data.entrySet().stream()
                .map(entry -> quote(entry.getKey()) + ":" + jsonValue(entry.getValue()))
                .collect(Collectors.joining(",", "{", "}"));
    }

    private String jsonValue(Object value) {
        if (value == null) return "null";
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .map(this::jsonValue)
                    .collect(Collectors.joining(",", "[", "]"));
        }
        return quote(value.toString());
    }

    private String quote(String value) {
        return "\"" + value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t") + "\"";
    }
}
