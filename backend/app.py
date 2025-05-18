from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

users = set()
typing_users = set()
sid_to_username = {}  # Maps socket session id to username
messages = []
MESSAGE_HISTORY_FILE = "messages.json"

if os.path.exists(MESSAGE_HISTORY_FILE):
    with open(MESSAGE_HISTORY_FILE, "r") as f:
        messages = json.load(f)

@socketio.on("join")
def on_join(data):
    username = data.get("username")
    if username:
        users.add(username)
        sid_to_username[request.sid] = username
        emit("user_list", list(users), broadcast=True)
        emit("message", {
            "name": "Server",
            "text": f"{username} joined the chat",
            "time": timestamp(),
        }, broadcast=True)
        # Send history only to the newly joined client
        emit("history", messages, to=request.sid)

@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    username = sid_to_username.get(sid)
    if username:
        users.discard(username)
        typing_users.discard(username)
        del sid_to_username[sid]
        emit("user_list", list(users), broadcast=True)
        emit("message", {
            "name": "Server",
            "text": f"{username} left the chat",
            "time": timestamp(),
        }, broadcast=True)

@socketio.on("message")
def handle_message(data):
    name = data.get("name", "Anonymous")
    text = data.get("text", "")
    msg = {"name": name, "text": text, "time": timestamp()}
    messages.append(msg)
    save_messages()
    emit("message", msg, broadcast=True)

@socketio.on("typing")
def handle_typing(name):
    if name:
        typing_users.add(name)
    else:
        # If name is empty, remove user from typing_users if possible
        # But since we don't know who stopped, just ignore here
        pass
    emit("typing", list(typing_users), broadcast=True)

@socketio.on("stop_typing")
def handle_stop_typing(name):
    if name and name in typing_users:
        typing_users.discard(name)
        emit("typing", list(typing_users), broadcast=True)

def save_messages():
    with open(MESSAGE_HISTORY_FILE, "w") as f:
        json.dump(messages[-100:], f)

def timestamp():
    return datetime.now().strftime("%H:%M:%S")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=True)
