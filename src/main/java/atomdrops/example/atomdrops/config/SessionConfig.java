package atomdrops.example.atomdrops.config;

import jakarta.servlet.SessionTrackingMode;
import java.util.EnumSet;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SessionConfig {

    @Bean
    public ServletContextInitializer cookieOnlySession() {
        return servletContext -> servletContext.setSessionTrackingModes(
                EnumSet.of(SessionTrackingMode.COOKIE)
        );
    }
}
