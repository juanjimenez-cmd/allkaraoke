const pitchQualityReferencePoints = [
  [0, 1],
  [20, 0.97],
  [40, 0.9],
  [60, 0.78],
  [80, 0.6],
  [100, 0.4],
  [150, 0.1],
  [200, 0],
] as const;

export default function calculatePitchQuality(cents: number): number {
  if (!Number.isFinite(cents)) return 0;

  const absoluteCents = Math.abs(cents);
  if (absoluteCents >= 200) return 0;

  for (let i = 1; i < pitchQualityReferencePoints.length; i++) {
    const [upperCents, upperQuality] = pitchQualityReferencePoints[i];
    if (absoluteCents > upperCents) continue;
    if (absoluteCents === upperCents) return upperQuality;

    const [lowerCents, lowerQuality] = pitchQualityReferencePoints[i - 1];
    const progress = (absoluteCents - lowerCents) / (upperCents - lowerCents);

    return lowerQuality + (upperQuality - lowerQuality) * progress;
  }

  return 0;
}
