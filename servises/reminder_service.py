from flask import Flask, jsonify
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)

# File path to store the passwords
PASSWORD_FILE = 'passwords.json'

# Helper function to load passwords


def load_passwords():
    with open(PASSWORD_FILE, 'r') as f:
        return json.load(f)


@app.route('/check_reminders', methods=['GET'])
def check_reminders():
    passwords = load_passwords()
    reminders = []
    for password in passwords:
        created_at = datetime.strptime(password['created_at'], "%Y-%m-%d")
        age = datetime.now() - created_at
        if age >= timedelta(days=120) and age < timedelta(days=150):
            reminders.append(
                f"Password for {password['service_name']} is approaching 4 months old.")
        elif age >= timedelta(days=150):
            reminders.append(
                f"Password for {password['service_name']} has exceeded 4 months.")
    return jsonify(reminders), 200


if __name__ == '__main__':
    app.run(port=5004)
