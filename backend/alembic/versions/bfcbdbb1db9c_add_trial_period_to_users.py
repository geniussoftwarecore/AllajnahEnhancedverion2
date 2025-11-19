"""add_trial_period_to_users

Revision ID: bfcbdbb1db9c
Revises: aac18f0b9637
Create Date: 2025-11-19 19:55:52.447174

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bfcbdbb1db9c'
down_revision: Union[str, Sequence[str], None] = 'aac18f0b9637'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('trial_start_date', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('trial_end_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'trial_end_date')
    op.drop_column('users', 'trial_start_date')
