export const WELCOME_MESSAGE =
  'Namaste! Main aapka Reparv AI Advisor hoon. Properties, budget ya site visit — kuch bhi pooch sakte ho.';

export function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function stripMarkdown(text = '') {
  return String(text)
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getDisplayText(text, properties) {
  if (!properties?.length) {
    return stripMarkdown(text);
  }

  const cleaned = stripMarkdown(text);
  const isVerbose =
    cleaned.length > 200 ||
    /!\[|\[[^\]]+]\(https?:\/\//i.test(text) ||
    /^\s*\d+\.\s/m.test(text);

  if (!isVerbose) {
    return cleaned;
  }

  const loc = properties[0]?.location || '';
  const city = loc.split(',').pop()?.trim() || 'Yahan';
  const count = properties.length;
  const noun = count === 1 ? 'property' : `${count} properties`;

  return `${city} mein ${noun} mili hain — neeche cards check kariye. Kisi pe details ya site visit chahiye?`;
}

export function extractSeoSlug(property) {
  if (property?.seoSlug) {
    return property.seoSlug;
  }
  const url = property?.url;
  if (!url) {
    return null;
  }
  const match = String(url).match(/property-info\/([^/?#]+)/i);
  return match?.[1] || null;
}
