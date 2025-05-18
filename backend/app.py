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
        emit("user_list", list(users), broadcast=True)
        emit("message", {
            "name": "Server",
            "text": f"{username} joined the chat",
            "time": timestamp(),
        }, broadcast=True)
        emit("history", messages)

@socketio.on("disconnect")
def on_disconnect():

    users.clear()
    typing_users.clear()
    emit("user_list", list(users), broadcast=True)

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
        typing_users.clear()
    emit("typing", list(typing_users), broadcast=True)

def save_messages():
    with open(MESSAGE_HISTORY_FILE, "w") as f:
        json.dump(messages[-100:], f)

def timestamp():
    return datetime.now().strftime("%H:%M:%S")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=True)
