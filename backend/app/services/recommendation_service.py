from app.models.tour import Tour
from app.models.order import Order
from app.extensions import db

def get_popular_tours(limit=3):
    return (
        db.session.query(Tour)
        .join(Order, Order.tour_id == Tour.id)
        .filter(Tour.status == 'approved')
        .group_by(Tour.id)
        .order_by(db.func.count(Order.id).desc())
        .limit(limit)
        .all()
    )