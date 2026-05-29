package atom.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrator.class);

    private final JdbcTemplate jdbc;

    public DatabaseMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbc = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        migrateColumn("payments", "gateway_response");
        migrateColumn("auction_payments", "gateway_response");
        migrateColumn("repair_payments", "gateway_response");
        addColumnIfMissing("products", "shipping_type", "TEXT NOT NULL DEFAULT 'FREE'");
        addColumnIfMissing("carts", "status", "TEXT NOT NULL DEFAULT 'ACTIVE'");
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        try {
            jdbc.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + definition);
            log.info("Added column {}.{}", table, column);
        } catch (Exception e) {
            log.info("Could not add column {}.{}: {}", table, column, e.getMessage());
        }
    }

    private void migrateColumn(String table, String column) {
        try {
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT USING " + column + "::text");
            log.info("Migrated {}.{} to TEXT", table, column);
        } catch (Exception e) {
            log.info("Column {}.{} already TEXT or migration skipped: {}", table, column, e.getMessage());
        }
    }
}
