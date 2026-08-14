// Widmark BAC formula
// Profile: 75 kg male, Widmark ratio r = 0.68
// 1 standard unit = 10g pure alcohol (Dutch/international)
// Elimination: 0.015% BAC per hour (constant, linear)

const WEIGHT_KG = 75;
const WIDMARK_R = 0.68;
const ELIMINATION_RATE = 0.015; // % per hour
const GRAMS_PER_UNIT = 10;

// Food effect window: drinks from 1h before to 2h after a meal
// get 35% reduced absorption (food slows gastric emptying)
const MEAL_WINDOW_BEFORE = 1 * 3_600_000; // 1 hour in ms
const MEAL_WINDOW_AFTER = 2 * 3_600_000;  // 2 hours in ms

/**
 * Check if a drink falls within the absorption window of a meal.
 */
function isDrinkNearMeal(drinkTimestamp, mealTimestamp) {
  if (!mealTimestamp) return false;
  return drinkTimestamp >= mealTimestamp - MEAL_WINDOW_BEFORE
      && drinkTimestamp <= mealTimestamp + MEAL_WINDOW_AFTER;
}

/**
 * Calculate current BAC in % (e.g. 0.08 means 0.08%).
 * @param {Array} drinks - [{ units, timestamp }, ...]
 * @param {number|null} mealTime - timestamp of meal, or null
 */
export function calculateBAC(drinks, mealTime) {
  if (!drinks.length) return 0;

  const firstDrink = Math.min(...drinks.map(d => d.timestamp));
  const hoursElapsed = (Date.now() - firstDrink) / 3_600_000;

  // Sum grams per drink, applying -35% only to drinks near the meal
  const grams = drinks.reduce((sum, d) => {
    const raw = d.units * GRAMS_PER_UNIT;
    return sum + raw * (isDrinkNearMeal(d.timestamp, mealTime) ? 0.65 : 1);
  }, 0);

  // Widmark: BAC = grams / (bodyweight_g × r) − elimination
  // bodyweight in grams = kg × 1000, but we use kg × 10 to get % directly
  const bac = (grams / (WEIGHT_KG * WIDMARK_R * 10)) - (ELIMINATION_RATE * hoursElapsed);

  return Math.max(0, bac);
}

/**
 * Returns the BAC zone object for a given BAC value.
 */
export function getZone(bac, limit) {
  if (bac < 0.03) return { label: 'Sober — all good', color: '#1D9E75', level: 0 };
  if (bac < limit * 0.75) return { label: 'Light buzz — pace yourself', color: '#BA7517', level: 1 };
  if (bac < limit) return { label: 'Getting there — slow down', color: '#D85A30', level: 2 };
  return { label: 'At your limit — stop and drink water', color: '#A32D2D', level: 3 };
}

/**
 * Format BAC to 3 decimal places as a string like "0.042%".
 */
export function formatBAC(bac) {
  return bac.toFixed(3) + '%';
}

/**
 * Hours until next drink is advisable.
 * Target: wait until BAC drops to (limit - 0.02) before next drink.
 */
export function hoursUntilNextDrink(bac, limit) {
  if (bac <= limit - 0.02) return 0;
  return (bac - (limit - 0.02)) / ELIMINATION_RATE;
}

/**
 * Hours until completely sober (BAC = 0).
 */
export function hoursUntilSober(bac) {
  if (bac <= 0) return 0;
  return bac / ELIMINATION_RATE;
}
