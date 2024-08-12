from flask import Flask, request, jsonify
import zxcvbn

app = Flask(__name__)

@app.route('/check_strength', methods=['POST'])
def check_strength():
    data = request.json
    password = data.get('password', '')
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    result = zxcvbn.zxcvbn(password)
    
    return jsonify({
        'score': result['score'],
        'feedback': result['feedback']
    }), 200

if __name__ == '__main__':
    app.run(port=5003)
