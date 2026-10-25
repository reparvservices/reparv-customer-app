export const formatIndianAmount = amount => {
  if (amount === null || amount === undefined || isNaN(amount)) return '';

  const num = Number(amount);

  // Crore
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 1)} Cr`;
  }

  // Lakh
  if (num >= 100000) {
    return `${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)} Lac`;
  }

  // Thousand → show full number (no "Thousand")
  if (num >= 1000) {
    return num.toLocaleString('en-IN');
  }

  return num.toString();
};
