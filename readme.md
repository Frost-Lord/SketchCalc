## Testing on Windows
```
# Create a new virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\activate
``

## Keras to tflite
```
python convert_to_tflite.py -i model.keras -o model.tflite
```