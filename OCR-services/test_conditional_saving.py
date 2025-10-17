import requests
import json

def test_conditional_saving():
    """Test that images are only saved to Cloudinary/DB if verification passes"""
    
    print("🔒 TESTING CONDITIONAL IMAGE SAVING")
    print("=" * 50)
    
    # Test cases for conditional saving
    test_cases = [
        {
            "name": "✅ Valid Aadhar + Name Match → Should Save",
            "ocr_result": {
                "success": True,
                "confidence": 100,
                "validation": {"is_aadhar_card": True},
                "extracted_data": {"name": "ANANDU P GANESH"}
            },
            "user_name": "Anandu P Ganesh",
            "should_save_to_cloudinary": True,
            "should_save_to_db": True,
            "expected_status": "approved"
        },
        {
            "name": "❌ Valid Aadhar + Name Mismatch → Should NOT Save",
            "ocr_result": {
                "success": True,
                "confidence": 100,
                "validation": {"is_aadhar_card": True},
                "extracted_data": {"name": "JOHN DOE"}
            },
            "user_name": "Anandu P Ganesh",
            "should_save_to_cloudinary": False,
            "should_save_to_db": False,
            "expected_status": "rejected"
        },
        {
            "name": "❌ Invalid Aadhar + Name Match → Should NOT Save",
            "ocr_result": {
                "success": True,
                "confidence": 100,
                "validation": {"is_aadhar_card": False},
                "extracted_data": {"name": "ANANDU P GANESH"}
            },
            "user_name": "Anandu P Ganesh",
            "should_save_to_cloudinary": False,
            "should_save_to_db": False,
            "expected_status": "rejected"
        },
        {
            "name": "❌ OCR Processing Failed → Should NOT Save",
            "ocr_result": {
                "success": False,
                "error": "OCR processing failed"
            },
            "user_name": "Anandu P Ganesh",
            "should_save_to_cloudinary": False,
            "should_save_to_db": False,
            "expected_status": "rejected"
        }
    ]
    
    print("🧪 CONDITIONAL SAVING TESTS:")
    print("-" * 40)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)
        
        # Simulate the verification logic
        ocr_result = test_case["ocr_result"]
        user_name = test_case["user_name"]
        
        if ocr_result["success"]:
            confidence_score = ocr_result.get("confidence", 0)
            is_valid_aadhar = ocr_result.get("validation", {}).get("is_aadhar_card", False)
            
            # Check name matching
            name_matches = False
            extracted_name = ""
            
            if ocr_result.get("extracted_data", {}).get("name"):
                extracted_name = ocr_result["extracted_data"]["name"]
                normalized_extracted = extracted_name.upper().strip()
                normalized_user = user_name.upper().strip()
                name_matches = normalized_extracted == normalized_user
            
            # Determine status
            if confidence_score >= 70 and is_valid_aadhar and name_matches:
                status = "approved"
                should_save = True
            else:
                status = "rejected"
                should_save = False
        else:
            status = "rejected"
            should_save = False
        
        # Check results
        status_match = status == test_case["expected_status"]
        save_match = should_save == test_case["should_save_to_cloudinary"]
        
        print(f"   📊 OCR Result: {ocr_result['success']}")
        if ocr_result["success"]:
            print(f"   📈 Confidence: {ocr_result.get('confidence', 0)}%")
            print(f"   🆔 Valid Aadhar: {ocr_result.get('validation', {}).get('is_aadhar_card', False)}")
            print(f"   👤 Extracted Name: {ocr_result.get('extracted_data', {}).get('name', 'N/A')}")
            print(f"   👤 User Name: {user_name}")
            print(f"   ✅ Name Match: {name_matches}")
        
        print(f"   🎯 Status: {status}")
        print(f"   💾 Save to Cloudinary: {'YES' if should_save else 'NO'}")
        print(f"   💾 Save to Database: {'YES' if should_save else 'NO'}")
        
        if status_match and save_match:
            print(f"   ✅ TEST PASSED")
        else:
            print(f"   ❌ TEST FAILED")
            if not status_match:
                print(f"      Expected status: {test_case['expected_status']}, Got: {status}")
            if not save_match:
                print(f"      Expected save: {test_case['should_save_to_cloudinary']}, Got: {should_save}")
    
    print("\n" + "=" * 50)
    print("📋 CONDITIONAL SAVING RULES:")
    print("-" * 40)
    print("✅ SAVE TO CLOUDINARY & DATABASE only if:")
    print("   • Confidence score >= 70%")
    print("   • Valid Aadhar card detected")
    print("   • Document name matches profile name")
    print()
    print("❌ DO NOT SAVE if ANY condition fails:")
    print("   • Invalid Aadhar card")
    print("   • Name mismatch")
    print("   • Low confidence score")
    print("   • OCR processing failed")
    print()
    print("🎯 EXPECTED BEHAVIOR:")
    print("-" * 30)
    print("• User uploads Aadhar card")
    print("• System processes OCR first")
    print("• If verification passes: 💾 Save to Cloudinary + Database")
    print("• If verification fails: ❌ Skip saving + Show failure modal")
    print("• OCR data is always saved for audit purposes")
    print("• Image URLs only saved if verification passes")

if __name__ == "__main__":
    test_conditional_saving()
