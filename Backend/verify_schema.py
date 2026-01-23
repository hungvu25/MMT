# verify_schema.py
from fastapi.testclient import TestClient
from main import app
from db import db
from bson import ObjectId
import time

client = TestClient(app)

def test_flow():
    print("--- STARTING VERIFICATION ---")
    
    # Cleanup test users
    db.users.delete_many({"username": {"$in": ["verifyA", "verifyB"]}})
    
    # 1. Register
    print("\n[1/6] Registering verifyA and verifyB...")
    resA = client.post("/api/register", json={"username": "verifyA", "password": "password123"})
    assert resA.status_code == 200, f"Register A failed: {resA.text}"
    
    resB = client.post("/api/register", json={"username": "verifyB", "password": "password123"})
    assert resB.status_code == 200, f"Register B failed: {resB.text}"

    # 2. Login
    print("[2/6] Logging in...")
    loginA = client.post("/api/login", json={"username": "verifyA", "password": "password123"})
    tokenA = loginA.json()["access_token"]
    idA = loginA.json()["user_id"]
    
    loginB = client.post("/api/login", json={"username": "verifyB", "password": "password123"})
    tokenB = loginB.json()["access_token"]
    idB = loginB.json()["user_id"]
    print(f"   Logged in as {idA} and {idB}")

    # 3. WS Connection
    print("[3/6] Connecting WebSocket...")
    with client.websocket_connect("/ws") as wsA, client.websocket_connect("/ws") as wsB:
        # Auth
        wsA.send_json({"type": "auth", "data": {"token": tokenA}})
        authA = wsA.receive_json()
        assert authA["type"] == "auth_ok", "Auth A failed"
        
        wsB.send_json({"type": "auth", "data": {"token": tokenB}})
        authB = wsB.receive_json()
        assert authB["type"] == "auth_ok", "Auth B failed"
        
        # Consume presence updates if any
        # (Skip)

        # 4. Friend Request & Embedding Check
        print("\n[4/6] Testing Friend Request Embedding...")
        wsA.send_json({"type": "send_friend_request", "data": {"to_user_id": idB}})
        
        # Wait for checking DB
        time.sleep(0.5)
        
        # CHECK DB
        userB_doc = db.users.find_one({"_id": idB})
        reqs = userB_doc.get("friend_requests", [])
        print(f"   DB Check: User {idB} requests: {reqs}")
        
        found = False
        for r in reqs:
            if r["from_user"] == idA:
                found = True
                break
        
        if found:
            print("   ✅ SUCCESS: Friend Request is EMBEDDED in User document.")
        else:
            raise Exception("FAILED: Friend Request not found in User document.")
            
        # 5. Accept Friend & Friend List Check
        print("\n[5/6] Testing Friend List Embedding...")
        wsB.send_json({"type": "accept_friend_request", "data": {"from_user_id": idA}})
        time.sleep(0.5)
        
        # CHECK DB
        userA_doc = db.users.find_one({"_id": idA})
        friends = userA_doc.get("friends", [])
        print(f"   DB Check: User {idA} friends: {friends}")
        
        if idB in friends:
            print("   ✅ SUCCESS: Friend ID is EMBEDDED in User document friends list.")
        else:
            raise Exception("FAILED: Friend ID not found in User document.")

        # 6. Conversation & Message Embedding Check
        print("\n[6/6] Testing Message Embedding...")
        # Get conv
        wsA.send_json({"type": "get_direct_conversation", "data": {"other_user_id": idB}})
        while True:
            resp = wsA.receive_json()
            if resp["type"] == "direct_conversation":
                conv_id = resp["data"]["conversation"]["_id"]
                break
        
        wsA.send_json({
            "type": "send_message", 
            "data": {
                "conversation_id": conv_id, 
                "client_msg_id": "verify_msg_1",
                "text": "Checking Embedded Messages"
            }
        })
        time.sleep(0.5)
        
        # CHECK DB
        try:
            conv_oid = ObjectId(conv_id)
            conv_doc = db.conversations.find_one({"_id": conv_oid})
            msgs = conv_doc.get("messages", [])
            print(f"   DB Check: Conversation {conv_id} has {len(msgs)} messages.")
            
            if len(msgs) > 0 and msgs[-1]["text"] == "Checking Embedded Messages":
                print("   ✅ SUCCESS: Message is EMBEDDED in Conversation document.")
            else:
                raise Exception("FAILED: Message not found embedded in Conversation.")
        except Exception as e:
            raise Exception(f"DB Check Failed: {e}")

if __name__ == "__main__":
    try:
        test_flow()
        print("\n--- ALL CHECKS PASSED ---")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
