/**
 * Validates whether a question meets minimum quality standards.
 * Filters out incomplete, nonsensical, or malformed questions.
 */

const MIN_QUESTION_LENGTH = 25;
const MIN_WORD_COUNT = 5;
const MIN_OPTION_LENGTH = 1;

// A question must have a verb, punctuation, or recognizable structure
const QUESTION_PATTERNS = [
  /\?/, // has question mark
  /which|what|who|where|when|how|why|choose|select|identify|find|determine|calculate|solve|evaluate|explain|define|state|list|name|give|mention|describe|discuss|compare|contrast|differentiate|distinguish|outline|summarize|analyse|analyze|interpret|justify|assess|examine|the .+ of|is (?:a|an|the)|are (?:the|a)|in .+ the|one of/i,
  /\b(?:not|except|correct|true|false|best|most|least|following|above|below|opposite|same|similar|synonym|antonym|meaning|means)\b/i,
  /\b\d+\s*[\+\-\×\÷\*\/\=\<\>]\s*\d+/,  // math expressions
  /_{2,}/, // fill-in-the-blank underscores
];

/**
 * Check if question text looks like a real, complete question
 */
export function isValidQuestion(questionText: string): boolean {
  if (!questionText || typeof questionText !== 'string') return false;
  
  // Strip HTML tags to get actual content length
  const stripped = questionText.replace(/<[^>]*>/g, '').trim();
  
  // Too short to be a real question
  if (stripped.length < MIN_QUESTION_LENGTH) return false;
  
  // Not enough words
  const wordCount = stripped.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < MIN_WORD_COUNT) return false;
  
  // Check if it matches at least one question-like pattern
  const hasQuestionPattern = QUESTION_PATTERNS.some(p => p.test(stripped));
  
  // If no question pattern found, it's likely incomplete/garbage
  if (!hasQuestionPattern) return false;
  
  return true;
}

/**
 * Check if options are valid (not all identical, not placeholder garbage)
 */
export function hasValidOptions(options: string[]): boolean {
  if (!options || options.length < 4) return false;
  
  // All options must have some content
  const validOptions = options.filter(o => o && o.trim().length >= MIN_OPTION_LENGTH);
  if (validOptions.length < 4) return false;
  
  // Options shouldn't all be identical
  const unique = new Set(validOptions.map(o => o.trim().toLowerCase()));
  if (unique.size < 2) return false;
  
  return true;
}

/**
 * Full question quality check - combines question text + options validation
 */
export function isQualityQuestion(
  questionText: string, 
  options: string[]
): boolean {
  return isValidQuestion(questionText) && hasValidOptions(options);
}

/**
 * Filter an array of questions with { text/question_text, options/option_a..d } format
 * Returns only quality questions
 */
export function filterQualityQuestions<T extends Record<string, any>>(questions: T[]): T[] {
  return questions.filter(q => {
    const text = q.text || q.question_text || '';
    const options = q.options || [q.option_a, q.option_b, q.option_c, q.option_d];
    return isQualityQuestion(text, options);
  });
}
