import requests
import json

def test_aadhar_validation():
    """Test Aadhar card validation against your specific requirements"""
    
    print("🔍 TESTING AADHAR CARD VALIDATION")
    print("=" * 50)
    
    # Your Aadhar card details (reference)
    your_aadhar = {
        'name': 'ANANDU P GANESH',
        'dob': '27/10/2002',
        'gender': 'MALE',
        'mobile': '7306080450',
        'aadhar_number': '3621 8443 8575',
        'vid': '9160 1699 3333 9777'
    }
    
    print("📋 REFERENCE AADHAR CARD:")
    print("-" * 30)
    for field, value in your_aadhar.items():
        print(f"   {field.replace('_', ' ').title()}: {value}")
    
    print()
    
    # Test cases
    test_cases = [
        {
            'name': 'Valid Aadhar (Your Details)',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
MALE
Mobile No: 7306080450
3621 8443 8575
VID: 9160 1699 3333 9777""",
            'expected': True
        },
        {
            'name': 'Valid Aadhar (Different Person)',
            'text': """JOHN DOE
DOB: 15/05/1990
MALE
Mobile No: 9876543210
1234 5678 9012
VID: 1234 5678 9012 3456""",
            'expected': True
        },
        {
            'name': 'Invalid - Missing Name',
            'text': """DOB: 27/10/2002
MALE
Mobile No: 7306080450
3621 8443 8575
VID: 9160 1699 3333 9777""",
            'expected': False
        },
        {
            'name': 'Invalid - Missing DOB',
            'text': """ANANDU P GANESH
MALE
Mobile No: 7306080450
3621 8443 8575
VID: 9160 1699 3333 9777""",
            'expected': False
        },
        {
            'name': 'Invalid - Missing Gender',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
Mobile No: 7306080450
3621 8443 8575
VID: 9160 1699 3333 9777""",
            'expected': False
        },
        {
            'name': 'Invalid - Missing Mobile',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
MALE
3621 8443 8575
VID: 9160 1699 3333 9777""",
            'expected': False
        },
        {
            'name': 'Invalid - Missing Aadhar Number',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
MALE
Mobile No: 7306080450
VID: 9160 1699 3333 9777""",
            'expected': False
        },
        {
            'name': 'Invalid - Missing VID',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
MALE
Mobile No: 7306080450
3621 8443 8575""",
            'expected': False
        },
        {
            'name': 'Invalid - Wrong Aadhar Format',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
MALE
Mobile No: 7306080450
3621 8443 857  # Only 11 digits
VID: 9160 1699 3333 9777""",
            'expected': False
        },
        {
            'name': 'Invalid - Wrong Mobile Format',
            'text': """ANANDU P GANESH
DOB: 27/10/2002
MALE
Mobile No: 730608045  # Only 9 digits
3621 8443 8575
VID: 9160 1699 3333 9777""",
            'expected': False
        }
    ]
    
    print("🧪 RUNNING VALIDATION TESTS:")
    print("-" * 40)
    
    passed_tests = 0
    total_tests = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 30)
        
        try:
            response = requests.post(
                'http://localhost:5003/ocr/debug-text',
                json={'text': test_case['text']},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if all required fields are present
                extracted = result.get('extracted_data', {})
                validation = result.get('validation', {})
                
                # Required fields check
                required_fields = ['name', 'date_of_birth', 'gender', 'mobile', 'aadhar_number']
                missing_fields = []
                
                for field in required_fields:
                    if not extracted.get(field):
                        missing_fields.append(field)
                
                # Check if it's a valid Aadhar card
                is_valid = validation.get('is_aadhar_card', False) and len(missing_fields) == 0
                
                # Check if VID is present (optional but recommended)
                has_vid = 'VID' in test_case['text'] or 'vid' in test_case['text'].lower()
                
                print(f"   📊 Validation Results:")
                print(f"      ✓ Has Keywords: {validation.get('has_aadhar_keywords', False)}")
                print(f"      ✓ Has Aadhar Number: {validation.get('has_aadhar_number', False)}")
                print(f"      ✓ Has Name: {validation.get('has_name', False)}")
                print(f"      ✓ Has DOB: {validation.get('has_dob', False)}")
                print(f"      ✓ Has Gender: {validation.get('has_gender', False)}")
                print(f"      ✓ Has VID: {has_vid}")
                print(f"      📈 Confidence: {validation.get('confidence_score', 0):.1f}%")
                
                print(f"   📋 Extracted Data:")
                for field in required_fields:
                    value = extracted.get(field, 'Not found')
                    status = "✅" if value != 'Not found' else "❌"
                    print(f"      {status} {field.replace('_', ' ').title()}: {value}")
                
                print(f"   🎯 Final Result:")
                if is_valid:
                    print(f"      ✅ VALID AADHAR CARD")
                    if has_vid:
                        print(f"      ✅ Includes VID (Recommended)")
                    else:
                        print(f"      ⚠️ Missing VID (Still valid)")
                else:
                    print(f"      ❌ INVALID AADHAR CARD")
                    if missing_fields:
                        print(f"      ❌ Missing fields: {', '.join(missing_fields)}")
                
                # Check if result matches expected
                if is_valid == test_case['expected']:
                    print(f"   ✅ TEST PASSED")
                    passed_tests += 1
                else:
                    print(f"   ❌ TEST FAILED (Expected: {test_case['expected']}, Got: {is_valid})")
                
            else:
                print(f"   ❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📊 TEST SUMMARY:")
    print(f"   ✅ Passed: {passed_tests}/{total_tests}")
    print(f"   ❌ Failed: {total_tests - passed_tests}/{total_tests}")
    print(f"   📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED! Aadhar validation is working perfectly!")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} tests failed. Check validation logic.")
    
    print("\n💡 VALIDATION CRITERIA:")
    print("-" * 30)
    print("✅ Required Fields:")
    print("   • Name (2-50 characters)")
    print("   • Date of Birth (DD/MM/YYYY format)")
    print("   • Gender (MALE/FEMALE)")
    print("   • Mobile Number (10 digits)")
    print("   • Aadhar Number (12 digits)")
    print("✅ Optional Fields:")
    print("   • VID (16 digits)")
    print("   • Father/Mother Name")
    print("   • Address")
    print("✅ Validation Rules:")
    print("   • Must have Aadhar keywords")
    print("   • All required fields must be present")
    print("   • Confidence score >= 30%")
    print("   • Proper format validation")

if __name__ == "__main__":
    test_aadhar_validation()
