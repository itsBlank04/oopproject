package atomdrops.example.atomdrops.web.dto;

import atomdrops.example.atomdrops.model.User;

public class AuthResponse {
    private User user;
    private String role;

    public AuthResponse() {}

    public AuthResponse(User user, String role) {
        this.user = user;
        this.role = role;
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
