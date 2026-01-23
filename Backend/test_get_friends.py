"""
Test get_friends function
"""
import sys
sys.path.append('.')

from models import FriendModel

# Test with the actual user ID from database
user_id = "vhung9955@gmail.com"

print(f"Testing get_friends for: {user_id}")
print("=" * 50)

friends = FriendModel.get_friends(user_id)

print("\nResult:")
print(f"Number of friends: {len(friends)}")
print(f"Friends data: {friends}")
