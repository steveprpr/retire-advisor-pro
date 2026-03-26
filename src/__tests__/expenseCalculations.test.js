/**
 * expenseCalculations.test.js
 *
 * Verifies expense inflation, COL multipliers, and total expense computation.
 */

import { describe, it, expect } from 'vitest'
import {
  inflateExpense,
  getLocationCOLMultiplier,
  computeExpenseTotals,
} from '../utils/expenseCalculations.js'

// ── Expense Inflation ─────────────────────────────────────────────────────────
describe('inflateExpense', () => {
  it('inflates a monthly expense by compound rate', () => {
    // $1,000/mo at 2.5% for 10 years
    const expected = 1000 * Math.pow(1.025, 10)
    expect(inflateExpense(1000, 0.025, 10)).toBeCloseTo(expected, 2)
  })

  it('returns 0 for zero monthly amount', () => {
    expect(inflateExpense(0, 0.025, 10)).toBe(0)
  })

  it('returns base amount for 0 years', () => {
    expect(inflateExpense(1000, 0.025, 0)).toBe(1000)
  })

  it('returns 0 for negative amount', () => {
    expect(inflateExpense(-500, 0.025, 10)).toBe(0)
  })
})

// ── COL Multiplier ────────────────────────────────────────────────────────────
describe('getLocationCOLMultiplier', () => {
  it('returns 1.0 for suburban baseline (no state)', () => {
    const multiplier = getLocationCOLMultiplier('us', '', null, 'suburban')
    expect(multiplier).toBe(1.0)
  })

  it('adjusts upward for urban living', () => {
    const suburban = getLocationCOLMultiplier('us', '', null, 'suburban')
    const urban = getLocationCOLMultiplier('us', '', null, 'urban')
    expect(urban).toBeGreaterThan(suburban)
  })

  it('adjusts downward for rural living', () => {
    const suburban = getLocationCOLMultiplier('us', '', null, 'suburban')
    const rural = getLocationCOLMultiplier('us', '', null, 'rural')
    expect(rural).toBeLessThan(suburban)
  })

  it('applies state COL index for US locations', () => {
    // CA has a high COL index; MS has a low one
    const ca = getLocationCOLMultiplier('us', 'CA', null, 'suburban')
    const ms = getLocationCOLMultiplier('us', 'MS', null, 'suburban')
    expect(ca).toBeGreaterThan(ms)
  })
})

// ── Total Expense Computation ─────────────────────────────────────────────────
describe('computeExpenseTotals', () => {
  const sampleExpenses = {
    mortgageRent: 1500,
    propertyTax: 300,
    homeInsurance: 150,
    hoaFees: 0,
    homeMaintenance: 200,
    utilities: 350,
    internetPhone: 150,
    security: 0,
    groceries: 600,
    diningOut: 300,
    coffeeShops: 40,
    foodDelivery: 0,
    carPayment: 0,
    carInsurance: 150,
    gas: 150,
    vehicleMaintenance: 100,
    registration: 25,
    rideshare: 0,
    publicTransit: 0,
    healthInsurance: 500,
    dental: 35,
    vision: 20,
    outOfPocket: 150,
    gym: 50,
    mentalHealth: 0,
    ltcInsurance: 0,
    domesticTrips: 2,
    domesticTripCost: 2500,
    internationalTrips: 1,
    internationalTripCost: 5000,
    cruiseTrips: 0,
    cruiseCostPerPerson: 0,
    snowbirdMonthly: 0,
    streaming: 50,
    musicPodcasts: 15,
    newsSubscriptions: 20,
    software: 0,
    sportsEvents: 0,
    hobbies: 100,
    clubMemberships: 0,
    clothing: 150,
    haircuts: 40,
    gifts: 100,
    charitableDonations: 100,
    pets: 0,
    booksEducation: 30,
    adultChildSupport: 0,
    grandchildrenActivities: 0,
    plan529Monthly: 0,
    emergencyBuffer: 0,
    unexpectedBuffer: 0,
    miscellaneous: 200,
  }

  it('produces a positive total monthly expense', () => {
    const result = computeExpenseTotals(sampleExpenses, 0.025, 10, 1.0)
    expect(result.totalMonthlyToday).toBeGreaterThan(0)
  })

  it('totalAnnualToday equals totalMonthlyToday × 12', () => {
    const result = computeExpenseTotals(sampleExpenses, 0.025, 10, 1.0)
    expect(result.totalAnnualToday).toBeCloseTo(result.totalMonthlyToday * 12, 1)
  })

  it('inflates expenses correctly over time', () => {
    const result = computeExpenseTotals(sampleExpenses, 0.025, 10, 1.0)
    const expected = inflateExpense(result.totalMonthlyToday, 0.025, 10)
    expect(result.totalMonthlyAtRetirement).toBeCloseTo(expected, 0)
  })

  it('COL multiplier scales total expenses proportionally', () => {
    const base = computeExpenseTotals(sampleExpenses, 0.025, 10, 1.0)
    const higher = computeExpenseTotals(sampleExpenses, 0.025, 10, 1.2)
    expect(higher.totalMonthlyToday).toBeCloseTo(base.totalMonthlyToday * 1.2, 0)
  })

  it('returns zero totals for empty expenses', () => {
    const result = computeExpenseTotals({}, 0.025, 10, 1.0)
    expect(result.totalMonthlyToday).toBe(0)
    expect(result.totalAnnualToday).toBe(0)
  })

  it('housing category sums the right fields', () => {
    const result = computeExpenseTotals(sampleExpenses, 0.025, 0, 1.0)
    // mortgageRent + propertyTax + homeInsurance + homeMaintenance + utilities + internetPhone
    const expected = 1500 + 300 + 150 + 200 + 350 + 150
    expect(result.categories.housing).toBeCloseTo(expected, 0)
  })
})
