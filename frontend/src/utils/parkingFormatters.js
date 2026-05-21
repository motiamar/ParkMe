// Pure formatting helpers — no React, no state, no side effects.

export function formatDrivingTimeLocalized(minutes, labels) {
  if (minutes < 60) return `${minutes} ${labels.minShort}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} ${labels.hrShort} ${remainingMinutes} ${labels.minShort}`
    : `${hours} ${labels.hrShort}`;
}

export function getLotName(lot, language) {
  return language === 'he' ? lot.nameHe : lot.nameEn;
}

export function getLotAddress(lot, language) {
  return language === 'he' ? lot.addressHe : lot.addressEn;
}
