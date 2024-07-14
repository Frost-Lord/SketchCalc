import cv2
import numpy as np
from tensorflow.keras.models import load_model
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import io

app = Flask(__name__)
CORS(app)

def safe_load_model(model_path):
    try:
        return load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        raise RuntimeError(f"Error loading model from {model_path}")

try:
    model = safe_load_model("model.keras")
except RuntimeError as e:
    print(e)
    raise

class_names = ['eight', 'five', 'four', 'nine', 'one', 'seven', 'six', 'three', 'two', 'zero']
img_height, img_width = 110, 110

def load_image(image_path, target_size=(110, 110)):
    try:
        image = cv2.imread(image_path)
        image = cv2.resize(image, target_size)
        return image
    except Exception as e:
        print(f"Error loading image: {e}")
        raise ValueError(f"Error processing image at {image_path}")

def predict_with_confidence(model, file, class_names, img_height, img_width):
    try:
        img = tf.keras.preprocessing.image.load_img(io.BytesIO(file.read()), target_size=(img_height, img_width))
        img_array = tf.expand_dims(tf.keras.preprocessing.image.img_to_array(img), 0)
        score = tf.nn.softmax(model.predict(img_array)[0])
        predicted_label = class_names[np.argmax(score)]
        confidence = 100 * np.max(score)
        return predicted_label, confidence
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise RuntimeError(f"Error predicting with model for file {file.filename}")

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        try:
            #file.save(file.filename)
            predicted_label, confidence = predict_with_confidence(model, file, class_names, img_height, img_width)
            return jsonify({"predicted_label": predicted_label, "confidence": f"{confidence:.2f}"}), 200
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type"}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
