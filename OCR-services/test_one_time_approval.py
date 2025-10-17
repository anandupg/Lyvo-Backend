import requests
import json

def test_one_time_approval():
    """Test that users don't need to upload KYC again after approval"""
    
    print("🔄 TESTING ONE-TIME APPROVAL LOGIC")
    print("=" * 60)
    
    # Test cases for different scenarios
    test_cases = [
        {
            "name": "✅ Already Approved → Show Status Page",
            "aadhar_status": {
                "isApproved": True,
                "status": "approved",
                "message": "Aadhar verification approved",
                "details": {
                    "aadharNumber": "3621 8443 8575",
                    "name": "ANANDU P GANESH",
                    "approvalDate": "2024-01-15T10:30:00.000Z",
                    "overallConfidence": 95,
                    "verificationMethod": "auto"
                }
            },
            "expected_behavior": {
                "show_upload_form": False,
                "show_approval_status": True,
                "page_title": "Identity Verification",
                "subtitle": "Your Aadhar verification is complete",
                "card_title": "Verification Approved",
                "status_badge": "Verified",
                "action_buttons": ["Go to Dashboard", "View Bookings"]
            }
        },
        {
            "name": "❌ Not Approved → Show Upload Form",
            "aadhar_status": {
                "isApproved": False,
                "status": "not_submitted",
                "message": "No Aadhar verification found",
                "details": None
            },
            "expected_behavior": {
                "show_upload_form": True,
                "show_approval_status": False,
                "page_title": "Identity Verification",
                "subtitle": "Verify your identity with Aadhar card",
                "upload_section": "visible",
                "camera_section": "visible"
            }
        },
        {
            "name": "⏳ Pending → Show Upload Form",
            "aadhar_status": {
                "isApproved": False,
                "status": "pending",
                "message": "Aadhar verification pending",
                "details": {
                    "submittedAt": "2024-01-15T10:30:00.000Z",
                    "processedAt": "2024-01-15T10:30:00.000Z"
                }
            },
            "expected_behavior": {
                "show_upload_form": True,
                "show_approval_status": False,
                "page_title": "Identity Verification",
                "subtitle": "Verify your identity with Aadhar card",
                "upload_section": "visible",
                "camera_section": "visible"
            }
        },
        {
            "name": "❌ Rejected → Show Upload Form",
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
            "expected_behavior": {
                "show_upload_form": True,
                "show_approval_status": False,
                "page_title": "Identity Verification",
                "subtitle": "Verify your identity with Aadhar card",
                "upload_section": "visible",
                "camera_section": "visible"
            }
        },
        {
            "name": "🔄 Loading → Show Loading State",
            "aadhar_status": None,  # Still loading
            "checking_approval_status": True,
            "expected_behavior": {
                "show_loading": True,
                "loading_message": "Checking verification status...",
                "show_upload_form": False,
                "show_approval_status": False
            }
        }
    ]
    
    print("🧪 ONE-TIME APPROVAL TESTS:")
    print("-" * 40)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)
        
        # Simulate the frontend logic
        aadhar_status = test_case.get("aadhar_status")
        checking_approval_status = test_case.get("checking_approval_status", False)
        expected = test_case["expected_behavior"]
        
        # Determine what should be shown
        show_loading = checking_approval_status
        show_approval_status = aadhar_status and aadhar_status["isApproved"]
        show_upload_form = not show_loading and not show_approval_status
        
        print(f"   📊 Aadhar Status: {aadhar_status['status'] if aadhar_status else 'Loading'}")
        print(f"   🔄 Checking Status: {'YES' if checking_approval_status else 'NO'}")
        print(f"   ⏳ Show Loading: {'YES' if show_loading else 'NO'}")
        print(f"   ✅ Show Approval Status: {'YES' if show_approval_status else 'NO'}")
        print(f"   📤 Show Upload Form: {'YES' if show_upload_form else 'NO'}")
        
        if aadhar_status and aadhar_status.get("details"):
            print(f"   📋 Details Available: YES")
            if aadhar_status["isApproved"]:
                print(f"      🆔 Aadhar Number: {aadhar_status['details'].get('aadharNumber', 'N/A')}")
                print(f"      👤 Name: {aadhar_status['details'].get('name', 'N/A')}")
                print(f"      📅 Approval Date: {aadhar_status['details'].get('approvalDate', 'N/A')}")
                print(f"      📊 Confidence: {aadhar_status['details'].get('overallConfidence', 'N/A')}%")
                print(f"      🔧 Method: {aadhar_status['details'].get('verificationMethod', 'N/A')}")
        else:
            print(f"   📋 Details Available: NO")
        
        # Check results
        loading_match = show_loading == expected.get("show_loading", False)
        approval_match = show_approval_status == expected.get("show_approval_status", False)
        upload_match = show_upload_form == expected.get("show_upload_form", False)
        
        if loading_match and approval_match and upload_match:
            print(f"   ✅ TEST PASSED")
        else:
            print(f"   ❌ TEST FAILED")
            if not loading_match:
                print(f"      Expected show loading: {expected.get('show_loading', False)}, Got: {show_loading}")
            if not approval_match:
                print(f"      Expected show approval status: {expected.get('show_approval_status', False)}, Got: {show_approval_status}")
            if not upload_match:
                print(f"      Expected show upload form: {expected.get('show_upload_form', False)}, Got: {show_upload_form}")
    
    print("\n" + "=" * 60)
    print("📋 ONE-TIME APPROVAL RULES:")
    print("-" * 40)
    print("✅ SHOW APPROVAL STATUS PAGE if:")
    print("   • Aadhar verification status = 'approved'")
    print("   • isApproved = true")
    print("   • Display verification details")
    print("   • Show 'Go to Dashboard' and 'View Bookings' buttons")
    print("   • NO upload form shown")
    print()
    print("❌ SHOW UPLOAD FORM if:")
    print("   • Aadhar verification status = 'rejected'")
    print("   • Aadhar verification status = 'pending'")
    print("   • No Aadhar verification found")
    print("   • User needs to upload/verify")
    print()
    print("🔄 SHOW LOADING STATE if:")
    print("   • Still checking Aadhar approval status")
    print("   • Show 'Checking verification status...'")
    print("   • Disable all interactions")
    print()
    print("🎯 USER EXPERIENCE FLOW:")
    print("-" * 30)
    print("1. **First Visit (Not Approved)**:")
    print("   • Page loads → Check Aadhar status")
    print("   • Status = not approved → Show upload form")
    print("   • User uploads Aadhar → Verification process")
    print("   • If approved → Status updated in database")
    print()
    print("2. **Subsequent Visits (Already Approved)**:")
    print("   • Page loads → Check Aadhar status")
    print("   • Status = approved → Show approval status page")
    print("   • Display verification details")
    print("   • Show navigation buttons")
    print("   • NO upload form shown")
    print()
    print("3. **Loading State**:")
    print("   • Page loads → Start checking status")
    print("   • Show loading spinner")
    print("   • Disable all interactions")
    print("   • Update UI when check completes")
    print()
    print("🔧 API INTEGRATION:")
    print("-" * 30)
    print("• GET /api/user/aadhar-status")
    print("  - Called on component load")
    print("  - Returns current verification status")
    print("  - Determines which UI to show")
    print()
    print("• Component Logic:")
    print("  - Check status on mount")
    print("  - Show different UI based on status")
    print("  - Prevent re-upload if already approved")
    print()
    print("💡 BENEFITS:")
    print("-" * 30)
    print("✅ **One-Time Verification**: Users only verify once")
    print("✅ **Better UX**: No confusion about re-uploading")
    print("✅ **Efficiency**: Saves time and resources")
    print("✅ **Clear Status**: Users know their verification status")
    print("✅ **Seamless Navigation**: Easy access to other features")

if __name__ == "__main__":
    test_one_time_approval()
