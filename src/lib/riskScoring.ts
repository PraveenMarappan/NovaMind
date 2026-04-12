export function analyzeRisk(text: string): { riskScore: number; priority: "high" | "normal" } {
  const lowercaseText = text.toLowerCase();
  let score = 0;

  // Very high-risk phrases (weights 8-10)
  const veryHighRiskPatterns = [
    { phrase: "kill myself", weight: 10 },
    { phrase: "end my life", weight: 10 },
    { phrase: "want to die", weight: 10 },
    { phrase: "i am going to suicide", weight: 10 },
    { phrase: "i can't take it anymore", weight: 9 },
    { phrase: "no reason to live", weight: 9 },
    { phrase: "self harm", weight: 9 },
    { phrase: "cutting myself", weight: 9 },
    { phrase: "i want to disappear", weight: 8 },
    { phrase: "i want to end everything", weight: 8 },
    { phrase: "suicidal", weight: 9 },
    { phrase: "suicide", weight: 8 },
    { phrase: "die", weight: 8 },
    { phrase: "death", weight: 8 },
  ];

  // High-risk distress / abuse terms (weights 3-6)
  const highRiskPatterns = [
    { phrase: "mental torture", weight: 6 },
    { phrase: "toxic environment", weight: 6 },
    { phrase: "emotionally drained", weight: 6 },
    { phrase: "emotionally broken", weight: 5 },
    { phrase: "losing control", weight: 5 },
    { phrase: "bullied", weight: 5 },
    { phrase: "bullying", weight: 5 },
    { phrase: "abused", weight: 5 },
    { phrase: "abuse", weight: 4 },
    { phrase: "harassment", weight: 5 },
    { phrase: "harassed", weight: 5 },
    { phrase: "ragging", weight: 6 },
    { phrase: "unsafe", weight: 5 },
    { phrase: "threatened", weight: 5 },
    { phrase: "threat", weight: 4 },
    { phrase: "violence", weight: 5 },
    { phrase: "attacked", weight: 5 },
    { phrase: "public humiliation", weight: 5 },
    { phrase: "verbal abuse", weight: 5 },
    { phrase: "physical abuse", weight: 6 },
    { phrase: "group bullying", weight: 6 },
    { phrase: "fear", weight: 4 },
    { phrase: "scared", weight: 4 },
    { phrase: "crying daily", weight: 4 },
    { phrase: "depressed", weight: 5 },
    { phrase: "hopeless", weight: 4 },
    { phrase: "worthless", weight: 4 },
    { phrase: "helpless", weight: 4 },
    { phrase: "trauma", weight: 5 },
    { phrase: "panic", weight: 4 },
    { phrase: "isolated", weight: 3 },
    { phrase: "lonely", weight: 3 },
    { phrase: "nobody cares", weight: 4 },
    { phrase: "nobody understands", weight: 4 },
    { phrase: "mocked", weight: 3 },
    { phrase: "insulted", weight: 3 },
    { phrase: "breakdown", weight: 4 },
  ];

  // Medium-risk emotional indicators (weights 1-2.5)
  const mediumRiskPatterns = [
    { phrase: "exhausted mentally", weight: 2.5 },
    { phrase: "not okay", weight: 2.5 },
    { phrase: "avoiding class", weight: 2.5 },
    { phrase: "losing interest", weight: 2 },
    { phrase: "can't focus", weight: 2 },
    { phrase: "not sleeping", weight: 2 },
    { phrase: "insomnia", weight: 2 },
    { phrase: "stress", weight: 1.5 },
    { phrase: "anxious", weight: 2 },
    { phrase: "anxiety", weight: 2 },
    { phrase: "overwhelmed", weight: 2 },
    { phrase: "pressure", weight: 1.5 },
    { phrase: "feeling low", weight: 1.5 },
    { phrase: "sad", weight: 1 },
    { phrase: "alone", weight: 1.5 },
    { phrase: "ignored", weight: 1 },
    { phrase: "rejected", weight: 1.5 },
    { phrase: "empty", weight: 1.5 },
  ];

  const allPatterns = [...veryHighRiskPatterns, ...highRiskPatterns, ...mediumRiskPatterns];

  for (const item of allPatterns) {
    if (lowercaseText.includes(item.phrase)) {
      score += item.weight;
    }
  }

  // Cap at 10
  score = Math.min(score, 10);

  const priority = score > 7.5 ? "high" : "normal";

  return {
    riskScore: Number(score.toFixed(1)),
    priority,
  };
}
