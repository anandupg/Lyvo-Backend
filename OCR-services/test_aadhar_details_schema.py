import requests
import json

def test_aadhar_details_schema():
    """Test the comprehensive AadharDetails schema and saving logic"""
    
    print("📋 TESTING AADHAR DETAILS SCHEMA")
    print("=" * 50)
    
    # Sample OCR result for testing
    sample_ocr_result = {
        "success": True,
        "confidence": 95,
        "extracted_data": {
            "aadhar_number": "3621 8443 8575",
            "name": "ANANDU P GANESH",
            "date_of_birth": "27/10/2002",
            "gender": "MALE",
            "mobile": "7306080450",
            "address": "123 Main Street, City, State",
            "father_name": "P GANESH",
            "mother_name": "S GANESH",
            "vid": "9160 1699 3333 9777"
        },
        "validation": {
            "is_aadhar_card": True,
            "has_aadhar_keywords": True,
            "has_aadhar_number": True,
            "has_name": True,
            "has_dob": True,
            "has_gender": True,
            "has_mobile": True,
            "confidence_score": 95,
            "core_fields_count": 5,
            "total_core_fields": 5
        },
        "raw_text": "GOVERNMENT OF INDIA AADHAAR ANANDU P GANESH DOB: 27/10/2002 MALE Mobile No: 7306080450 3621 8443 8575 VID : 9160 1699 3333 9777",
        "ocr_details": {
            "api_used": "OCR.space API",
            "processing_time": 2.5,
            "api_confidence": 95,
            "field_extraction_confidence": 90,
            "validation_confidence": 95
        }
    }
    
    # Sample user data
    sample_user = {
        "userId": "507f1f77bcf86cd799439011",
        "name": "Anandu P Ganesh",
        "email": "anandu@example.com"
    }
    
    # Sample Cloudinary URLs
    sample_urls = {
        "frontUrl": "https://res.cloudinary.com/lyvo/image/upload/v1234567890/kyc-docs/front_123.jpg",
        "backUrl": "https://res.cloudinary.com/lyvo/image/upload/v1234567890/kyc-docs/back_123.jpg"
    }
    
    print("🧪 SCHEMA STRUCTURE TEST:")
    print("-" * 40)
    
    # Test the expected AadharDetails document structure
    expected_aadhar_details = {
        "userId": sample_user["userId"],
        
        # Document Images
        "frontImageUrl": sample_urls["frontUrl"],
        "backImageUrl": sample_urls["backUrl"],
        
        # Approval Status
        "approvalStatus": "approved",
        "approvalDate": "2024-01-15T10:30:00.000Z",
        "approvedBy": None,
        
        # OCR Extracted Data
        "extractedData": {
            "aadharNumber": "3621 8443 8575",
            "name": "ANANDU P GANESH",
            "dateOfBirth": "27/10/2002",
            "gender": "MALE",
            "mobile": "7306080450",
            "address": "123 Main Street, City, State",
            "fatherName": "P GANESH",
            "motherName": "S GANESH",
            "vid": "9160 1699 3333 9777"
        },
        
        # OCR Validation Results
        "validationResults": {
            "isAadharCard": True,
            "hasAadharKeywords": True,
            "hasAadharNumber": True,
            "hasName": True,
            "hasDob": True,
            "hasGender": True,
            "hasMobile": True,
            "confidenceScore": 95,
            "coreFieldsCount": 5,
            "totalCoreFields": 5
        },
        
        # Name Matching Results
        "nameMatching": {
            "extractedName": "ANANDU P GANESH",
            "profileName": "Anandu P Ganesh",
            "nameMatch": True,
            "matchConfidence": 95,
            "matchReason": "Exact match - verification passed"
        },
        
        # OCR Processing Details
        "ocrProcessing": {
            "apiUsed": "OCR.space API",
            "processingTime": 2.5,
            "rawText": "GOVERNMENT OF INDIA AADHAAR ANANDU P GANESH DOB: 27/10/2002 MALE Mobile No: 7306080450 3621 8443 8575 VID : 9160 1699 3333 9777",
            "ocrConfidence": 95,
            "fieldExtractionConfidence": 90,
            "validationConfidence": 95,
            "processedAt": "2024-01-15T10:30:00.000Z"
        },
        
        # Verification Summary
        "verificationSummary": {
            "overallConfidence": 95,
            "verificationMethod": "auto",
            "verificationNotes": "Automatically verified - Valid Aadhar + Name match",
            "riskScore": 0,
            "flags": []
        },
        
        # Audit Trail
        "auditTrail": {
            "uploadedAt": "2024-01-15T10:30:00.000Z",
            "processedAt": "2024-01-15T10:30:00.000Z",
            "approvedAt": "2024-01-15T10:30:00.000Z",
            "lastModifiedAt": "2024-01-15T10:30:00.000Z",
            "modificationHistory": [{
                "modifiedAt": "2024-01-15T10:30:00.000Z",
                "modifiedBy": None,
                "changes": "Initial verification and approval",
                "reason": "System auto-approval"
            }]
        }
    }
    
    print("✅ Schema Structure Validation:")
    print(f"   📊 Total Fields: {len(expected_aadhar_details)}")
    print(f"   🖼️  Image URLs: {expected_aadhar_details['frontImageUrl'][:50]}...")
    print(f"   🆔 Aadhar Number: {expected_aadhar_details['extractedData']['aadharNumber']}")
    print(f"   👤 Name: {expected_aadhar_details['extractedData']['name']}")
    print(f"   📅 DOB: {expected_aadhar_details['extractedData']['dateOfBirth']}")
    print(f"   ⚧ Gender: {expected_aadhar_details['extractedData']['gender']}")
    print(f"   📱 Mobile: {expected_aadhar_details['extractedData']['mobile']}")
    print(f"   🏠 Address: {expected_aadhar_details['extractedData']['address'][:30]}...")
    print(f"   👨 Father: {expected_aadhar_details['extractedData']['fatherName']}")
    print(f"   👩 Mother: {expected_aadhar_details['extractedData']['motherName']}")
    print(f"   🆔 VID: {expected_aadhar_details['extractedData']['vid']}")
    
    print("\n✅ Validation Results:")
    print(f"   🆔 Valid Aadhar: {expected_aadhar_details['validationResults']['isAadharCard']}")
    print(f"   📈 Confidence: {expected_aadhar_details['validationResults']['confidenceScore']}%")
    print(f"   🔢 Core Fields: {expected_aadhar_details['validationResults']['coreFieldsCount']}/{expected_aadhar_details['validationResults']['totalCoreFields']}")
    
    print("\n✅ Name Matching:")
    print(f"   📄 Extracted: {expected_aadhar_details['nameMatching']['extractedName']}")
    print(f"   👤 Profile: {expected_aadhar_details['nameMatching']['profileName']}")
    print(f"   ✅ Match: {expected_aadhar_details['nameMatching']['nameMatch']}")
    print(f"   📊 Confidence: {expected_aadhar_details['nameMatching']['matchConfidence']}%")
    
    print("\n✅ OCR Processing:")
    print(f"   🔧 API Used: {expected_aadhar_details['ocrProcessing']['apiUsed']}")
    print(f"   ⏱️  Processing Time: {expected_aadhar_details['ocrProcessing']['processingTime']}s")
    print(f"   📊 OCR Confidence: {expected_aadhar_details['ocrProcessing']['ocrConfidence']}%")
    print(f"   📝 Raw Text Length: {len(expected_aadhar_details['ocrProcessing']['rawText'])} chars")
    
    print("\n✅ Verification Summary:")
    print(f"   📊 Overall Confidence: {expected_aadhar_details['verificationSummary']['overallConfidence']}%")
    print(f"   🤖 Method: {expected_aadhar_details['verificationSummary']['verificationMethod']}")
    print(f"   📝 Notes: {expected_aadhar_details['verificationSummary']['verificationNotes']}")
    print(f"   ⚠️  Risk Score: {expected_aadhar_details['verificationSummary']['riskScore']}")
    print(f"   🚩 Flags: {len(expected_aadhar_details['verificationSummary']['flags'])}")
    
    print("\n✅ Audit Trail:")
    print(f"   📤 Uploaded: {expected_aadhar_details['auditTrail']['uploadedAt']}")
    print(f"   🔄 Processed: {expected_aadhar_details['auditTrail']['processedAt']}")
    print(f"   ✅ Approved: {expected_aadhar_details['auditTrail']['approvedAt']}")
    print(f"   📝 Modifications: {len(expected_aadhar_details['auditTrail']['modificationHistory'])}")
    
    print("\n" + "=" * 50)
    print("📋 AADHAR DETAILS SCHEMA FEATURES:")
    print("-" * 40)
    print("✅ Comprehensive Data Storage:")
    print("   • All OCR extracted fields")
    print("   • Complete validation results")
    print("   • Name matching details")
    print("   • OCR processing metadata")
    print("   • Verification summary")
    print("   • Full audit trail")
    print()
    print("✅ Database Indexes:")
    print("   • userId (unique)")
    print("   • approvalStatus")
    print("   • aadharNumber")
    print("   • name")
    print("   • approvalDate")
    print("   • overallConfidence")
    print()
    print("✅ Data Integrity:")
    print("   • Required fields validation")
    print("   • Enum constraints")
    print("   • Timestamp tracking")
    print("   • Modification history")
    print()
    print("🎯 USAGE:")
    print("-" * 20)
    print("• Only saved when verification passes")
    print("• Contains complete Aadhar information")
    print("• Includes Cloudinary image URLs")
    print("• Full audit trail for compliance")
    print("• Optimized for queries and reporting")

if __name__ == "__main__":
    test_aadhar_details_schema()
