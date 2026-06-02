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
        addColumnIfMissing("users", "red_flag_count", "INTEGER NOT NULL DEFAULT 0");
        addColumnIfMissing("users", "red_flag_notes", "TEXT");
        addColumnIfMissing("auctions", "preparation_duration_minutes", "INTEGER DEFAULT 10");
        addColumnIfMissing("auctions", "active_duration_minutes", "INTEGER DEFAULT 60");
        makeColumnNullable("auctions", "start_time");
        makeColumnNullable("auctions", "end_time");
        updateAuctionStatusConstraint();
        normalizeAuctionStatuses();
        updateProductStatusConstraint();
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        try {
            Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=? AND column_name=?)",
                Boolean.class, table, column);
            if (Boolean.TRUE.equals(exists)) {
                if (definition.contains("NOT NULL")) {
                    jdbc.execute("UPDATE " + table + " SET " + column + "=0 WHERE " + column + " IS NULL");
                    try {
                        jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " SET NOT NULL");
                    } catch (Exception e) {
                        log.info("Could not set NOT NULL on {}.{}: {}", table, column, e.getMessage());
                    }
                }
                log.info("Column {}.{} already exists, ensured NOT NULL", table, column);
            } else {
                jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
                log.info("Added column {}.{}", table, column);
            }
        } catch (Exception e) {
            log.info("Could not add column {}.{}: {}", table, column, e.getMessage());
        }
    }

    private void makeColumnNullable(String table, String column) {
        try {
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " DROP NOT NULL");
            log.info("Made {}.{} nullable", table, column);
        } catch (Exception e) {
            log.info("Could not make {}.{} nullable (may already be nullable): {}", table, column, e.getMessage());
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

    private void updateAuctionStatusConstraint() {
        try {
            jdbc.execute("ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_status_check");
            jdbc.execute("ALTER TABLE auctions ADD CONSTRAINT auctions_status_check CHECK (status IN ('CREATED','PREPARING','ACTIVE','CLOSED','FROZEN','SUSPENDED','CANCELLED','REJECTED','APPROVED','COMPLETED','EXTENDED'))");
            log.info("Updated auctions status constraint for public lifecycle and moderation states");
        } catch (Exception e) {
            log.info("Could not update auctions status constraint: {}", e.getMessage());
        }
    }

    private void updateProductStatusConstraint() {
        try {
            jdbc.execute("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check");
            jdbc.execute("ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('ACTIVE','SOLD','REMOVED','HIDDEN'))");
            log.info("Updated products status constraint to include HIDDEN");
        } catch (Exception e) {
            log.info("Could not update products status constraint: {}", e.getMessage());
        }
    }

    private void normalizeAuctionStatuses() {
        try {
            jdbc.execute("UPDATE auctions SET status='PREPARING' WHERE status='APPROVED'");
            jdbc.execute("UPDATE auctions SET status='CLOSED' WHERE status='COMPLETED'");
            jdbc.execute("UPDATE auction_lots SET status='ACTIVE' WHERE status='EXTENDED'");
            log.info("Normalized legacy auction statuses");
        } catch (Exception e) {
            log.info("Could not normalize legacy auction statuses: {}", e.getMessage());
        }
    }
}
