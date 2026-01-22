"""
Script để tạo test users trong database
"""
from models import UserModel

# Tạo các test users
test_users = [
    {"user_id": "user_123", "username": "Alice"},
    {"user_id": "user_456", "username": "Bob"},
    {"user_id": "user_555", "username": "Charlie"},
    {"user_id": "user_789", "username": "Diana"},
    {"user_id": "user_999", "username": "Eve"},
]

print("Creating test users...")
for user_data in test_users:
    try:
        existing = UserModel.get_user(user_data["user_id"])
        if existing:
            print(f"✓ User {user_data['username']} ({user_data['user_id']}) already exists")
        else:
            UserModel.create_user(
                user_id=user_data["user_id"],
                username=user_data["username"]
            )
            print(f"✓ Created user {user_data['username']} ({user_data['user_id']})")
    except Exception as e:
        print(f"✗ Error creating {user_data['username']}: {e}")

print("\nDone! You can now search for these users in the app.")
