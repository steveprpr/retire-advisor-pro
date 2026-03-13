// International country data for expat retirement planning
// COL savings are relative to average US living costs
// Visa, healthcare, and currency info as of 2024

export const COUNTRY_COL_DATA = {
  spain: {
    name: 'Spain',
    flag: '🇪🇸',
    colSavingsPct: 0.45,          // ~45% cheaper than US avg
    currency: 'EUR (€)',
    visaType: 'Non-Lucrative Visa (NLV)',
    visaNote: 'Requires passive income ≥ €28,800/yr (individual) or €36,000 (couple). No work allowed.',
    healthcare: 'Excellent public + private system. Private insurance ~€150–300/mo. Public access after residency.',
    nlvIncomeRequirement: 28800,   // EUR/yr
    citizenshipYears: 2,           // fast-track for Ibero-Americans (Puerto Rico)
    standardCitizenshipYears: 10,
    taxNotes: 'Beckham Law (special expat tax regime) may apply first 5 years. Standard income tax otherwise.',
    popularCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Málaga', 'Alicante'],
    avgRentCouple: 1100,           // USD/mo
    avgHealthInsurance: 250,       // USD/mo
    annualFlightsToUS: 1200,       // USD per person round trip
  },
  portugal: {
    name: 'Portugal',
    flag: '🇵🇹',
    colSavingsPct: 0.40,
    currency: 'EUR (€)',
    visaType: 'D7 Passive Income Visa',
    visaNote: 'Requires ~€760/mo passive income. Path to residency and citizenship (5 years).',
    healthcare: 'Good public NHS + excellent private. Private insurance ~€100–250/mo.',
    taxNotes: 'NHR (Non-Habitual Resident) regime: 10% flat tax on foreign pension income for 10 years.',
    popularCities: ['Lisbon', 'Porto', 'Algarve', 'Cascais', 'Óbidos'],
    avgRentCouple: 1200,
    avgHealthInsurance: 200,
    annualFlightsToUS: 1000,
  },
  mexico: {
    name: 'Mexico',
    flag: '🇲🇽',
    colSavingsPct: 0.55,
    currency: 'MXN (but USD widely accepted)',
    visaType: 'Temporal Residente',
    visaNote: 'Requires ~$1,500/mo income. No special retiree visa needed. Permanent residency after 4 years.',
    healthcare: 'Good private care at 15–30% of US costs. IMSS public available with membership.',
    taxNotes: 'No special retiree tax regime. US-Mexico tax treaty applies.',
    popularCities: ['Mexico City', 'Puerto Vallarta', 'San Miguel de Allende', 'Oaxaca', 'Mérida', 'Los Cabos'],
    avgRentCouple: 800,
    avgHealthInsurance: 200,
    annualFlightsToUS: 500,
  },
  costaRica: {
    name: 'Costa Rica',
    flag: '🇨🇷',
    colSavingsPct: 0.35,
    currency: 'CRC (Colón) — USD widely accepted',
    visaType: 'Pensionado Visa',
    visaNote: 'Requires $1,000/mo in guaranteed pension income. Import privileges, tax exemptions.',
    healthcare: 'Excellent CAJA public system + affordable private. Private insurance ~$100–200/mo.',
    taxNotes: 'No tax on foreign-source income. Pensionado visa has special import tax exemptions.',
    popularCities: ['San José', 'Tamarindo', 'Manuel Antonio', 'Arenal', 'Escazú'],
    avgRentCouple: 1000,
    avgHealthInsurance: 150,
    annualFlightsToUS: 600,
  },
  panama: {
    name: 'Panama',
    flag: '🇵🇦',
    colSavingsPct: 0.30,
    currency: 'USD (Balboa pegged 1:1)',
    visaType: 'Pensionado Visa',
    visaNote: 'Requires $1,000/mo pension income. Extensive discounts on goods/services/travel.',
    healthcare: 'Good private care (Joint Commission accredited in Panama City). ~$100–250/mo insurance.',
    taxNotes: 'No tax on foreign-source income. US dollar eliminates currency risk.',
    popularCities: ['Panama City', 'Boquete', 'El Valle', 'Pedasi'],
    avgRentCouple: 1200,
    avgHealthInsurance: 200,
    annualFlightsToUS: 700,
  },
  thailand: {
    name: 'Thailand',
    flag: '🇹🇭',
    colSavingsPct: 0.65,
    currency: 'THB (Thai Baht)',
    visaType: 'LTR Visa (Long-Term Resident) or Retirement Visa (Non-O-A)',
    visaNote: 'LTR: $80K/yr income or $1M assets. Retirement: $65K/yr income or $800K in bank.',
    healthcare: 'World-class private hospitals at 30–50% of US costs. Insurance ~$100–200/mo.',
    taxNotes: 'Thailand has territorial taxation. Foreign income remitted to Thailand may be taxed.',
    popularCities: ['Chiang Mai', 'Bangkok', 'Phuket', 'Koh Samui', 'Hua Hin'],
    avgRentCouple: 600,
    avgHealthInsurance: 150,
    annualFlightsToUS: 2000,
  },
  colombia: {
    name: 'Colombia',
    flag: '🇨🇴',
    colSavingsPct: 0.60,
    currency: 'COP (Colombian Peso)',
    visaType: 'Pensionado Visa (Visa de Pensionado)',
    visaNote: 'Requires ~$750/mo pension income. Renewable annually.',
    healthcare: 'Good private care in major cities. Insurance ~$100–150/mo.',
    taxNotes: 'Foreign income generally not taxed if not remitted to Colombia.',
    popularCities: ['Medellín', 'Cartagena', 'Bogotá', 'Santa Marta', 'Cali'],
    avgRentCouple: 700,
    avgHealthInsurance: 120,
    annualFlightsToUS: 700,
  },
  greece: {
    name: 'Greece',
    flag: '🇬🇷',
    colSavingsPct: 0.40,
    currency: 'EUR (€)',
    visaType: 'Digital Nomad Visa or Non-Dom Tax Regime',
    visaNote: 'Non-Dom regime: €100K/yr flat tax on foreign income (or 7% flat tax in some regions).',
    healthcare: 'EU public healthcare + excellent affordable private. Insurance ~€100–200/mo.',
    taxNotes: '7% flat tax regime for retirees who transfer tax residency from abroad. Very favorable.',
    popularCities: ['Athens', 'Thessaloniki', 'Crete', 'Rhodes', 'Corfu', 'Santorini'],
    avgRentCouple: 800,
    avgHealthInsurance: 150,
    annualFlightsToUS: 1200,
  },
  italy: {
    name: 'Italy',
    flag: '🇮🇹',
    colSavingsPct: 0.35,
    currency: 'EUR (€)',
    visaType: 'Elective Residency Visa',
    visaNote: 'Requires €31,000/yr passive income (or €38,000 couple). Southern Italy 7% flat tax.',
    healthcare: 'SSN universal healthcare. Excellent quality. Private supplements ~€100–200/mo.',
    taxNotes: '7% flat tax on foreign income if settling in qualifying southern Italian towns (population <20K).',
    popularCities: ['Rome', 'Florence', 'Milan', 'Sicily', 'Abruzzo', 'Calabria', 'Sardinia'],
    avgRentCouple: 1100,
    avgHealthInsurance: 150,
    annualFlightsToUS: 1100,
  },
  belize: {
    name: 'Belize',
    flag: '🇧🇿',
    colSavingsPct: 0.45,
    currency: 'BZD (Belize Dollar) — USD pegged 2:1',
    visaType: 'QRP (Qualified Retired Persons Program)',
    visaNote: 'Requires $2,000/mo income from abroad. Import privileges, no tax on foreign income.',
    healthcare: 'Basic public care. Recommend private + medical tourism to Mexico/US.',
    taxNotes: 'No tax on foreign income under QRP. English-speaking country.',
    popularCities: ['Ambergris Caye', 'Placencia', 'Caye Caulker', 'San Ignacio'],
    avgRentCouple: 900,
    avgHealthInsurance: 200,
    annualFlightsToUS: 600,
  },
  malaysia: {
    name: 'Malaysia',
    flag: '🇲🇾',
    colSavingsPct: 0.65,
    currency: 'MYR (Malaysian Ringgit)',
    visaType: 'MM2H (Malaysia My Second Home)',
    visaNote: 'Requires RM40K/mo (~$8,500) income or RM1.5M assets. 10-year renewable.',
    healthcare: 'Excellent private care at 20–40% of US costs. Insurance ~$100–200/mo.',
    taxNotes: 'No capital gains tax. Foreign income not taxed in Malaysia.',
    popularCities: ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Kota Kinabalu', 'Langkawi'],
    avgRentCouple: 700,
    avgHealthInsurance: 120,
    annualFlightsToUS: 1800,
  },
  puertoRico: {
    name: 'Puerto Rico (US Territory)',
    flag: '🇵🇷',
    colSavingsPct: 0.20,
    currency: 'USD',
    visaType: 'US Citizen — no visa required',
    visaNote: 'US territory. Act 22/60 tax incentives for investment income. Social Security eligible.',
    healthcare: 'Medicare eligible. Good private care.',
    taxNotes: 'Act 60 (formerly Act 22): 0% capital gains tax, 4% fixed income tax on new business income.',
    popularCities: ['San Juan', 'Dorado', 'Humacao', 'Rincón'],
    avgRentCouple: 1500,
    avgHealthInsurance: 300,
    annualFlightsToUS: 400,
  },
}

// Countries with fast-track citizenship for Puerto Rican heritage
export const IBEROAMERICAN_FAST_TRACK = {
  spain: { years: 2, standardYears: 10, note: 'Ibero-American heritage qualifies for 2-year naturalization path vs 10-year standard' },
  portugal: { years: 5, standardYears: 10, note: 'Portuguese-speaking country heritage may qualify for 5-year path' },
}

export const COUNTRY_LIST = Object.entries(COUNTRY_COL_DATA).map(([key, data]) => ({
  key,
  name: data.name,
  flag: data.flag,
}))

export function getCountryData(key) {
  return COUNTRY_COL_DATA[key] || null
}

export function getCountryByName(searchName) {
  const lower = searchName.toLowerCase()
  return Object.entries(COUNTRY_COL_DATA).find(([key, data]) =>
    data.name.toLowerCase().includes(lower) || key.toLowerCase().includes(lower)
  )
}
