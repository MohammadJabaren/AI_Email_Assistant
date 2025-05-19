from flask import Flask, request, jsonify
from flask_cors import CORS
from email_service import EmailService, EmailTone
import asyncio

app = Flask(__name__)
CORS(app)

email_service = EmailService()

@app.route('/generate-email', methods=['POST'])
def generate_email():
    try:
        data = request.json
        action = data.get('action')
        text = data.get('text')
        tone = EmailTone(data.get('tone', 'professional'))
        language = data.get('language', 'en')
        previous_email = data.get('previousEmail')

        if not action or not text:
            return jsonify({'error': 'Action and text are required'}), 400

        # Run the async function
        result = asyncio.run(email_service.handle_email_action(
            action=action,
            text=text,
            tone=tone,
            language=language,
            previous_email=previous_email
        ))

        return jsonify({'result': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 