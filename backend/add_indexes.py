from sqlalchemy import text
from database import engine

def add_performance_indexes():
    """Add database indexes for better query performance"""
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)",
        "CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category_id)",
        "CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON complaints(assigned_to_id)",
        "CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority)",
        "CREATE INDEX IF NOT EXISTS idx_comments_complaint ON comments(complaint_id)",
        "CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_attachments_complaint ON attachments(complaint_id)",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id)",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)",
        "CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_subscriptions_trader ON subscriptions(trader_id)",
        "CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)",
    ]
    
    for index_sql in indexes:
        with engine.connect() as conn:
            try:
                conn.execute(text(index_sql))
                conn.commit()
                print(f"✓ Created index: {index_sql.split('idx_')[1].split(' ON')[0]}")
            except Exception as e:
                print(f"✗ Error creating index: {e}")
    
    print("\n✓ All performance indexes have been added successfully!")


if __name__ == "__main__":
    add_performance_indexes()
