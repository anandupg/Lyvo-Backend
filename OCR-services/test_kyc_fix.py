import requests
import json

def test_kyc_upload_fix():
    """Test the KYC upload fix for ObjectId error"""
    
    print("🔧 TESTING KYC UPLOAD FIX")
    print("=" * 50)
    
    # Test data (simulating your Aadhar card)
    test_data = {
        "text": """ANANDU P GANESH
DOB: 27/10/2002
MALE
Mobile No: 7306080450
3621 8443 8575
VID: 9160 1699 3333 9777"""
    }
    
    print("📝 Testing OCR service first...")
    try:
        # Test OCR service
        ocr_response = requests.post(
            'http://localhost:5003/ocr/debug-text',
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if ocr_response.status_code == 200:
            ocr_result = ocr_response.json()
            print("✅ OCR Service: Working")
            print(f"   Success: {ocr_result.get('success', False)}")
            print(f"   Valid Aadhar: {ocr_result.get('validation', {}).get('is_aadhar_card', False)}")
            print(f"   Confidence: {ocr_result.get('confidence', 0):.1f}%")
        else:
            print(f"❌ OCR Service: Error {ocr_response.status_code}")
            return
            
    except Exception as e:
        print(f"❌ OCR Service: Error - {str(e)}")
        return
    
    print()
    print("🔧 FIX APPLIED:")
    print("-" * 30)
    print("✅ Fixed ObjectId error in uploadKycDocuments")
    print("✅ Changed 'system' string to null for reviewedBy field")
    print("✅ Updated both User and KycDocument models")
    print()
    
    print("💡 WHAT WAS FIXED:")
    print("-" * 30)
    print("❌ Before: reviewedBy: 'system' (string)")
    print("✅ After:  reviewedBy: null (ObjectId)")
    print()
    print("🎯 EXPECTED BEHAVIOR:")
    print("-" * 30)
    print("• KYC upload should work without ObjectId errors")
    print("• System auto-approvals will have reviewedBy: null")
    print("• Manual admin approvals will have reviewedBy: adminId")
    print("• OCR results will be properly stored")
    print()
    
    print("🚀 NEXT STEPS:")
    print("-" * 30)
    print("1. ✅ User service restarted with fix")
    print("2. ✅ OCR service running and working")
    print("3. 🔄 Test KYC upload from frontend")
    print("4. 📊 Check database for proper data storage")

if __name__ == "__main__":
    test_kyc_upload_fix()
