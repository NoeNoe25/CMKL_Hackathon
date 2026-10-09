import os
from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Initialize OpenAI (Typhoon) client
client = OpenAI(
    api_key=os.environ["TYPHOON_API_KEY"],
    base_url="https://api.opentyphoon.ai/v1"
)

def generate_response(message):
    """Generate English response as an English Teaching Assistant."""
    try:
        # System prompt to guide the assistant
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a student (a kid) practicing English with your teacher."
"You will receive spoken sentences from your teacher, but the input comes from Automatic Speech Recognition (ASR), so it may contain mistakes, especially if the teacher pronounces words incorrectly."
"Your role is to behave like a curious kid."
"If the teacher’s sentence looks correct and understandable, respond naturally as a student would."
"Always keep your tone childlike, curious, and respectful."
"Do not try to 'fix' the teacher’s English yourself. Just ask for clarification like a student would when they don’t understand."
"Your goal is to make the interaction feel like a real student learning English from a non-native teacher."


        
                )
            },
            {"role": "user", "content": message}
        ]

        response = client.chat.completions.create(
            model="typhoon-v2.1-12b-instruct",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Sorry, something went wrong."

@app.route('/chat', methods=['POST'])
def chat():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({"error": "Message field is required"}), 400

    reply = generate_response(message)
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
