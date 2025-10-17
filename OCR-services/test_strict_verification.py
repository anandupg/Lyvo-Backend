import requests
import json

def test_strict_verification():
    """Test the strict KYC verification logic"""
    
    print("🔒 TESTING STRICT KYC VERIFICATION")
    print("=" * 50)
    
    # Test cases for strict verification
    test_cases = [
        {
            "name": "✅ Valid Aadhar + Name Match",
            "ocr_result": {
                "success": True,
                "confidence": 100,
                "validation": {"is_aadhar_card": True},
                "extracted_data": {"name": "ANANDU P GANESH"}
            },
            "user_name": "Anandu P Ganesh",
            "expected_status": "approved",
            "expected_reason": None
        },
        {
            "name": "❌ Valid Aadhar + Name Mismatch",
            "ocr_result": {
                "success": True,
                "confidence": 100,
                "validation": {"is_aadhar_card": True},
                "extracted_data": {"name": "JOHN DOE"}
            },
            "user_name": "Anandu P Ganesh",
            "expected_status": "rejected",
            "expected_reason": "Name mismatch: Document shows \"JOHN DOE\" but profile shows \"Anandu P Ganesh\""
        },
        {
            "name": "❌ Invalid Aadhar + Name Match",
            "ocr_result": {
                "success": True,
                "confidence": 100,
                "validation": {"is_aadhar_card": False},
                "extracted_data": {"name": "ANANDU P GANESH"}
            },
            "user_name": "Anandu P Ganesh",
            "expected_status": "rejected",
            "expected_reason": "Invalid Aadhar card detected"
        },
        {
            "name": "❌ Low Confidence + Valid Aadhar + Name Match",
            "ocr_result": {
                "success": True,
                "confidence": 50,
                "validation": {"is_aadhar_card": True},
                "extracted_data": {"name": "ANANDU P GANESH"}
            },
            "user_name": "Anandu P Ganesh",
            "expected_status": "rejected",
            "expected_reason": "Low confidence score: 50%"
        },
        {
            "name": "❌ OCR Processing Failed",
            "ocr_result": {
                "success": False,
                "error": "OCR processing failed"
            },
            "user_name": "Anandu P Ganesh",
            "expected_status": "rejected",
            "expected_reason": "OCR processing failed"
        }
    ]
    
    print("🧪 VERIFICATION LOGIC TESTS:")
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
                reason = None
            else:
                status = "rejected"
                if not is_valid_aadhar:
                    reason = "Invalid Aadhar card detected"
                elif not name_matches:
                    reason = f"Name mismatch: Document shows \"{extracted_name}\" but profile shows \"{user_name}\""
                elif confidence_score < 70:
                    reason = f"Low confidence score: {confidence_score}%"
                else:
                    reason = "Unknown verification failure"
        else:
            status = "rejected"
            reason = "OCR processing failed"
        
        # Check results
        status_match = status == test_case["expected_status"]
        reason_match = reason == test_case["expected_reason"]
        
        print(f"   📊 OCR Result: {ocr_result['success']}")
        if ocr_result["success"]:
            print(f"   📈 Confidence: {ocr_result.get('confidence', 0)}%")
            print(f"   🆔 Valid Aadhar: {ocr_result.get('validation', {}).get('is_aadhar_card', False)}")
            print(f"   👤 Extracted Name: {ocr_result.get('extracted_data', {}).get('name', 'N/A')}")
            print(f"   👤 User Name: {user_name}")
            print(f"   ✅ Name Match: {name_matches}")
        
        print(f"   🎯 Status: {status}")
        print(f"   📝 Reason: {reason}")
        
        if status_match and reason_match:
            print(f"   ✅ TEST PASSED")
        else:
            print(f"   ❌ TEST FAILED")
            if not status_match:
                print(f"      Expected status: {test_case['expected_status']}, Got: {status}")
            if not reason_match:
                print(f"      Expected reason: {test_case['expected_reason']}, Got: {reason}")
    
    print("\n" + "=" * 50)
    print("📋 STRICT VERIFICATION RULES:")
    print("-" * 40)
    print("✅ APPROVED only if ALL conditions met:")
    print("   • Confidence score >= 70%")
    print("   • Valid Aadhar card detected")
    print("   • Document name matches profile name")
    print()
    print("❌ REJECTED if ANY condition fails:")
    print("   • Invalid Aadhar card")
    print("   • Name mismatch")
    print("   • Low confidence score")
    print("   • OCR processing failed")
    print()
    print("🎯 EXPECTED BEHAVIOR:")
    print("-" * 30)
    print("• User uploads Aadhar card")
    print("• System checks: Valid Aadhar + Name match")
    print("• If both pass: ✅ APPROVED")
    print("• If either fails: ❌ REJECTED + Modal shown")
    print("• Modal shows specific failure reason")
    print("• User can retry with correct image")

if __name__ == "__main__":
    test_strict_verification()
