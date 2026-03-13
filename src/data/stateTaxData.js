// State tax data for all 50 states + DC
// Sources: Tax Foundation 2024, MERIC Cost of Living Index 2024
// Fields:
//   incomeTaxRate   — top marginal rate (simplified; flat for planning purposes)
//   colIndex        — MERIC cost-of-living index (100 = national avg)
//   propertyTaxRate — average effective property tax rate
//   ssTaxed         — whether Social Security income is taxed by the state
//   pensionExempt   — whether federal/state pension income is fully exempt
//   pensionExemptNote — brief explanation of pension exemption rules

export const STATE_TAX_DATA = {
  AL: { name: 'Alabama',        incomeTaxRate: 0.05,   colIndex: 87,  propertyTaxRate: 0.0042, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'Federal and state pensions fully exempt' },
  AK: { name: 'Alaska',         incomeTaxRate: 0,      colIndex: 128, propertyTaxRate: 0.0106, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  AZ: { name: 'Arizona',        incomeTaxRate: 0.025,  colIndex: 102, propertyTaxRate: 0.0059, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Some federal pension exemptions apply' },
  AR: { name: 'Arkansas',       incomeTaxRate: 0.047,  colIndex: 85,  propertyTaxRate: 0.0063, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Partial exemption up to $6,000/yr' },
  CA: { name: 'California',     incomeTaxRate: 0.133,  colIndex: 142, propertyTaxRate: 0.0074, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'No pension exemption; SS not taxed' },
  CO: { name: 'Colorado',       incomeTaxRate: 0.044,  colIndex: 105, propertyTaxRate: 0.0052, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $24K pension exclusion (age 65+)' },
  CT: { name: 'Connecticut',    incomeTaxRate: 0.069,  colIndex: 120, propertyTaxRate: 0.0191, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'Federal pension partially exempt' },
  DE: { name: 'Delaware',       incomeTaxRate: 0.066,  colIndex: 101, propertyTaxRate: 0.0058, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $12,500 pension exclusion (age 60+)' },
  FL: { name: 'Florida',        incomeTaxRate: 0,      colIndex: 103, propertyTaxRate: 0.0089, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  GA: { name: 'Georgia',        incomeTaxRate: 0.055,  colIndex: 91,  propertyTaxRate: 0.0091, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $65K retirement exclusion (age 62+)' },
  HI: { name: 'Hawaii',         incomeTaxRate: 0.11,   colIndex: 196, propertyTaxRate: 0.0031, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'All public pensions exempt' },
  ID: { name: 'Idaho',          incomeTaxRate: 0.058,  colIndex: 95,  propertyTaxRate: 0.0060, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Partial deduction available' },
  IL: { name: 'Illinois',       incomeTaxRate: 0.0495, colIndex: 94,  propertyTaxRate: 0.0208, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'All retirement income exempt' },
  IN: { name: 'Indiana',        incomeTaxRate: 0.031,  colIndex: 88,  propertyTaxRate: 0.0081, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Partial deduction for government pensions' },
  IA: { name: 'Iowa',           incomeTaxRate: 0.057,  colIndex: 90,  propertyTaxRate: 0.0154, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Retirement income exempt for age 55+' },
  KS: { name: 'Kansas',         incomeTaxRate: 0.057,  colIndex: 87,  propertyTaxRate: 0.0139, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'Federal pension subject to state tax' },
  KY: { name: 'Kentucky',       incomeTaxRate: 0.045,  colIndex: 87,  propertyTaxRate: 0.0083, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $41,110 pension exclusion' },
  LA: { name: 'Louisiana',      incomeTaxRate: 0.03,   colIndex: 92,  propertyTaxRate: 0.0055, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Federal employee pension excluded' },
  ME: { name: 'Maine',          incomeTaxRate: 0.075,  colIndex: 110, propertyTaxRate: 0.0115, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $10K pension deduction' },
  MD: { name: 'Maryland',       incomeTaxRate: 0.0575, colIndex: 113, propertyTaxRate: 0.0099, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $34,300 exclusion (age 65+)' },
  MA: { name: 'Massachusetts',  incomeTaxRate: 0.05,   colIndex: 131, propertyTaxRate: 0.0114, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'No federal pension exemption' },
  MI: { name: 'Michigan',       incomeTaxRate: 0.0425, colIndex: 90,  propertyTaxRate: 0.0148, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Phasing out exemption; depends on birth year' },
  MN: { name: 'Minnesota',      incomeTaxRate: 0.0985, colIndex: 99,  propertyTaxRate: 0.0110, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'All retirement income taxed' },
  MS: { name: 'Mississippi',    incomeTaxRate: 0.047,  colIndex: 84,  propertyTaxRate: 0.0063, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'All retirement income exempt' },
  MO: { name: 'Missouri',       incomeTaxRate: 0.048,  colIndex: 89,  propertyTaxRate: 0.0098, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $6K public pension deduction' },
  MT: { name: 'Montana',        incomeTaxRate: 0.069,  colIndex: 100, propertyTaxRate: 0.0073, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'Partial SS exemption; pension taxed' },
  NE: { name: 'Nebraska',       incomeTaxRate: 0.068,  colIndex: 92,  propertyTaxRate: 0.0148, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'Phasing out SS tax by 2025' },
  NV: { name: 'Nevada',         incomeTaxRate: 0,      colIndex: 107, propertyTaxRate: 0.0055, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  NH: { name: 'New Hampshire',  incomeTaxRate: 0,      colIndex: 118, propertyTaxRate: 0.0208, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No income tax on wages/retirement (interest & div tax eliminated 2025)' },
  NJ: { name: 'New Jersey',     incomeTaxRate: 0.1075, colIndex: 120, propertyTaxRate: 0.0243, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $100K exclusion (income < $150K)' },
  NM: { name: 'New Mexico',     incomeTaxRate: 0.059,  colIndex: 92,  propertyTaxRate: 0.0077, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $8K SS exclusion' },
  NY: { name: 'New York',       incomeTaxRate: 0.109,  colIndex: 139, propertyTaxRate: 0.0162, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Government pensions fully exempt' },
  NC: { name: 'North Carolina', incomeTaxRate: 0.045,  colIndex: 94,  propertyTaxRate: 0.0077, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Federal pension partially exempt' },
  ND: { name: 'North Dakota',   incomeTaxRate: 0.025,  colIndex: 94,  propertyTaxRate: 0.0100, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Small deduction available' },
  OH: { name: 'Ohio',           incomeTaxRate: 0.035,  colIndex: 90,  propertyTaxRate: 0.0152, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Small retirement income credit' },
  OK: { name: 'Oklahoma',       incomeTaxRate: 0.0475, colIndex: 88,  propertyTaxRate: 0.0087, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $10K pension deduction' },
  OR: { name: 'Oregon',         incomeTaxRate: 0.099,  colIndex: 109, propertyTaxRate: 0.0093, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Federal pension subtraction phasing out' },
  PA: { name: 'Pennsylvania',   incomeTaxRate: 0.0307, colIndex: 100, propertyTaxRate: 0.0153, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'All retirement income (pension, SS, IRA) exempt' },
  RI: { name: 'Rhode Island',   incomeTaxRate: 0.0599, colIndex: 118, propertyTaxRate: 0.0150, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Small exemption if below income threshold' },
  SC: { name: 'South Carolina', incomeTaxRate: 0.064,  colIndex: 94,  propertyTaxRate: 0.0056, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $15K retirement deduction (age 65+)' },
  SD: { name: 'South Dakota',   incomeTaxRate: 0,      colIndex: 93,  propertyTaxRate: 0.0115, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  TN: { name: 'Tennessee',      incomeTaxRate: 0,      colIndex: 91,  propertyTaxRate: 0.0066, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax on wages/retirement' },
  TX: { name: 'Texas',          incomeTaxRate: 0,      colIndex: 95,  propertyTaxRate: 0.0160, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  UT: { name: 'Utah',           incomeTaxRate: 0.0465, colIndex: 99,  propertyTaxRate: 0.0055, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'Small retirement credit available' },
  VT: { name: 'Vermont',        incomeTaxRate: 0.0875, colIndex: 111, propertyTaxRate: 0.0181, ssTaxed: true,  pensionExempt: false, pensionExemptNote: 'SS taxed below income threshold' },
  VA: { name: 'Virginia',       incomeTaxRate: 0.0575, colIndex: 108, propertyTaxRate: 0.0082, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Up to $12K age deduction (age 65+)' },
  WA: { name: 'Washington',     incomeTaxRate: 0,      colIndex: 118, propertyTaxRate: 0.0086, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  WV: { name: 'West Virginia',  incomeTaxRate: 0.065,  colIndex: 82,  propertyTaxRate: 0.0059, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Phasing out SS and pension taxes' },
  WI: { name: 'Wisconsin',      incomeTaxRate: 0.0765, colIndex: 95,  propertyTaxRate: 0.0163, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'Federal pension partially exempt' },
  WY: { name: 'Wyoming',        incomeTaxRate: 0,      colIndex: 94,  propertyTaxRate: 0.0059, ssTaxed: false, pensionExempt: true,  pensionExemptNote: 'No state income tax' },
  DC: { name: 'Washington DC',  incomeTaxRate: 0.085,  colIndex: 157, propertyTaxRate: 0.0056, ssTaxed: false, pensionExempt: false, pensionExemptNote: 'No special pension exemption' },
}

export const STATE_LIST = Object.entries(STATE_TAX_DATA).map(([code, data]) => ({
  code,
  name: data.name,
})).sort((a, b) => a.name.localeCompare(b.name))

export function getStateTaxInfo(stateCode) {
  return STATE_TAX_DATA[stateCode] || null
}

export function getStateDisplayInfo(stateCode) {
  const data = STATE_TAX_DATA[stateCode]
  if (!data) return null
  const taxStr = data.incomeTaxRate === 0 ? 'No state income tax' : `${(data.incomeTaxRate * 100).toFixed(2)}% top marginal rate`
  return `${data.name}: ${taxStr}. COL index: ${data.colIndex}. ${data.pensionExemptNote}.`
}
