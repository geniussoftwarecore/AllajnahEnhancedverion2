#!/bin/bash
#
# AllAjnah Database Backup Script
# 
# This script creates compressed backups of the PostgreSQL database
# and manages backup retention (keeps last 30 days by default)
#
# Usage:
#   ./backup-db.sh                    # Interactive mode - prompts for credentials
#   ./backup-db.sh auto               # Auto mode - uses environment variables
#
# Environment Variables (for auto mode):
#   DB_HOST      - Database host (default: localhost)
#   DB_PORT      - Database port (default: 5432)
#   DB_NAME      - Database name (default: allajnah_db)
#   DB_USER      - Database user (default: postgres)
#   DB_PASSWORD  - Database password (required in auto mode)
#   BACKUP_DIR   - Backup directory (default: ./backups)
#   RETENTION_DAYS - Days to keep backups (default: 30)
#
# Schedule with cron (daily at 2 AM):
#   0 2 * * * /path/to/backup-db.sh auto >> /var/log/allajnah-backup.log 2>&1

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_BACKUP_DIR="./backups"
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT="5432"
DEFAULT_DB_NAME="allajnah_db"
DEFAULT_DB_USER="postgres"
DEFAULT_RETENTION_DAYS=30

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Function to check if required commands exist
check_requirements() {
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump not found. Please install postgresql-client"
        exit 1
    fi
    
    if ! command -v gzip &> /dev/null; then
        print_error "gzip not found. Please install gzip"
        exit 1
    fi
    
    print_success "All required tools are installed"
}

# Interactive mode - prompt for credentials
interactive_mode() {
    print_info "=== AllAjnah Database Backup (Interactive Mode) ==="
    echo ""
    
    read -p "Database host [$DEFAULT_DB_HOST]: " DB_HOST
    DB_HOST=${DB_HOST:-$DEFAULT_DB_HOST}
    
    read -p "Database port [$DEFAULT_DB_PORT]: " DB_PORT
    DB_PORT=${DB_PORT:-$DEFAULT_DB_PORT}
    
    read -p "Database name [$DEFAULT_DB_NAME]: " DB_NAME
    DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}
    
    read -p "Database user [$DEFAULT_DB_USER]: " DB_USER
    DB_USER=${DB_USER:-$DEFAULT_DB_USER}
    
    read -sp "Database password: " DB_PASSWORD
    echo ""
    
    read -p "Backup directory [$DEFAULT_BACKUP_DIR]: " BACKUP_DIR
    BACKUP_DIR=${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}
    
    read -p "Retention days [$DEFAULT_RETENTION_DAYS]: " RETENTION_DAYS
    RETENTION_DAYS=${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}
    
    echo ""
}

# Auto mode - use environment variables
auto_mode() {
    DB_HOST=${DB_HOST:-$DEFAULT_DB_HOST}
    DB_PORT=${DB_PORT:-$DEFAULT_DB_PORT}
    DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}
    DB_USER=${DB_USER:-$DEFAULT_DB_USER}
    BACKUP_DIR=${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}
    RETENTION_DAYS=${RETENTION_DAYS:-$DEFAULT_RETENTION_DAYS}
    
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable is required in auto mode"
        exit 1
    fi
}

# Create backup
create_backup() {
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Generate timestamp for backup filename
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/allajnah_db_$TIMESTAMP.sql.gz"
    
    print_info "Starting backup of database '$DB_NAME' on $DB_HOST:$DB_PORT"
    print_info "Backup file: $BACKUP_FILE"
    
    # Set password for pg_dump
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create backup with progress
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --format=plain \
        --no-owner \
        --no-acl \
        2>&1 | gzip > "$BACKUP_FILE"; then
        
        unset PGPASSWORD
        
        # Get backup file size
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        
        print_success "Backup created successfully: $BACKUP_FILE ($SIZE)"
        return 0
    else
        unset PGPASSWORD
        print_error "Backup failed!"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    print_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Find and delete old backups
    DELETED=$(find "$BACKUP_DIR" -name "allajnah_db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    if [ "$DELETED" -gt 0 ]; then
        print_success "Deleted $DELETED old backup(s)"
    else
        print_info "No old backups to delete"
    fi
    
    # Show current backups
    CURRENT=$(find "$BACKUP_DIR" -name "allajnah_db_*.sql.gz" -type f | wc -l)
    print_info "Current backups: $CURRENT file(s)"
}

# Main execution
main() {
    echo "========================================"
    echo "  AllAjnah Database Backup Script"
    echo "========================================"
    echo ""
    
    # Check requirements
    check_requirements
    
    # Determine mode
    if [ "$1" == "auto" ]; then
        print_info "Running in AUTO mode (using environment variables)"
        auto_mode
    else
        interactive_mode
    fi
    
    # Create backup
    if create_backup; then
        # Clean old backups
        cleanup_old_backups
        
        echo ""
        print_success "Backup process completed successfully!"
        
        # Show latest backups
        echo ""
        print_info "Latest 5 backups:"
        find "$BACKUP_DIR" -name "allajnah_db_*.sql.gz" -type f -printf "%T@ %Tc %p\n" | sort -rn | head -5 | cut -d' ' -f2-
        
        exit 0
    else
        echo ""
        print_error "Backup process failed!"
        exit 1
    fi
}

# Run main function
main "$@"
