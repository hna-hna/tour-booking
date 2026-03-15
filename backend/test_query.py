from app import create_app
from app.extensions import db
from app.models.order import Order, Payment
from app.models.tour import Tour

app = create_app()

with app.app_context():
    order_id = 15
    current_user_id = 4 # Or whatever user id it is
    try:
        result = db.session.query(Order, Tour, Payment)\
            .join(Tour, Order.tour_id == Tour.id)\
            .outerjoin(Payment, Order.id == Payment.order_id)\
            .filter(Order.id == order_id)\
            .first()
            
        print("QUERY SUCCESS:")
        if result:
            o, t, p = result
            print(f"Order: {o.id}, Tour: {t.name}, Payment: {p}")
            print({"total_price": o.total_price, "price_per_person": t.price})
        else:
            print("Order not found")
    except Exception as e:
        print("QUERY FAILED:", str(e))
