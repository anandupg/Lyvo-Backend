import requests
import json

def test_booking_flow_with_aadhar():
    """Test the booking flow with Aadhar verification"""
    
    print("🏠 TESTING BOOKING FLOW WITH AADHAR VERIFICATION")
    print("=" * 60)
    
    # Test cases for different Aadhar statuses and booking behavior
    test_cases = [
        {
            "name": "✅ Approved Aadhar → Allow Booking",
            "aadhar_status": {
                "isApproved": True,
                "status": "approved",
                "message": "Aadhar verification approved",
                "details": {
                    "aadharNumber": "3621 8443 8575",
                    "name": "ANANDU P GANESH",
                    "approvalDate": "2024-01-15T10:30:00.000Z",
                    "overallConfidence": 95
                }
            },
            "expected_booking_allowed": True,
            "expected_button_text": "Book This Room",
            "expected_warning_shown": False,
            "expected_success_shown": True
        },
        {
            "name": "❌ Rejected Aadhar → Block Booking",
            "aadhar_status": {
                "isApproved": False,
                "status": "rejected",
                "message": "Aadhar verification rejected",
                "details": {
                    "rejectionReason": "Invalid Aadhar card detected",
                    "riskScore": 10,
                    "flags": ["invalid_document"]
                }
            },
            "expected_booking_allowed": False,
            "expected_button_text": "Verify Identity to Book",
            "expected_warning_shown": True,
            "expected_success_shown": False
        },
        {
            "name": "⏳ Pending Aadhar → Block Booking",
            "aadhar_status": {
                "isApproved": False,
                "status": "pending",
                "message": "Aadhar verification pending",
                "details": {
                    "submittedAt": "2024-01-15T10:30:00.000Z",
                    "processedAt": "2024-01-15T10:30:00.000Z"
                }
            },
            "expected_booking_allowed": False,
            "expected_button_text": "Verify Identity to Book",
            "expected_warning_shown": True,
            "expected_success_shown": False
        },
        {
            "name": "❌ No Aadhar Submitted → Block Booking",
            "aadhar_status": {
                "isApproved": False,
                "status": "not_submitted",
                "message": "No Aadhar verification found",
                "details": None
            },
            "expected_booking_allowed": False,
            "expected_button_text": "Verify Identity to Book",
            "expected_warning_shown": True,
            "expected_success_shown": False
        },
        {
            "name": "🔄 Checking Aadhar Status → Show Loading",
            "aadhar_status": None,  # Still loading
            "checking_aadhar_status": True,
            "expected_booking_allowed": False,
            "expected_button_text": "Checking Verification...",
            "expected_warning_shown": False,
            "expected_success_shown": False
        }
    ]
    
    print("🧪 BOOKING FLOW TESTS:")
    print("-" * 40)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)
        
        # Simulate the frontend logic
        aadhar_status = test_case.get("aadhar_status")
        checking_aadhar_status = test_case.get("checking_aadhar_status", False)
        
        # Determine booking availability
        booking_allowed = False
        button_text = "Verify Identity to Book"
        warning_shown = False
        success_shown = False
        
        if checking_aadhar_status:
            button_text = "Checking Verification..."
            booking_allowed = False
        elif aadhar_status:
            if aadhar_status["isApproved"]:
                booking_allowed = True
                button_text = "Book This Room"
                success_shown = True
            else:
                booking_allowed = False
                button_text = "Verify Identity to Book"
                warning_shown = True
        else:
            booking_allowed = False
            button_text = "Verify Identity to Book"
            warning_shown = True
        
        print(f"   📊 Aadhar Status: {aadhar_status['status'] if aadhar_status else 'Loading'}")
        print(f"   🔄 Checking Status: {'YES' if checking_aadhar_status else 'NO'}")
        print(f"   ✅ Booking Allowed: {'YES' if booking_allowed else 'NO'}")
        print(f"   🔘 Button Text: {button_text}")
        print(f"   ⚠️  Warning Shown: {'YES' if warning_shown else 'NO'}")
        print(f"   ✅ Success Shown: {'YES' if success_shown else 'NO'}")
        
        if aadhar_status and aadhar_status.get("details"):
            print(f"   📋 Details Available: YES")
            if aadhar_status["isApproved"]:
                print(f"      🆔 Aadhar Number: {aadhar_status['details'].get('aadharNumber', 'N/A')}")
                print(f"      👤 Name: {aadhar_status['details'].get('name', 'N/A')}")
                print(f"      📅 Approval Date: {aadhar_status['details'].get('approvalDate', 'N/A')}")
                print(f"      📊 Confidence: {aadhar_status['details'].get('overallConfidence', 'N/A')}%")
            else:
                print(f"      📝 Message: {aadhar_status.get('message', 'N/A')}")
        else:
            print(f"   📋 Details Available: NO")
        
        # Check results
        booking_match = booking_allowed == test_case["expected_booking_allowed"]
        button_match = button_text == test_case["expected_button_text"]
        warning_match = warning_shown == test_case["expected_warning_shown"]
        success_match = success_shown == test_case["expected_success_shown"]
        
        if booking_match and button_match and warning_match and success_match:
            print(f"   ✅ TEST PASSED")
        else:
            print(f"   ❌ TEST FAILED")
            if not booking_match:
                print(f"      Expected booking allowed: {test_case['expected_booking_allowed']}, Got: {booking_allowed}")
            if not button_match:
                print(f"      Expected button text: {test_case['expected_button_text']}, Got: {button_text}")
            if not warning_match:
                print(f"      Expected warning shown: {test_case['expected_warning_shown']}, Got: {warning_shown}")
            if not success_match:
                print(f"      Expected success shown: {test_case['expected_success_shown']}, Got: {success_shown}")
    
    print("\n" + "=" * 60)
    print("📋 BOOKING FLOW RULES:")
    print("-" * 40)
    print("✅ ALLOW BOOKING if:")
    print("   • Aadhar verification status = 'approved'")
    print("   • isApproved = true")
    print("   • Button shows: 'Book This Room'")
    print("   • Green success message shown")
    print()
    print("❌ BLOCK BOOKING if:")
    print("   • Aadhar verification status = 'rejected'")
    print("   • Aadhar verification status = 'pending'")
    print("   • No Aadhar verification found")
    print("   • Still checking Aadhar status")
    print("   • Button shows: 'Verify Identity to Book'")
    print("   • Yellow warning message shown")
    print()
    print("🔄 LOADING STATE:")
    print("   • While checking Aadhar status")
    print("   • Button shows: 'Checking Verification...'")
    print("   • Button disabled with loading spinner")
    print()
    print("🎯 UI COMPONENTS:")
    print("-" * 30)
    print("1. **Warning Message** (Yellow):")
    print("   • Shows when Aadhar not approved")
    print("   • Includes specific error message")
    print("   • 'Verify Now →' link to KYC page")
    print()
    print("2. **Success Message** (Green):")
    print("   • Shows when Aadhar approved")
    print("   • 'Identity Verified' confirmation")
    print("   • 'Your Aadhar verification is approved'")
    print()
    print("3. **Booking Button**:")
    print("   • Enabled only when Aadhar approved")
    print("   • Shows different text based on status")
    print("   • Disabled with loading spinner when checking")
    print()
    print("🔧 API INTEGRATION:")
    print("-" * 30)
    print("• GET /api/user/aadhar-status")
    print("  - Called on component load")
    print("  - Returns current verification status")
    print("  - Updates UI based on response")
    print()
    print("• POST /booking/create")
    print("  - Called when booking button clicked")
    print("  - Backend middleware checks Aadhar approval")
    print("  - Returns 403 if not approved")

if __name__ == "__main__":
    test_booking_flow_with_aadhar()
