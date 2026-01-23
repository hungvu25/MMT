"""
Script to check friends data in database
"""
from db import db

users_collection = db['users']

# Check all users and their friends
users = users_collection.find({})

print("=" * 50)
print("USERS AND THEIR FRIENDS:")
print("=" * 50)

for user in users:
    user_id = user.get('_id')
    username = user.get('username', 'N/A')
    friends = user.get('friends', [])
    friend_requests = user.get('friend_requests', [])
    
    print(f"\nUser: {user_id} (username: {username})")
    print(f"  Friends: {friends}")
    print(f"  Friend Requests: {friend_requests}")
    
print("\n" + "=" * 50)
