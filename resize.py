import os
from PIL import Image
import logging
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

input_dir = './dataset'
output_dir = './resized_images'
max_threads = 10

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def resize_image(img_path, output_path, index, total_images):
    try:
        with Image.open(img_path) as img:
            img = img.resize((110, 110), Image.LANCZOS)
            img.save(output_path)
        os.remove(img_path)
        logging.info(f"Image {index + 1} out of {total_images} resized and original deleted.")
    except Exception as e:
        logging.error(f"Failed to process image {img_path}. Error: {e}")

def process_subdir(subdir):
    subdir_path = os.path.join(input_dir, subdir)
    output_subdir = os.path.join(output_dir, subdir)

    if not os.path.exists(output_subdir):
        os.makedirs(output_subdir)

    image_files = [f for f in os.listdir(subdir_path) if f.endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
    total_images = len(image_files)

    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        for index, filename in enumerate(image_files):
            img_path = os.path.join(subdir_path, filename)
            output_path = os.path.join(output_subdir, filename)
            executor.submit(resize_image, img_path, output_path, index, total_images)

    logging.info(f"All images in {subdir} have been resized to 110x110 pixels.")

subdirs = [d for d in os.listdir(input_dir) if os.path.isdir(os.path.join(input_dir, d))]

for subdir in subdirs:
    process_subdir(subdir)
