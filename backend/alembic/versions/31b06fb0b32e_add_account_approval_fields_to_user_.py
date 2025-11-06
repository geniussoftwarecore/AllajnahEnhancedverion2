"""Add account approval fields to User model

Revision ID: 31b06fb0b32e
Revises: 
Create Date: 2025-11-06 02:36:38.157442

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31b06fb0b32e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from datetime import datetime
    
    # Create the AccountStatus enum type with lowercase values to match models
    account_status_enum = sa.Enum('pending', 'approved', 'rejected', name='accountstatus')
    account_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Add columns as nullable first to allow data migration
    op.add_column('users', sa.Column('account_status', account_status_enum, nullable=True))
    op.add_column('users', sa.Column('approved_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('approved_by_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('rejection_reason', sa.Text(), nullable=True))
    
    # Data migration: set all existing users to approved status
    # This preserves production data and prevents disruption
    op.execute("""
        UPDATE users 
        SET account_status = 'approved',
            approved_at = created_at
        WHERE account_status IS NULL
    """)
    
    # Now make account_status NOT NULL
    op.alter_column('users', 'account_status', nullable=False)
    
    # Add foreign key constraint with a proper name
    op.create_foreign_key('fk_users_approved_by_id', 'users', 'users', ['approved_by_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraint
    op.drop_constraint('fk_users_approved_by_id', 'users', type_='foreignkey')
    
    # Drop columns
    op.drop_column('users', 'rejection_reason')
    op.drop_column('users', 'approved_by_id')
    op.drop_column('users', 'approved_at')
    op.drop_column('users', 'account_status')
    
    # Drop the enum type with lowercase values
    sa.Enum('pending', 'approved', 'rejected', name='accountstatus').drop(op.get_bind(), checkfirst=True)
