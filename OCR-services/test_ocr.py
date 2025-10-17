import requests
import base64
import json

# OCR Service Test Script
def test_ocr_service():
    """Test the OCR service endpoints"""
    
    base_url = "http://localhost:5003"
    
    print("🧪 Testing OCR Service with OCR.space API...")
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
    
    # Test 2: Test with sample image (if available)
    print("\n2. Testing Aadhar Card Processing...")
    
    # Create a sample base64 image (1x1 pixel PNG for testing)
    sample_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    try:
        response = requests.post(
            f"{base_url}/ocr/aadhar/base64",
            json={"image": sample_image_base64},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Aadhar processing endpoint accessible")
            print(f"   Success: {result.get('success', False)}")
            if not result.get('success'):
                print(f"   Error: {result.get('error', 'Unknown error')}")
        else:
            print(f"❌ Aadhar processing failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Aadhar processing error: {str(e)}")
    
    # Test 3: Test text extraction
    print("\n3. Testing Text Extraction...")
    try:
        response = requests.post(
            f"{base_url}/ocr/extract-text",
            files={"image": ("test.png", base64.b64decode(sample_image_base64), "image/png")},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Text extraction endpoint accessible")
            print(f"   Success: {result.get('success', False)}")
        else:
            print(f"❌ Text extraction failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Text extraction error: {str(e)}")
    
    print("\n🎯 OCR Service Test Complete!")
    print("\nTo test with real Aadhar card images:")
    print("1. Start the OCR service: python app.py")
    print("2. Use the following curl command:")
    print("   curl -X POST -F 'image=@your_aadhar_card.jpg' http://localhost:5003/ocr/aadhar")
    print("3. Or use Postman to test the endpoints")
    print("\n📝 Note: This service now uses OCR.space API instead of Tesseract")
    print("   Make sure your OCR_SPACE_API_KEY is configured in .env file")

if __name__ == "__main__":
    test_ocr_service()
