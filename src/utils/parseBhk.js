// utils/parseBhk.js

export function parseBhkList(rawList = []) {
  const seen = new Set();
  const result = [];

  // Join all fragments first to handle split arrays like:
  // ["Corner Plot"  +  "Road Facing Plot"  +  "Park Facing Plot]"
  let joinedFragments = [];
  let buffer = '';

  for (const raw of rawList) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed || trimmed === ' ') continue;

    // Detect if it's a fragment of a split JSON array
    const startsArray = trimmed.startsWith('[');
    const endsArray = trimmed.endsWith(']');

    if (startsArray && endsArray) {
      // Complete array string like: "[\"1 BHK\"]"
      joinedFragments.push(trimmed);
    } else if (startsArray) {
      // Start of a split array
      buffer = trimmed;
    } else if (buffer && endsArray) {
      // End of a split array
      buffer += ',' + trimmed;
      joinedFragments.push(buffer);
      buffer = '';
    } else if (buffer) {
      // Middle fragment
      buffer += ',' + trimmed;
    } else {
      // Plain string value
      joinedFragments.push(trimmed);
    }
  }

  // Parse each joined entry
  for (const entry of joinedFragments) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('[')) {
      // Try to parse as JSON array
      try {
        // Fix malformed quotes if needed
        const fixed = trimmed
          .replace(/\\"/g, '"') // unescape \"
          .replace(/'/g, '"'); // normalize single quotes
        const parsed = JSON.parse(fixed);
        if (Array.isArray(parsed)) {
          for (const val of parsed) {
            const clean = String(val).trim();
            if (clean && !seen.has(clean)) {
              seen.add(clean);
              result.push(clean);
            }
          }
        }
      } catch {
        // JSON parse failed — strip brackets and split by comma
        const stripped = trimmed
          .replace(/^\[/, '')
          .replace(/\]$/, '')
          .replace(/\\?"/g, '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        for (const val of stripped) {
          if (!seen.has(val)) {
            seen.add(val);
            result.push(val);
          }
        }
      }
    } else {
      // Plain string — strip any stray quotes/brackets
      const clean = trimmed.replace(/^["'\[]+|["'\]]+$/g, '').trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        result.push(clean);
      }
    }
  }

  return result;
}
