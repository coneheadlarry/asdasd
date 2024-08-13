from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)


def get_password_reminders(file_path):
    if not os.path.exists(file_path):
        return []

    with open(file_path, 'r') as file:
        passwords = json.load(file)

    reminders = []
    for password in passwords:
        last_updated = datetime.strptime(
            password.get('last_updated_at', ''), '%Y-%m-%d')
        if datetime.now() - last_updated >= timedelta(days=120):  # 4 months
            reminders.append({
                'service_name': password['service_name'],
                'last_updated_at': password['last_updated_at'],
                'reminder_needed': True
            })

    return reminders


@app.route('/get_reminders', methods=['POST'])
def get_reminders():
    data = request.json
    file_path = data.get('file_path')

    if not file_path or not os.path.exists(file_path):
        return jsonify({'error': 'Invalid file path or file does not exist'}), 400

    reminders = get_password_reminders(file_path)
    return jsonify(reminders), 200


if __name__ == '__main__':
    app.run(port=5004)
