package atomdrops.example.atomdrops.model.enums;

public enum TechnicianLevel {
    BEGINNER("Beginner"),
    VERIFIED("Verified"),
    EXPERT("Expert");

    private final String displayName;

    TechnicianLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
