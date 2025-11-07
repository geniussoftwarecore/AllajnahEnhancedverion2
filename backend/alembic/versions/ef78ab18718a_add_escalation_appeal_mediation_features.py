"""add_escalation_appeal_mediation_features

Revision ID: ef78ab18718a
Revises: 31b06fb0b32e
Create Date: 2025-11-07 01:12:29.628064

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef78ab18718a'
down_revision: Union[str, Sequence[str], None] = '31b06fb0b32e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    op.execute("CREATE TYPE escalationtype AS ENUM ('MANUAL', 'SLA_VIOLATION', 'TRADER_APPEAL', 'MEDIATION')")
    op.execute("CREATE TYPE appealstatus AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')")
    op.execute("CREATE TYPE mediationstatus AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELLED')")
    op.execute("CREATE TYPE escalationstate AS ENUM ('NONE', 'TC_MANUAL', 'TRADER_APPEAL', 'MEDIATION')")
    
    op.execute("ALTER TYPE complaintstatus ADD VALUE IF NOT EXISTS 'MEDIATION_PENDING'")
    op.execute("ALTER TYPE complaintstatus ADD VALUE IF NOT EXISTS 'MEDIATION_IN_PROGRESS'")
    
    op.add_column('complaints', sa.Column('escalation_state', sa.Enum('NONE', 'TC_MANUAL', 'TRADER_APPEAL', 'MEDIATION', name='escalationstate'), nullable=False, server_default='NONE'))
    op.add_column('complaints', sa.Column('escalation_locked_until', sa.DateTime(), nullable=True))
    op.add_column('complaints', sa.Column('reopened_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('complaints', sa.Column('last_assigned_tc_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_complaints_last_assigned_tc_id', 'complaints', 'users', ['last_assigned_tc_id'], ['id'])
    
    op.add_column('complaint_approvals', sa.Column('stage', sa.String(), nullable=False, server_default='default'))
    op.add_column('complaint_approvals', sa.Column('required_approvals', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('complaint_approvals', sa.Column('is_multi_reviewer', sa.Boolean(), nullable=False, server_default='false'))
    
    op.create_table('complaint_escalations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('escalated_by_id', sa.Integer(), nullable=False),
        sa.Column('escalation_type', sa.Enum('MANUAL', 'SLA_VIOLATION', 'TRADER_APPEAL', 'MEDIATION', name='escalationtype'), nullable=False),
        sa.Column('target_role', sa.Enum('TRADER', 'TECHNICAL_COMMITTEE', 'HIGHER_COMMITTEE', name='userrole'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
        sa.ForeignKeyConstraint(['escalated_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_complaint_escalations_id'), 'complaint_escalations', ['id'], unique=False)
    
    op.create_table('complaint_appeals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('requester_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', name='appealstatus'), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.Column('decided_by_id', sa.Integer(), nullable=True),
        sa.Column('decision_rationale', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['decided_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_complaint_appeals_id'), 'complaint_appeals', ['id'], unique=False)
    
    op.create_table('complaint_mediation_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('requested_by_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELLED', name='mediationstatus'), nullable=True),
        sa.Column('mediator_id', sa.Integer(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['mediator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_complaint_mediation_requests_id'), 'complaint_mediation_requests', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    
    op.drop_index(op.f('ix_complaint_mediation_requests_id'), table_name='complaint_mediation_requests')
    op.drop_table('complaint_mediation_requests')
    
    op.drop_index(op.f('ix_complaint_appeals_id'), table_name='complaint_appeals')
    op.drop_table('complaint_appeals')
    
    op.drop_index(op.f('ix_complaint_escalations_id'), table_name='complaint_escalations')
    op.drop_table('complaint_escalations')
    
    op.drop_column('complaint_approvals', 'is_multi_reviewer')
    op.drop_column('complaint_approvals', 'required_approvals')
    op.drop_column('complaint_approvals', 'stage')
    
    op.drop_constraint('fk_complaints_last_assigned_tc_id', 'complaints', type_='foreignkey')
    op.drop_column('complaints', 'last_assigned_tc_id')
    op.drop_column('complaints', 'reopened_count')
    op.drop_column('complaints', 'escalation_locked_until')
    op.drop_column('complaints', 'escalation_state')
    
    op.execute("DROP TYPE escalationstate")
    op.execute("DROP TYPE mediationstatus")
    op.execute("DROP TYPE appealstatus")
    op.execute("DROP TYPE escalationtype")
