"""
Add performance indexes to optimize complaint queries.
This script adds critical indexes for frequently queried fields.
"""

from database import engine
from sqlalchemy import text

def add_performance_indexes():
    """Add indexes for commonly queried fields to improve performance."""
    
    indexes_to_add = [
        # Individual column indexes for filtering
        ("idx_complaints_status", "CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status)"),
        ("idx_complaints_priority", "CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints (priority)"),
        ("idx_complaints_category_id", "CREATE INDEX IF NOT EXISTS idx_complaints_category_id ON complaints (category_id)"),
        ("idx_complaints_user_id", "CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints (user_id)"),
        ("idx_complaints_assigned_to_id", "CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to_id ON complaints (assigned_to_id)"),
        ("idx_complaints_task_status", "CREATE INDEX IF NOT EXISTS idx_complaints_task_status ON complaints (task_status)"),
        
        # Composite indexes for common query patterns
        ("idx_complaints_status_priority", "CREATE INDEX IF NOT EXISTS idx_complaints_status_priority ON complaints (status, priority)"),
        ("idx_complaints_category_status", "CREATE INDEX IF NOT EXISTS idx_complaints_category_status ON complaints (category_id, status)"),
        ("idx_complaints_status_created", "CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON complaints (status, created_at DESC)"),
        
        # Trader-specific composite indexes for high performance
        ("idx_complaints_user_status", "CREATE INDEX IF NOT EXISTS idx_complaints_user_status ON complaints (user_id, status)"),
        ("idx_complaints_user_created", "CREATE INDEX IF NOT EXISTS idx_complaints_user_created ON complaints (user_id, created_at DESC)"),
        ("idx_complaints_user_status_created", "CREATE INDEX IF NOT EXISTS idx_complaints_user_status_created ON complaints (user_id, status, created_at DESC)"),
        
        # Index for SLA monitoring queries
        ("idx_complaints_status_created_sla", "CREATE INDEX IF NOT EXISTS idx_complaints_status_created_sla ON complaints (status, created_at) WHERE status = 'UNDER_REVIEW'"),
        
        # Indexes for user account queries
        ("idx_users_role_active", "CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active)"),
        ("idx_users_account_status", "CREATE INDEX IF NOT EXISTS idx_users_account_status ON users (account_status)"),
        
        # Indexes for notification queries
        ("idx_notifications_user_read", "CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC)"),
        
        # Index for audit log queries
        ("idx_audit_logs_target", "CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs (target_type, target_id, created_at DESC)"),
    ]
    
    print("Adding performance indexes...")
    with engine.connect() as conn:
        for idx_name, idx_sql in indexes_to_add:
            try:
                conn.execute(text(idx_sql))
                conn.commit()
                print(f"✓ Added index: {idx_name}")
            except Exception as e:
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"✓ Index already exists: {idx_name}")
                else:
                    print(f"✗ Error adding index {idx_name}: {e}")
                conn.rollback()
    
    print("\n✓ Performance indexes setup complete!")

if __name__ == "__main__":
    add_performance_indexes()
