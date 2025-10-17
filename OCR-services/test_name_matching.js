// Test the name matching logic
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

const calculateSimilarity = (str1, str2) => {
  // Normalize to uppercase for case-insensitive comparison
  const normalizedStr1 = str1.toUpperCase();
  const normalizedStr2 = str2.toUpperCase();
  
  const longer = normalizedStr1.length > normalizedStr2.length ? normalizedStr1 : normalizedStr2;
  const shorter = normalizedStr1.length > normalizedStr2.length ? normalizedStr2 : normalizedStr1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const checkNameMatch = (extractedName, userFullName) => {
  if (!extractedName || !userFullName) {
    return { match: false, confidence: 0, reason: 'Missing name data' };
  }

  // Normalize names to uppercase for case-insensitive comparison
  const normalizedExtracted = extractedName.toUpperCase().trim();
  const normalizedUser = userFullName.toUpperCase().trim();

  const extractedParts = normalizedExtracted.split(/\s+/).filter(part => part.length > 0);
  const userParts = normalizedUser.split(/\s+/).filter(part => part.length > 0);

  // Check for exact match (case-insensitive)
  if (normalizedExtracted === normalizedUser) {
    return { match: true, confidence: 1.0, reason: 'Exact match' };
  }

  let matchCount = 0;
  let totalParts = Math.max(extractedParts.length, userParts.length);

  for (const extractedPart of extractedParts) {
    for (const userPart of userParts) {
      // Case-insensitive exact match
      if (extractedPart === userPart) {
        matchCount++;
        break;
      }
      // Case-insensitive similarity check
      if (extractedPart.length > 2 && userPart.length > 2) {
        const similarity = calculateSimilarity(extractedPart, userPart);
        if (similarity > 0.8) {
          matchCount += similarity;
          break;
        }
      }
    }
  }

  const confidence = matchCount / totalParts;
  
  if (confidence >= 0.8) {
    return { match: true, confidence, reason: 'High similarity match' };
  } else if (confidence >= 0.5) {
    return { match: false, confidence, reason: 'Partial match - manual review needed' };
  } else {
    return { match: false, confidence, reason: 'No significant match found' };
  }
};

// Test cases
console.log("🧪 TESTING NAME MATCHING LOGIC");
console.log("============================================================");

const testCases = [
  {
    name: "Your Case - Uppercase vs Title Case",
    extracted: "ANANDU P GANESH",
    user: "Anandu P Ganesh",
    expected: true
  },
  {
    name: "Exact Match",
    extracted: "John Doe",
    user: "John Doe",
    expected: true
  },
  {
    name: "Case Insensitive Match",
    extracted: "JOHN DOE",
    user: "john doe",
    expected: true
  },
  {
    name: "Different Names",
    extracted: "John Doe",
    user: "Jane Smith",
    expected: false
  },
  {
    name: "Partial Match",
    extracted: "John Michael Doe",
    user: "John Doe",
    expected: false
  }
];

testCases.forEach((testCase, index) => {
  const result = checkNameMatch(testCase.extracted, testCase.user);
  const status = result.match === testCase.expected ? "✅" : "❌";
  
  console.log(`\nTest ${index + 1}: ${testCase.name} ${status}`);
  console.log(`  Extracted: "${testCase.extracted}"`);
  console.log(`  User: "${testCase.user}"`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Result: ${result.match}`);
  console.log(`  Confidence: ${Math.round(result.confidence * 100)}%`);
  console.log(`  Reason: ${result.reason}`);
});

console.log("\n🎯 SPECIFIC TEST FOR YOUR CASE:");
const yourResult = checkNameMatch("ANANDU P GANESH", "Anandu P Ganesh");
console.log(`Extracted: "ANANDU P GANESH"`);
console.log(`User: "Anandu P Ganesh"`);
console.log(`Match: ${yourResult.match ? "✅ YES" : "❌ NO"}`);
console.log(`Confidence: ${Math.round(yourResult.confidence * 100)}%`);
console.log(`Reason: ${yourResult.reason}`);
