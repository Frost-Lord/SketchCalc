import argparse
import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import tensorflow as tf

def load_image(image_path, target_size=(110, 110)):
    image = cv2.imread(image_path)
    image = cv2.resize(image, target_size)
    return image

def predict_with_confidence(model, image_path, class_names, img_height, img_width):
    scores = list()
    rates = list()
    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(img_height, img_width))
    img_array = tf.expand_dims(tf.keras.preprocessing.image.img_to_array(img), 0)
    score = tf.nn.softmax(model.predict(img_array)[0])
    print("This image most likely belongs to {} with a {:.2f} percent confidence.".format(
        class_names[np.argmax(score)], 100 * np.max(score)))
    scores.append(class_names[np.argmax(score)])
    rates.append(100 * np.max(score))
    return scores, rates

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Predict labels for images in a directory or a single image.')
    parser.add_argument('-i', '--input', required=True, help='Directory containing images for prediction or a single image file')
    args = parser.parse_args()
    
    model = load_model("model.keras")
    class_names = ['eight', 'five', 'four', 'nine', 'one', 'seven', 'six', 'three', 'two', 'zero']
    img_height, img_width = 110, 110

    if os.path.isdir(args.input):
        image_paths = [os.path.join(args.input, filename) for filename in os.listdir(args.input) if filename.lower().endswith(('.jpg', '.jpeg', '.png'))]
    elif os.path.isfile(args.input) and args.input.lower().endswith(('.jpg', '.jpeg', '.png')):
        image_paths = [args.input]
    else:
        raise ValueError(f"Invalid input: {args.input}. Must be a directory containing images or a single image file.")
    
    if not image_paths:
        raise ValueError(f"No valid image files found in the provided input: {args.input}")
    
    print("Predictions:")
    for image_path in image_paths:
        scores, rates = predict_with_confidence(model, image_path, class_names, img_height, img_width)
        for score, rate in zip(scores, rates):
            print(f"Image: {image_path} - Predicted Label: {score} with {rate:.2f}% confidence")