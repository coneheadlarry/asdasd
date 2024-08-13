from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def caesar_cipher(text, shift):
    encrypted_text = []
    for char in text:
        encrypted_char = chr((ord(char) + shift) % 128)
        encrypted_text.append(encrypted_char)
    return ''.join(encrypted_text)


@app.route('/encrypt_message', methods=['POST'])
def encrypt_message():
    data = request.json
    app.logger.debug(f"Received data: {data}")
    if not data or 'message' not in data or 'shift' not in data:
        return jsonify({'error': 'Invalid input. Please provide a valid string message and shift value.'}), 400

    message = data['message']
    shift_number = data['shift']
    if not isinstance(message, str):
        return jsonify({'error': 'Input message must be a string.'}), 400
    if not isinstance(shift_number, int):
        return jsonify({'error': 'Shift value must be an integer.'}), 400

    encrypted_message = caesar_cipher(message, shift_number)
    return jsonify({'encrypted_message': encrypted_message})


if __name__ == '__main__':
    app.run(port=5001)
