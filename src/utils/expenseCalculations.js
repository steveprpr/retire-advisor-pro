// Expense calculation utilities

import { STATE_TAX_DATA } from '../data/stateTaxData.js'
import { COUNTRY_COL_DATA } from '../data/countryColData.js'

// ── Inflate expense to retirement year ───────────────────────────────────────
export function inflateExpense(monthlyAmount, inflationRate, yearsToRetirement) {
  if (!monthlyAmount || monthlyAmount <= 0) return 0
  return monthlyAmount * Math.pow(1 + inflationRate, yearsToRetirement)
}

// ── Budget preset templates (monthly, today's dollars) ───────────────────────
export const BUDGET_PRESETS = {
  modestUS: {
    label: 'Modest US Retirement',
    emoji: '🏘️',
    monthlyTarget: 3500,
    housing: 1400,
    food: 500,
    transportation: 400,
    healthcare: 600,
    travel: 200,
    entertainment: 150,
    personal: 150,
    other: 100,
  },
  comfortableUS: {
    label: 'Comfortable US Retirement',
    emoji: '🏡',
    monthlyTarget: 6000,
    housing: 2000,
    food: 800,
    transportation: 600,
    healthcare: 800,
    travel: 600,
    entertainment: 400,
    personal: 400,
    other: 400,
  },
  activeUS: {
    label: 'Active US Retirement',
    emoji: '🌟',
    monthlyTarget: 9000,
    housing: 2500,
    food: 1200,
    transportation: 800,
    healthcare: 1000,
    travel: 1500,
    entertainment: 800,
    personal: 700,
    other: 500,
  },
  budgetExpat: {
    label: 'Budget Expat',
    emoji: '🌍',
    monthlyTarget: 2500,
    housing: 800,
    food: 400,
    transportation: 200,
    healthcare: 300,
    travel: 300,
    entertainment: 200,
    personal: 150,
    other: 150,
  },
  comfortableExpat: {
    label: 'Comfortable Expat',
    emoji: '🌴',
    monthlyTarget: 4000,
    housing: 1200,
    food: 600,
    transportation: 300,
    healthcare: 500,
    travel: 600,
    entertainment: 400,
    personal: 200,
    other: 200,
  },
}

// ── National average expense recommendations ──────────────────────────────────
export const EXPENSE_AVERAGES = {
  // Housing
  mortgageOwn: 1800,
  mortgageRent: 1650,
  propertyTax: 300,
  homeInsurance: 150,
  hoaFees: 200,
  homeMaintenance: 250,
  utilities: 350,
  internetPhone: 175,
  security: 45,

  // Food
  groceriesCouple: 600,
  groceriesSingle: 350,
  diningOut_1x: 65,
  coffeeShops: 40,
  foodDelivery: 60,

  // Transportation
  carInsurance: 150,
  gas: 150,
  vehicleMaintenance: 100,
  registration: 30,
  rideshare: 50,
  publicTransit: 80,

  // Healthcare (retiree)
  fehbSelf: 350,
  fehbSelfPlus1: 650,
  fehbFamily: 800,
  medicareParts: 335,   // Part B + supplement approx
  dentalInsurance: 35,
  visionInsurance: 20,
  outOfPocket: 150,
  gym: 50,
  ltcInsurance: 150,

  // Travel
  domesticTrip: 2500,
  internationalTrip: 8000,
  cruisePerPerson: 3500,

  // Entertainment
  streaming: 60,
  musicPodcasts: 25,
  newsSubscriptions: 20,
  softwareCloud: 20,
  sportsEvents: 50,
  hobbies: 150,
  clubMemberships: 0,

  // Personal
  clothingPersonalCare: 200,
  haircuts: 50,
  gifts: 150,
  charitableDonations: 100,
  petsDog: 150,
  petsCat: 75,
  petsNone: 0,
  booksEducation: 30,

  // Family
  grandchildrenActivities: 100,

  // Misc
  emergencyBuffer: 200,
  miscellaneous: 200,
}

// ── State-adjusted property tax ────────────────────────────────────────────────
export function getStatePropertyTaxMonthly(homeValue, stateCode) {
  const stateData = STATE_TAX_DATA[stateCode]
  if (!stateData || !homeValue) return 300  // national avg
  return (homeValue * stateData.propertyTaxRate) / 12
}

// ── COL multiplier for retirement location ─────────────────────────────────────
export function getLocationCOLMultiplier(locationType, stateCode, countryKey, urbanRural = 'suburban') {
  let baseMultiplier = 1.0

  if (locationType === 'us' && stateCode) {
    const stateData = STATE_TAX_DATA[stateCode]
    if (stateData) {
      baseMultiplier = stateData.colIndex / 100
    }
  } else if (locationType === 'international' && countryKey) {
    const countryData = COUNTRY_COL_DATA[countryKey]
    if (countryData) {
      baseMultiplier = 1 - countryData.colSavingsPct
    }
  }

  // Urban/rural adjustment
  const urbanAdjustment = { urban: 1.15, suburban: 1.0, rural: 0.85 }
  return baseMultiplier * (urbanAdjustment[urbanRural] || 1.0)
}

// ── Total expense summary ──────────────────────────────────────────────────────
export function computeExpenseTotals(expenses, inflationRate, yearsToRetirement, colMultiplier = 1.0) {
  const categories = {
    housing: 0,
    foodDining: 0,
    transportation: 0,
    healthcare: 0,
    travel: 0,
    entertainment: 0,
    personal: 0,
    family: 0,
    international: 0,
    savings: 0,
    other: 0,
  }

  // Sum up provided expense fields by category
  const housing = [
    expenses.mortgageRent, expenses.propertyTax, expenses.homeInsurance,
    expenses.hoaFees, expenses.homeMaintenance, expenses.utilities,
    expenses.internetPhone, expenses.security
  ].reduce((a, b) => a + (b || 0), 0)

  const foodDining = [
    expenses.groceries, expenses.diningOut, expenses.coffeeShops, expenses.foodDelivery
  ].reduce((a, b) => a + (b || 0), 0)

  const transportation = [
    expenses.carPayment, expenses.carInsurance, expenses.gas,
    expenses.vehicleMaintenance, expenses.registration, expenses.rideshare, expenses.publicTransit
  ].reduce((a, b) => a + (b || 0), 0)

  const healthcare = [
    expenses.healthInsurance, expenses.dental, expenses.vision,
    expenses.outOfPocket, expenses.gym, expenses.mentalHealth, expenses.ltcInsurance
  ].reduce((a, b) => a + (b || 0), 0)

  const travelAnnual = (expenses.domesticTrips || 0) * (expenses.domesticTripCost || 0) / 12
    + (expenses.internationalTrips || 0) * (expenses.internationalTripCost || 0) / 12
    + (expenses.cruiseTrips || 0) * (expenses.cruiseCostPerPerson || 0) / 12
    + (expenses.snowbirdMonthly || 0)

  const entertainment = [
    expenses.streaming, expenses.musicPodcasts, expenses.newsSubscriptions,
    expenses.software, expenses.sportsEvents, expenses.hobbies, expenses.clubMemberships
  ].reduce((a, b) => a + (b || 0), 0)

  const personal = [
    expenses.clothing, expenses.haircuts, expenses.gifts,
    expenses.charitableDonations, expenses.pets, expenses.booksEducation
  ].reduce((a, b) => a + (b || 0), 0)

  const family = [
    expenses.adultChildSupport, expenses.grandchildrenActivities, expenses.plan529Monthly
  ].reduce((a, b) => a + (b || 0), 0)

  const international = [
    expenses.expatHousing, expenses.expatHealthInsurance, expenses.languageLessons,
    (expenses.annualFlightsHome || 0) / 12,
    (expenses.expatCPA || 0) / 12,
    (expenses.visaRenewal || 0) / 12,
    expenses.localTransportation
  ].reduce((a, b) => a + (b || 0), 0)

  const other = [
    expenses.emergencyBuffer, expenses.unexpectedBuffer, expenses.miscellaneous
  ].reduce((a, b) => a + (b || 0), 0)

  const totalMonthlyToday = (housing + foodDining + transportation + healthcare + travelAnnual + entertainment + personal + family + international + other) * colMultiplier
  const totalAnnualToday = totalMonthlyToday * 12

  const totalMonthlyAtRetirement = inflateExpense(totalMonthlyToday, inflationRate, yearsToRetirement)
  const totalAnnualAtRetirement = totalMonthlyAtRetirement * 12

  return {
    categories: {
      housing: housing * colMultiplier,
      foodDining: foodDining * colMultiplier,
      transportation: transportation * colMultiplier,
      healthcare: healthcare * colMultiplier,
      travel: travelAnnual * colMultiplier,
      entertainment: entertainment * colMultiplier,
      personal: personal * colMultiplier,
      family: family * colMultiplier,
      international: international * colMultiplier,
      other: other * colMultiplier,
    },
    totalMonthlyToday,
    totalAnnualToday,
    totalMonthlyAtRetirement,
    totalAnnualAtRetirement,
  }
}
