"""bo sung bang tour_guides

Revision ID: fe3758b62520
Revises: 4e981624a82b
Create Date: 2026-01-26 23:45:58.208392

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fe3758b62520'
down_revision = '4e981624a82b'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Tạo bảng tour_guides với ĐẦY ĐỦ các cột để không bị lỗi UndefinedColumn
    op.create_table('tour_guides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('license_number', sa.String(length=50), nullable=True), # Thêm cột này
        sa.Column('years_of_experience', sa.Integer(), nullable=True),    # Thêm cột này
        sa.Column('languages', sa.String(length=200), nullable=True),     # Thêm cột này
        sa.Column('specialties', sa.Text(), nullable=True),               # Thêm cột này
        sa.Column('status', sa.Enum('AVAILABLE', 'BUSY', 'ON_LEAVE', name='guidestatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Tạo bảng assignments (Vì bạn đã DROP trên Supabase nên phải tạo lại ở đây)
    op.create_table('tour_guide_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tour_id', sa.Integer(), nullable=False),
        sa.Column('guide_id', sa.Integer(), nullable=False),
        sa.Column('assigned_date', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['guide_id'], ['tour_guides.id'], ),
        sa.ForeignKeyConstraint(['tour_id'], ['tours.id'], ),
        sa.PrimaryKeyConstraint('id')
    )