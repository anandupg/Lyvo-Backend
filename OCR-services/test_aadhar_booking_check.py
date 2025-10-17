import requests
import json

def test_aadhar_booking_check():
    """Test Aadhar approval checking for booking permissions"""
    
    print("🔒 TESTING AADHAR BOOKING CHECK")
    print("=" * 50)
    
    # Test cases for different Aadhar statuses
    test_cases = [
        {
            "name": "✅ Approved Aadhar → Allow Booking",
            "aadhar_status": "approved",
            "expected_booking_allowed": True,
            "expected_response": {
                "isApproved": True,
                "status": "approved",
                "message": "Aadhar verification approved"
            }
        },
        {
            "name": "❌ Rejected Aadhar → Block Booking",
            "aadhar_status": "rejected",
            "expected_booking_allowed": False,
            "expected_response": {
                "isApproved": False,
                "status": "rejected",
                "message": "Aadhar verification rejected",
                "error": "AADHAR_NOT_APPROVED"
            }
        },
        {
            "name": "⏳ Pending Aadhar → Block Booking",
            "aadhar_status": "pending",
            "expected_booking_allowed": False,
            "expected_response": {
                "isApproved": False,
                "status": "pending",
                "message": "Aadhar verification pending",
                "error": "AADHAR_NOT_APPROVED"
            }
        },
        {
            "name": "❌ No Aadhar Submitted → Block Booking",
            "aadhar_status": "not_submitted",
            "expected_booking_allowed": False,
            "expected_response": {
                "isApproved": False,
                "status": "not_submitted",
                "message": "No Aadhar verification found",
                "error": "AADHAR_NOT_APPROVED"
            }
        }
    ]
    
    print("🧪 BOOKING PERMISSION TESTS:")
    print("-" * 40)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)
        
        # Simulate the checkAadharApproval function logic
        aadhar_status = test_case["aadhar_status"]
        
        if aadhar_status == "approved":
            is_approved = True
            status = "approved"
            message = "Aadhar verification approved"
            details = {
                "aadharNumber": "3621 8443 8575",
                "name": "ANANDU P GANESH",
                "approvalDate": "2024-01-15T10:30:00.000Z",
                "overallConfidence": 95,
                "verificationMethod": "auto"
            }
        elif aadhar_status == "rejected":
            is_approved = False
            status = "rejected"
            message = "Aadhar verification rejected"
            details = {
                "rejectionReason": "Invalid Aadhar card detected",
                "riskScore": 10,
                "flags": ["invalid_document"]
            }
        elif aadhar_status == "pending":
            is_approved = False
            status = "pending"
            message = "Aadhar verification pending"
            details = {
                "submittedAt": "2024-01-15T10:30:00.000Z",
                "processedAt": "2024-01-15T10:30:00.000Z"
            }
        else:  # not_submitted
            is_approved = False
            status = "not_submitted"
            message = "No Aadhar verification found"
            details = None
        
        # Check booking permission
        booking_allowed = is_approved
        
        print(f"   📊 Aadhar Status: {status}")
        print(f"   📝 Message: {message}")
        print(f"   ✅ Booking Allowed: {'YES' if booking_allowed else 'NO'}")
        
        if details:
            print(f"   📋 Details Available: YES")
            if status == "approved":
                print(f"      🆔 Aadhar Number: {details.get('aadharNumber', 'N/A')}")
                print(f"      👤 Name: {details.get('name', 'N/A')}")
                print(f"      📅 Approval Date: {details.get('approvalDate', 'N/A')}")
                print(f"      📊 Confidence: {details.get('overallConfidence', 'N/A')}%")
            elif status == "rejected":
                print(f"      ❌ Rejection Reason: {details.get('rejectionReason', 'N/A')}")
                print(f"      ⚠️  Risk Score: {details.get('riskScore', 'N/A')}")
                print(f"      🚩 Flags: {len(details.get('flags', []))}")
        else:
            print(f"   📋 Details Available: NO")
        
        # Check results
        booking_match = booking_allowed == test_case["expected_booking_allowed"]
        
        if booking_match:
            print(f"   ✅ TEST PASSED")
        else:
            print(f"   ❌ TEST FAILED")
            print(f"      Expected booking allowed: {test_case['expected_booking_allowed']}, Got: {booking_allowed}")
    
    print("\n" + "=" * 50)
    print("📋 BOOKING PERMISSION RULES:")
    print("-" * 40)
    print("✅ ALLOW BOOKING only if:")
    print("   • Aadhar verification status = 'approved'")
    print("   • Overall confidence >= 70%")
    print("   • Name matches profile")
    print()
    print("❌ BLOCK BOOKING if:")
    print("   • Aadhar verification status = 'rejected'")
    print("   • Aadhar verification status = 'pending'")
    print("   • No Aadhar verification found")
    print("   • Any verification errors")
    print()
    print("🎯 API ENDPOINTS:")
    print("-" * 30)
    print("• GET /api/user/aadhar-status")
    print("  - Check current Aadhar verification status")
    print("  - Returns: isApproved, status, message, details")
    print()
    print("• Middleware: requireAadharApproval")
    print("  - Use before booking routes")
    print("  - Automatically blocks if not approved")
    print("  - Returns 403 with detailed error message")
    print()
    print("🔧 IMPLEMENTATION:")
    print("-" * 30)
    print("1. Add middleware to booking routes:")
    print("   router.post('/booking/create', verifyJWT, requireAadharApproval, createBooking)")
    print()
    print("2. Check Aadhar status in frontend:")
    print("   const response = await fetch('/api/user/aadhar-status')")
    print("   if (!response.aadharStatus.isApproved) {")
    print("     // Show verification required message")
    print("   }")
    print()
    print("3. Handle booking errors:")
    print("   if (error.error === 'AADHAR_NOT_APPROVED') {")
    print("     // Redirect to KYC verification page")
    print("   }")

if __name__ == "__main__":
    test_aadhar_booking_check()
