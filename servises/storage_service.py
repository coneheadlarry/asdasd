from flask import Flask, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# File path to store the passwords
PASSWORD_FILE = 'passwords.json'

# Initialize the JSON file if it doesn't exist
if not os.path.exists(PASSWORD_FILE):
    with open(PASSWORD_FILE, 'w') as f:
        json.dump([], f)

# Helper function to load passwords
def load_passwords():
    with open(PASSWORD_FILE, 'r') as f:
        return json.load(f)

# Helper function to save passwords
def save_passwords(passwords):
    with open(PASSWORD_FILE, 'w') as f:
        json.dump(passwords, f, indent=4)

@app.route('/save_password', methods=['POST'])
def save_password():
    data = request.json
    service_name = data.get('service_name')
    new_password = data.get('password')

    if not service_name or not new_password:
        return jsonify({'error': 'Service name and password are required'}), 400

    passwords = load_passwords()

    # Check if the service name already exists
    for password_entry in passwords:
        if password_entry['service_name'] == service_name:
            # Update the existing password
            password_entry['password'] = new_password
            password_entry['last_updated_at'] = datetime.now().strftime("%Y-%m-%d")
            save_passwords(passwords)
            return jsonify({'message': 'Password updated successfully'}), 200

    # If service name doesn't exist, add a new entry
    data['created_at'] = datetime.now().strftime("%Y-%m-%d")
    data['last_updated_at'] = data['created_at']  # Set last_updated_at to the creation date initially
    passwords.append(data)
    save_passwords(passwords)
    return jsonify({'message': 'Password saved successfully'}), 201

@app.route('/get_passwords', methods=['GET'])
def get_passwords():
    passwords = load_passwords()
    return jsonify(passwords), 200

@app.route('/update_password', methods=['PUT'])
def update_password():
    data = request.json
    passwords = load_passwords()
    for password in passwords:
        if password['service_name'] == data['service_name']:
            password['password'] = data['password']
            password['last_updated_at'] = datetime.now().strftime("%Y-%m-%d")
            save_passwords(passwords)
            return jsonify({'message': 'Password updated successfully'}), 200
    return jsonify({'error': 'Service not found'}), 404

@app.route('/delete_password', methods=['DELETE'])
def delete_password():
    service_name = request.args.get('service_name')
    passwords = load_passwords()
    passwords = [pw for pw in passwords if pw['service_name'] != service_name]
    save_passwords(passwords)
    return jsonify({'message': 'Password deleted successfully'}), 200

if __name__ == '__main__':
    app.run(port=5002)
