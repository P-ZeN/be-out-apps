#!/bin/bash

# Enhanced Event Status Management Migration Script
# This script applies the database migration for the new status management system

set -e  # Exit on any error

# Database connection parameters (adjust as needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-beout_db}"
DB_USER="${DB_USER:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Enhanced Event Status Management Migration...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Migration file path
MIGRATION_FILE="$(dirname "$0")/008_enhanced_event_status_management.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Migration file found: $MIGRATION_FILE${NC}"

# Backup current database (optional but recommended)
echo -e "${YELLOW}Creating database backup...${NC}"
BACKUP_FILE="backup_before_status_migration_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"

# Apply migration
echo -e "${YELLOW}Applying migration...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration completed successfully!${NC}"

    # Verify migration by checking if new columns exist
    echo -e "${YELLOW}Verifying migration...${NC}"

    # Check if new columns exist
    NEW_COLUMNS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name IN ('is_published', 'status_changed_at', 'status_changed_by');
    " | wc -l)

    if [ "$NEW_COLUMNS" -eq 3 ]; then
        echo -e "${GREEN}✓ New columns added successfully${NC}"
    else
        echo -e "${RED}✗ Some columns may be missing${NC}"
    fi

    # Check if new table exists
    STATUS_HISTORY_TABLE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_name = 'event_status_history';
    ")

    if [ "$STATUS_HISTORY_TABLE" -eq 1 ]; then
        echo -e "${GREEN}✓ Event status history table created${NC}"
    else
        echo -e "${RED}✗ Event status history table not found${NC}"
    fi

    # Check if triggers exist
    TRIGGERS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*)
        FROM information_schema.triggers
        WHERE trigger_name IN ('trigger_log_event_status_change', 'trigger_notify_event_status_change');
    ")

    if [ "$TRIGGERS" -eq 2 ]; then
        echo -e "${GREEN}✓ Status change triggers created${NC}"
    else
        echo -e "${RED}✗ Some triggers may be missing${NC}"
    fi

    echo -e "${GREEN}Migration verification completed!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update your application code to use the new status management system"
    echo "2. Test the new functionality in a development environment"
    echo "3. Update your frontend components to use the new status workflow"
    echo "4. Train your team on the new event management process"

else
    echo -e "${RED}Migration failed! Check the error messages above.${NC}"
    echo -e "${YELLOW}You can restore from backup if needed: $BACKUP_FILE${NC}"
    exit 1
fi
