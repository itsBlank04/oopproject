package atomdrops.example.atomdrops.model.enums;

public enum TechnicianSpecialization {
    ELECTRONICS("Electronics"),
    ELECTRICAL("Electrical"),
    FURNITURE("Furniture"),
    APPLIANCES("Appliances");

    private final String displayName;

    TechnicianSpecialization(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
