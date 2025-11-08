"""add_notifications_table

Revision ID: aac18f0b9637
Revises: ef78ab18718a
Create Date: 2025-11-08 00:50:58.859956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aac18f0b9637'
down_revision: Union[str, Sequence[str], None] = 'ef78ab18718a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum(
            'COMPLAINT_CREATED', 'COMPLAINT_ASSIGNED', 'COMPLAINT_STATUS_UPDATED',
            'COMPLAINT_ESCALATED', 'COMMENT_ADDED', 'TASK_ASSIGNED',
            'TASK_ACCEPTED', 'TASK_DECLINED', 'APPROVAL_REQUIRED',
            'APPEAL_SUBMITTED', 'MEDIATION_REQUESTED', 'PAYMENT_STATUS_CHANGED',
            'SUBSCRIPTION_EXPIRING', 'SLA_WARNING', 'SLA_VIOLATION',
            'ACCOUNT_APPROVED', 'ACCOUNT_REJECTED',
            name='notificationtype'
        ), nullable=False),
        sa.Column('title_ar', sa.String(), nullable=False),
        sa.Column('title_en', sa.String(), nullable=False),
        sa.Column('message_ar', sa.Text(), nullable=False),
        sa.Column('message_en', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('related_complaint_id', sa.Integer(), nullable=True),
        sa.Column('related_user_id', sa.Integer(), nullable=True),
        sa.Column('related_payment_id', sa.Integer(), nullable=True),
        sa.Column('action_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['related_complaint_id'], ['complaints.id']),
        sa.ForeignKeyConstraint(['related_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['related_payment_id'], ['payments.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_notifications_created_at'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_is_read'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
