import requests
import base64
import json
import os

def test_aadhar_ocr_with_file(image_path):
    """Test Aadhar OCR with a local image file"""
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return
    
    print(f"🧪 Testing Aadhar OCR with file: {image_path}")
    print("=" * 60)
    
    try:
        # Read image file
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Call test endpoint
        response = requests.post(
            'http://localhost:5003/ocr/test-aadhar-base64',
            json={'image': image_base64},
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ OCR Processing Successful!")
            print(f"📝 Message: {result.get('message', 'N/A')}")
            print(f"🧪 Test Mode: {result.get('test_mode', False)}")
            print()
            
            # Print extracted data
            if result.get('success') and result.get('extracted_data'):
                print("📋 EXTRACTED DATA:")
                print("-" * 30)
                extracted = result['extracted_data']
                for key, value in extracted.items():
                    if value:
                        print(f"  {key.replace('_', ' ').title()}: {value}")
                    else:
                        print(f"  {key.replace('_', ' ').title()}: Not found")
                print()
            
            # Print validation results
            if result.get('validation'):
                print("🔍 VALIDATION RESULTS:")
                print("-" * 30)
                validation = result['validation']
                print(f"  Is Aadhar Card: {'✅ YES' if validation.get('is_aadhar_card') else '❌ NO'}")
                print(f"  Has Keywords: {'✅ YES' if validation.get('has_aadhar_keywords') else '❌ NO'}")
                print(f"  Has Aadhar Number: {'✅ YES' if validation.get('has_aadhar_number') else '❌ NO'}")
                print(f"  Has Name: {'✅ YES' if validation.get('has_name') else '❌ NO'}")
                print(f"  Has DOB: {'✅ YES' if validation.get('has_dob') else '❌ NO'}")
                print(f"  Has Gender: {'✅ YES' if validation.get('has_gender') else '❌ NO'}")
                print(f"  Validation Score: {validation.get('confidence_score', 0):.1f}%")
                print()
            
            # Print confidence scores
            if result.get('ocr_details'):
                print("📊 CONFIDENCE SCORES:")
                print("-" * 30)
                details = result['ocr_details']
                print(f"  API Confidence: {details.get('api_confidence', 0):.1f}%")
                print(f"  Field Extraction: {details.get('field_extraction_confidence', 0):.1f}%")
                print(f"  Validation: {details.get('validation_confidence', 0):.1f}%")
                print(f"  Overall Confidence: {result.get('confidence', 0):.1f}%")
                print()
            
            # Print raw text (first 200 characters)
            if result.get('raw_text'):
                print("📄 EXTRACTED TEXT (Preview):")
                print("-" * 30)
                raw_text = result['raw_text']
                preview = raw_text[:200] + "..." if len(raw_text) > 200 else raw_text
                print(f"  {preview}")
                print(f"  Total characters: {len(raw_text)}")
                print()
            
            # Overall result
            overall_confidence = result.get('confidence', 0)
            is_valid = result.get('validation', {}).get('is_aadhar_card', False)
            
            print("🎯 OVERALL RESULT:")
            print("-" * 30)
            if is_valid and overall_confidence > 70:
                print("  Status: ✅ VALID AADHAR CARD - HIGH CONFIDENCE")
            elif is_valid and overall_confidence > 40:
                print("  Status: ⚠️ VALID AADHAR CARD - MEDIUM CONFIDENCE")
            elif is_valid:
                print("  Status: ⚠️ VALID AADHAR CARD - LOW CONFIDENCE")
            else:
                print("  Status: ❌ NOT A VALID AADHAR CARD")
            
            print(f"  Confidence: {overall_confidence:.1f}%")
            
        else:
            print(f"❌ OCR Processing Failed!")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_with_sample_image():
    """Test with a sample image if available"""
    sample_paths = [
        'sample_aadhar.jpg',
        'test_image.jpg',
        'aadhar_card.png',
        'sample.png'
    ]
    
    for path in sample_paths:
        if os.path.exists(path):
            test_aadhar_ocr_with_file(path)
            return
    
    print("📝 No sample images found. Please provide an image file path.")
    print("   Usage: python test_verification.py <image_path>")
    print("   Example: python test_verification.py my_aadhar_card.jpg")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        test_aadhar_ocr_with_file(image_path)
    else:
        test_with_sample_image()
