import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

/**
 * Calculates high-precision Islamic prayer times 100% offline using the Adhan library
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {Date} date - Target date (defaults to now)
 * @param {string} methodName - Egyptian, UmmAlQura, MuslimWorldLeague, etc.
 */
export function getPrayerSchedule(latitude, longitude, date = new Date(), methodName = 'Egyptian') {
  const coords = new Coordinates(latitude, longitude);

  let params;
  switch (methodName) {
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Egyptian':
    default:
      params = CalculationMethod.Egyptian();
      break;
  }

  const times = new PrayerTimes(coords, date, params);
  const nextPrayerName = times.nextPrayer();
  const nextPrayerDate = times.timeForPrayer(nextPrayerName);

  return {
    times: {
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      maghrib: times.maghrib,
      isha: times.isha
    },
    next: {
      prayer: nextPrayerName,
      time: nextPrayerDate
    }
  };
}
