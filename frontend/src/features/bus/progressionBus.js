const DIX_MINUTES = 10 * 60 * 1000

export default function progressionBus(depart, arrivee, maintenant) {
  if (maintenant < depart) {
    return Math.max(0, 0.12 * (1 - (depart - maintenant) / DIX_MINUTES))
  }
  if (maintenant >= arrivee) return 0.88
  return 0.12 + 0.76 * ((maintenant - depart) / (arrivee - depart))
}
