import sys
import json
import base64
import io
from PIL import Image
import numpy as np

def model_prediction(image_data):
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Resize image to 128x128
        image = image.resize((128, 128))
        image = image.convert('RGB')
        
        # Convert to array and normalize
        input_arr = np.array(image)
        input_arr = np.array([input_arr]) / 255.0
        
        # Simulate prediction (since we don't have the actual model)
        # In real implementation, load the model and predict
        # model = tf.keras.models.load_model("trained_plant_disease_model.keras")
        # predictions = model.predict(input_arr)
        # result_index = np.argmax(predictions)
        
        # For demo, return a random prediction based on image characteristics
        result_index = hash(str(input_arr.mean())) % 38
        
        class_names = [
            'Apple__Apple_scab', 'Apple__Black_rot', 'Apple__Cedar_apple_rust', 'Apple__healthy',
            'Blueberry__healthy', 'Cherry__Powdery_mildew', 'Cherry__healthy', 
            'Corn__Cercospora_leaf_spot', 'Corn__Common_rust', 'Corn__Northern_Leaf_Blight', 
            'Corn__healthy', 'Grape__Black_rot', 'Grape__Esca', 'Grape__Leaf_blight', 
            'Grape__healthy', 'Orange__Huanglongbing', 'Peach__Bacterial_spot', 'Peach__healthy', 
            'Pepper__Bacterial_spot', 'Pepper__healthy', 'Potato__Early_blight', 'Potato__Late_blight', 
            'Potato__healthy', 'Raspberry__healthy', 'Soybean__healthy', 'Squash__Powdery_mildew', 
            'Strawberry__Leaf_scorch', 'Strawberry__healthy', 'Tomato__Bacterial_spot', 
            'Tomato__Early_blight', 'Tomato__Late_blight', 'Tomato__Leaf_Mold', 
            'Tomato__Septoria_leaf_spot', 'Tomato__Spider_mites', 'Tomato__Target_Spot', 
            'Tomato__Yellow_Leaf_Curl_Virus', 'Tomato__Mosaic_virus', 'Tomato__healthy'
        ]
        
        predicted_class = class_names[result_index]
        plant_name = predicted_class.split('__')[0]
        disease_name = predicted_class.split('__')[1].replace('_', ' ')
        
        # Disease information mapping
        disease_info = {
            'Apple scab': {
                'description': 'Fungal disease causing olive-green velvety spots on leaves and fruits',
                'prevention': 'Use resistant varieties, ensure good air circulation, apply fungicide sprays',
                'treatment': 'Apply Captan or Mancozeb fungicide, prune infected areas'
            },
            'Black rot': {
                'description': 'Fungal disease causing black circular lesions on fruits and leaves',
                'prevention': 'Remove infected plant debris, ensure proper spacing, avoid overhead watering',
                'treatment': 'Apply copper-based fungicides, remove infected fruits immediately'
            },
            'Late blight': {
                'description': 'Devastating fungal disease causing water-soaked spots and plant death',
                'prevention': 'Use resistant varieties, avoid overhead irrigation, ensure good drainage',
                'treatment': 'Apply Metalaxyl or copper-based fungicides, destroy infected plants'
            },
            'Early blight': {
                'description': 'Fungal disease causing brown concentric rings on older leaves',
                'prevention': 'Rotate crops, avoid overhead watering, maintain plant spacing',
                'treatment': 'Apply Chlorothalonil or Mancozeb fungicide sprays'
            },
            'Powdery mildew': {
                'description': 'Fungal disease causing white powdery coating on leaves',
                'prevention': 'Ensure good air circulation, avoid overhead watering, plant in sunny locations',
                'treatment': 'Apply sulfur-based fungicides or neem oil'
            }
        }
        
        # Get disease info or default
        info = disease_info.get(disease_name, {
            'description': f'{disease_name} affecting {plant_name}',
            'prevention': 'Maintain good plant hygiene, use resistant varieties, ensure proper spacing',
            'treatment': 'Consult agricultural extension services for specific treatment recommendations'
        })
        
        confidence = 85 + (result_index % 15)  # Simulate confidence 85-99%
        
        result = {
            'success': True,
            'plant': plant_name,
            'disease': disease_name,
            'confidence': confidence,
            'description': info['description'],
            'prevention': info['prevention'],
            'treatment': info['treatment'],
            'severity': 'High' if 'blight' in disease_name.lower() else 'Medium'
        }
        
        return result
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Disease detection failed: {str(e)}'
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_data = sys.argv[1]
        result = model_prediction(image_data)
        print(json.dumps(result))
    else:
        print(json.dumps({'success': False, 'error': 'No image data provided'}))