import requests
import json

def test_mobile_extraction():
    """Test mobile number extraction specifically"""
    
    print("📱 TESTING MOBILE EXTRACTION")
    print("=" * 40)
    
    test_cases = [
        "Mobile No: 7306080450",
        "Mobile: 7306080450", 
        "Phone: 7306080450",
        "Contact: 7306080450",
        "7306080450",
        "Mobile No: 9876543210"
    ]
    
    for i, test_text in enumerate(test_cases, 1):
        print(f"\nTest {i}: '{test_text}'")
        
        try:
            response = requests.post(
                'http://localhost:5003/ocr/debug-text',
                json={'text': test_text},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                extracted = result.get('extracted_data', {})
                validation = result.get('validation', {})
                
                mobile = extracted.get('mobile', 'Not found')
                has_mobile = validation.get('has_mobile', False)
                
                print(f"   📱 Extracted Mobile: {mobile}")
                print(f"   ✅ Has Mobile: {has_mobile}")
                
                if mobile != 'Not found' and has_mobile:
                    print("   ✅ SUCCESS")
                else:
                    print("   ❌ FAILED")
            else:
                print(f"   ❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

if __name__ == "__main__":
    test_mobile_extraction()
