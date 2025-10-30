from database import SessionLocal
from models import User, UserRole
from auth import get_password_hash

def create_admin_user():
    db = SessionLocal()
    
    try:
        admin_email = input("Enter admin email: ")
        
        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            print(f"User with email {admin_email} already exists!")
            return
        
        admin_password = input("Enter admin password: ")
        first_name = input("Enter first name: ")
        last_name = input("Enter last name: ")
        
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.HIGHER_COMMITTEE
        )
        
        db.add(admin_user)
        db.commit()
        
        print(f"\nHigher Committee user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Name: {first_name} {last_name}")
        print(f"Role: Higher Committee")
        print("\nYou can now login and create additional committee users through the admin panel.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Create Higher Committee Admin User ===\n")
    create_admin_user()
