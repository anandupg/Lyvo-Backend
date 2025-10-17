import requests
import json
import time

def test_ocr_timeout_fixes():
    """Test the OCR service timeout fixes"""
    
    print("🔧 TESTING OCR TIMEOUT FIXES")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get('http://localhost:5003/health', timeout=10)
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print(f"❌ Health check: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Health check: ERROR - {str(e)}")
    
    print()
    
    # Test 2: Debug text processing (no OCR.space API)
    print("📝 Testing debug text processing...")
    test_text = """भारत सरकार
आधार
ANANDU P GANESH
DOB: 27/10/2002
Gender: MALE
Mobile No: 7306080450
Aadhar Number: 3621 8443 8575"""
    
    try:
        response = requests.post(
            'http://localhost:5003/ocr/debug-text',
            json={'text': test_text},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Debug text processing: PASSED")
            print(f"   Success: {result.get('success', False)}")
            print(f"   Confidence: {result.get('confidence', 0):.1f}%")
            print(f"   Valid Aadhar: {result.get('validation', {}).get('is_aadhar_card', False)}")
            print(f"   Aadhar Number: {result.get('extracted_data', {}).get('aadhar_number', 'Not found')}")
            print(f"   Name: {result.get('extracted_data', {}).get('name', 'Not found')}")
        else:
            print(f"❌ Debug text processing: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Debug text processing: ERROR - {str(e)}")
    
    print()
    
    # Test 3: Test OCR.space API with timeout handling
    print("⏱️ Testing OCR.space API timeout handling...")
    print("   This will test the retry logic and fallback response")
    
    # Create a small test image (1x1 pixel PNG)
    import base64
    test_image_data = base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    )
    
    try:
        start_time = time.time()
        response = requests.post(
            'http://localhost:5003/ocr/test-aadhar-base64',
            json={'image': base64.b64encode(test_image_data).decode('utf-8')},
            headers={'Content-Type': 'application/json'},
            timeout=60  # Give it time to retry
        )
        end_time = time.time()
        
        print(f"   Response time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ OCR API test: COMPLETED")
            print(f"   Success: {result.get('success', False)}")
            print(f"   Fallback Mode: {result.get('fallback_mode', False)}")
            print(f"   Error: {result.get('error', 'None')}")
            print(f"   Suggestion: {result.get('suggestion', 'None')}")
        else:
            print(f"❌ OCR API test: FAILED ({response.status_code})")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ OCR API test: ERROR - {str(e)}")
    
    print()
    
    # Test 4: Summary of improvements
    print("💡 IMPROVEMENTS IMPLEMENTED:")
    print("-" * 40)
    print("1. ✅ Retry Logic: 2 attempts with 3-second delay")
    print("2. ✅ Reduced Timeout: 15 seconds per attempt")
    print("3. ✅ Optimized Settings: Faster OCR engine")
    print("4. ✅ Fallback Response: When all retries fail")
    print("5. ✅ Better Error Messages: Clear user guidance")
    print("6. ✅ Debug Endpoint: No OCR.space API dependency")
    print()
    
    print("🚀 EXPECTED BEHAVIOR:")
    print("-" * 40)
    print("• First attempt: 15 seconds timeout")
    print("• If timeout: Wait 3 seconds, retry")
    print("• Second attempt: 15 seconds timeout")
    print("• If still fails: Return fallback response")
    print("• Total max time: ~33 seconds")
    print("• User gets: Clear error message + suggestions")
    print()
    
    print("🎯 RECOMMENDATIONS:")
    print("-" * 40)
    print("1. Use debug-text endpoint for testing")
    print("2. Use smaller images (< 1MB) for better success")
    print("3. Implement image compression in frontend")
    print("4. Consider alternative OCR services for production")
    print("5. Add manual verification option for failed cases")

if __name__ == "__main__":
    test_ocr_timeout_fixes()
