import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { DEFAULT_ASSUMPTIONS } from '../config/defaults.js'

// ── Initial State ────────────────────────────────────────────────────────────

const initialForm = {
  // Step 1 — Personal Profile
  birthYear: 1970,
  birthMonth: null,    // 1–12, optional
  birthDay: null,      // 1–31, optional
  spouseBirthYear: null,
  spouseBirthMonth: null,
  spouseBirthDay: null,
  maritalStatus: 'single',       // 'single' | 'married' | 'divorced' | 'widowed'
  currentStateCode: '',
  employmentType: 'federal',     // 'federal' | 'federal_csrs' | 'military' | 'private' | 'selfemployed' | 'nonprofit' | 'state_local' | 'other'
  specialCategory: 'standard',  // 'standard' | 'leo' | 'firefighter' | 'atc' | 'special_ops'
  lifeExpectancy: 90,
  spouseLifeExpectancy: 92,

  // Step 2 — Service & Salary
  // Federal fields
  agency: '',
  retirementSystem: 'fers',      // 'fers' | 'fers_rae' | 'csrs' | 'csrs_offset'
  serviceStartYear: null,
  credibleServiceYears: 20,
  militaryService: 'none',       // 'none' | 'no_credit' | 'deposit_paid' | 'deposit_progress'
  militaryServiceYears: 0,
  scdYear: null,
  scdMonth: null,   // 1–12, optional
  scdDay: null,     // 1–31, optional
  serviceYearsMode: 'startYear',    // 'startYear' = calculate from SCD | 'manual' = enter directly
  high3Salary: 95000,
  high3Override: false,          // if true, use high3Salary directly; if false, auto-compute
  high3FreezeAge: null,
  currentSalary: 100000,
  salaryGrowthRate: 0.01,
  careerStartAge: 22,            // used for SS AIME estimation
  // Private sector fields
  privateEmployer: '',
  privateSalaryGrowthRate: 0.03,
  yearsUntilRetirement: null,
  hasPension: false,
  pensionMonthlyAmount: 0,
  pensionCOLA: 'none',           // 'yes' | 'partial' | 'none'

  // Step 3 — Savings & Investments
  planType: 'tsp',               // 'tsp' | '401k' | '403b' | '457b' | 'simple_ira' | 'other'
  tspTraditionalBalance: 150000,
  tspRothBalance: 0,
  annualContribTraditional: 23000,
  annualContribRoth: 0,
  employerMatchType: 'percentage', // 'percentage' | 'dollar' | 'fixed' | 'none'
  employerMatchPct: 5,
  employerMatchCapPct: 5,
  employerMatchFixedAmount: 0,
  tspReturnRate: 0.065,
  withdrawalStrategy: 'fourPct', // 'fourPct' | 'dividend' | 'hybrid' | 'unsure'
  dividendETF: 'SCHD',
  customDividendYield: null,
  // Roth IRA
  hasRothIRA: 'no',              // 'both' | 'just_me' | 'planning' | 'no'
  rothIRABalance: 0,
  annualRothIRAContrib: 7000,
  spouseRothIRABalance: 0,
  annualSpouseRothIRAContrib: 7000,
  rothIRAReturnRate: 0.08,
  rothIRARetirementPlan: 'unsure', // 'growth_4pct' | 'dividend' | 'unsure'

  // Roth conversion
  rothConversionStrategy: 'none',   // 'none' | 'fill_12' | 'fill_22' | 'custom'
  rothConversionCustomAmount: 0,
  rothConversionStartAge: null,     // null = defaults to retirementAge
  rothConversionEndAge: 72,

  // Spouse retirement plan
  spouseEmploymentType: '',          // 'federal' | 'private' | 'military' | 'self_employed' | 'nonprofit' | 'none'
  spouseRetirementSystem: 'fers',    // 'fers' | 'fers_rae' | 'csrs' | 'csrs_offset'
  spouseSCDYear: null,
  spouseServiceYearsMode: 'startYear',
  spouseCredibleServiceYears: 0,
  spouseCurrentSalary: 0,
  spouseSalaryGrowthRate: 0.01,
  spouseHigh3Override: false,
  spouseHigh3Salary: 0,
  spouseTargetRetirementAge: 62,
  spouseHasPension: false,
  spousePensionMonthlyAmount: 0,
  spousePensionCOLA: 'none',
  spouseTSPBalance: 0,
  spouseAnnualTSPContrib: 0,
  spouseEmployerMatchCapPct: 5,
  spouseTSPReturnRate: 0.065,
  // Other savings
  brokerageBalance: 0,
  annualBrokerageContrib: 0,
  monthlyBrokerageWithdrawal: 0,    // in retirement
  hsaBalance: 0,
  annualHSAContrib: 0,
  annualHSAMedWithdrawal: 0,        // annual medical spending from HSA in retirement
  otherSavings: 0,
  annualOtherSavingsContrib: 0,
  monthlyOtherSavingsWithdrawal: 0, // in retirement
  cashEmergencyFund: 0,

  // Step 4 — Real Estate & Other Income
  homeValue: 400000,
  mortgageBalance: 250000,
  mortgageRate: 0.04,
  mortgageYearsRemaining: 25,
  homeAppreciationRate: 0.03,
  retirementHomePlan: 'keep',    // 'sell_buy' | 'sell_rent' | 'keep_rent' | 'keep_primary' | 'reverse' | 'undecided'
  newHomeBudget: 0,
  retirementHousingType: 'buy',  // 'buy_outright' | 'buy_mortgage' | 'rent'
  hasRentalProperty: false,
  rentalMonthlyGross: 0,
  rentalAnnualExpenses: 0,
  rentalMortgageBalance: 0,
  rentalPropertyValue: 0,
  // VA disability
  vaRating: 0,
  vaBenefit: 0,                  // auto-populated from table
  vaPursuingUpgrade: 'no',
  vaTargetRating: 0,
  // Other income
  hasPartTimeInRetirement: false,
  partTimeAnnualAmount: 0,
  partTimeYears: 5,
  spouseEmployedAtRetirement: false,
  spouseAnnualIncome: 0,
  spouseYearsUntilRetirement: 0,
  hasExpectedInheritance: false,
  inheritanceAmount: 0,
  inheritanceYear: null,
  otherPensionAnnuity: 0,

  // Step 5 — Goals & Location
  targetRetirementAge: 60,
  retirementFlexibility: 'plus_minus_2', // 'firm' | 'plus_minus_2' | 'exploring'
  fersEarlyOption: 'postpone_62',        // 'take_now' | 'postpone_60' | 'postpone_62' | 'see_all'
  // Social Security
  ssBenefitAtFRA: 0,             // 0 = use estimator; non-zero = user's SSA statement
  ssUseEstimator: true,          // auto-estimate SS from salary when ssBenefitAtFRA is 0
  ssWorkHistory30plus: false,    // 30+ years of SS-covered earnings (WEP exemption)
  nonFederalSSYears: 0,          // years of SS-covered non-federal work
  ssClaimingStrategy: 'fra',     // '62' | 'fra' | '70' | 'unsure'
  spouseSSBenefitAtFRA: 0,
  spouseSSClaimingStrategy: 'fra',
  // Location
  retirementLocationType: 'us',  // 'us' | 'international' | 'undecided'
  retirementStateCode: '',
  retirementCity: '',
  urbanRural: 'suburban',        // 'urban' | 'suburban' | 'rural'
  // International
  retirementCountry: '',
  retirementCountryKey: '',      // key into countryColData
  retirementCountryCurrency: '',
  healthcarePlanAbroad: 'private_expat', // 'private_expat' | 'local_public' | 'medical_tourism' | 'undecided'
  visaType: '',
  customCOLSavingsPct: null,     // for unknown countries

  // Step 6 — Expenses (monthly, today's dollars)
  expenses: {
    // Housing
    mortgageRent: 1500,
    propertyTax: 300,
    homeInsurance: 150,
    hoaFees: 0,
    homeMaintenance: 250,
    utilities: 350,
    internetPhone: 175,
    security: 0,
    // Food
    groceries: 500,
    diningOutFrequency: 4,
    diningOutAvgCost: 65,
    diningOut: 260,              // calculated: frequency × cost
    coffeeShops: 40,
    foodDelivery: 60,
    // Transportation
    carPayment: 0,
    carInsurance: 150,
    gas: 150,
    vehicleMaintenance: 100,
    registration: 30,
    rideshare: 50,
    publicTransit: 0,
    // Healthcare
    healthInsurance: 650,
    dental: 35,
    vision: 20,
    outOfPocket: 150,
    gym: 50,
    mentalHealth: 0,
    ltcInsurance: 0,
    // Travel (annual amounts, stored monthly for running total)
    domesticTrips: 2,
    domesticTripCost: 2500,
    internationalTrips: 1,
    internationalTripCost: 8000,
    cruiseTrips: 0,
    cruiseCostPerPerson: 3500,
    travelStyle: 'moderate',
    snowbirdMonthly: 0,
    // Entertainment
    streaming: 60,
    musicPodcasts: 25,
    newsSubscriptions: 20,
    software: 20,
    sportsEvents: 50,
    hobbies: 150,
    hobbyLabel: '',
    clubMemberships: 0,
    // Personal
    clothing: 200,
    haircuts: 50,
    gifts: 150,
    charitableDonations: 100,
    pets: 0,
    booksEducation: 30,
    // Family support
    adultChildSupport: 0,
    grandchildrenActivities: 0,
    plan529Monthly: 0,
    // International
    expatHousing: 0,
    expatHealthInsurance: 0,
    languageLessons: 0,
    annualFlightsHome: 0,
    expatCPA: 0,
    visaRenewal: 0,
    localTransportation: 0,
    // Misc
    emergencyBuffer: 0,
    unexpectedBuffer: 0,
    miscellaneous: 200,
  },

  // Step 7 — Family & Legacy
  numberOfChildren: 0,
  grandchildrenAges: '',         // comma-separated ages
  plan529ContribPerGrandchild: 0,
  plan529Superfund: 'no',        // 'yes' | 'no' | 'explain'
  targetLegacyPerChild: 0,
  legacyPriority: 'undecided',  // 'primary' | 'secondary' | 'nice_to_have' | 'spend_all' | 'undecided'
  survivorAnnuityElection: 'full', // 'full' | 'partial' | 'none' | 'compare'
  estatePlanningNotes: '',

  // Step 8 — Final Notes
  riskTolerance: 'moderate',    // 'very_conservative' | 'conservative' | 'moderate' | 'growth' | 'aggressive'
  biggestConcern: 'running_out', // 'running_out' | 'healthcare' | 'inflation' | 'market_crash' | 'legacy' | 'confident'
  reportDetailLevel: 'standard', // 'executive' | 'standard' | 'comprehensive'
  specialNotes: '',
  consentGiven: false,
}

const initialAssumptions = {
  // Returns
  tspReturnRate: 0.065,
  rothIRAReturnRate: 0.08,
  brokerageReturnRate: 0.07,
  safeWithdrawalRate: 0.04,
  // Inflation
  inflationRate: 0.025,
  healthcareInflationRate: 0.05,
  collegeInflationRate: 0.05,
  homeAppreciationRate: 0.03,
  // FERS/CSRS
  fersMultiplierStandard: 0.01,
  fersMultiplierEnhanced: 0.011,
  fersEarlyPenaltyRate: 0.05,
  fersCOLARate: 0.025,
  // SS
  ssCOLARate: 0.025,
  ssReductionAt62: 0.25,
  ssDelayedCredit: 0.08,
  wepGpoApplies: false,
  // Tax
  stateTaxOverride: null,
  // Dividend
  schdYield: 0.035,
  schdDividendGrowth: 0.10,
  schdPriceGrowth: 0.08,
  vymYield: 0.030,
  jepYield: 0.075,
  // Portfolio
  portfolioDrawdownReturn: 0.05,
  surplusReinvestmentReturn: 0.05,
  // Monte Carlo
  monteCarloRuns: 500,
  stockVolatility: 0.15,
  inflationVolatility: 0.01,
  // Home
  homeSellingCostsPct: 0.06,
  // VA
  vaCOLARate: 0.025,
  // 529
  plan529GrowthRate: 0.07,
  // Life expectancy overrides (null = use form values)
  lifeExpectancyOverride: null,
  spouseLifeExpectancyOverride: null,
}

const initialUI = {
  currentStep: 0,
  wizardComplete: false,
  activeTab: 'wizard',           // 'wizard' | 'dashboard' | 'report' | 'assumptions'
  assumptionsPanelOpen: false,
  darkMode: false,
  accessGranted: false,
  reportGenerating: false,
  reportContent: '',
  reportModelUsed: '',
  reportError: null,
  reportIsStale: false,
  reportGeneratedAt: null,
  quickInsightLoading: false,
  validationErrors: {},
}

// ── App State (combined) ──────────────────────────────────────────────────────
const initialState = {
  form: initialForm,
  assumptions: initialAssumptions,
  ui: initialUI,
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    // Form actions
    case 'FORM/UPDATE_FIELD':
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
        ui: { ...state.ui, reportIsStale: state.ui.reportGeneratedAt != null },
      }
    case 'FORM/UPDATE_EXPENSE':
      return {
        ...state,
        form: {
          ...state.form,
          expenses: { ...state.form.expenses, [action.field]: action.value },
        },
        ui: { ...state.ui, reportIsStale: state.ui.reportGeneratedAt != null },
      }
    case 'FORM/BATCH_UPDATE':
      return {
        ...state,
        form: { ...state.form, ...action.fields },
        ui: { ...state.ui, reportIsStale: state.ui.reportGeneratedAt != null },
      }
    case 'FORM/RESET':
      return { ...state, form: initialForm, ui: { ...initialUI, accessGranted: state.ui.accessGranted, darkMode: state.ui.darkMode } }
    case 'FORM/IMPORT':
      // Merge imported form with defaults so new fields added after save still have values
      return {
        ...state,
        form: {
          ...initialForm,
          ...action.form,
          expenses: { ...initialForm.expenses, ...(action.form?.expenses || {}) },
        },
        assumptions: action.assumptions
          ? { ...initialAssumptions, ...action.assumptions }
          : state.assumptions,
        ui: {
          ...state.ui,
          currentStep: 0,
          wizardComplete: false,
          reportContent: '',
          reportGeneratedAt: null,
          reportIsStale: false,
        },
      }

    // Assumptions actions
    case 'ASSUMPTIONS/UPDATE':
      return {
        ...state,
        assumptions: { ...state.assumptions, [action.field]: action.value },
        ui: { ...state.ui, reportIsStale: state.ui.reportGeneratedAt != null },
      }
    case 'ASSUMPTIONS/BATCH_UPDATE':
      return {
        ...state,
        assumptions: { ...state.assumptions, ...action.fields },
        ui: { ...state.ui, reportIsStale: state.ui.reportGeneratedAt != null },
      }
    case 'ASSUMPTIONS/RESET':
      return { ...state, assumptions: initialAssumptions }

    // UI actions
    case 'UI/SET_STEP':
      return { ...state, ui: { ...state.ui, currentStep: action.step } }
    case 'UI/SET_WIZARD_COMPLETE':
      return { ...state, ui: { ...state.ui, wizardComplete: true, activeTab: 'dashboard' } }
    case 'UI/REOPEN_WIZARD':
      return { ...state, ui: { ...state.ui, wizardComplete: false, currentStep: 0 } }
    case 'UI/SET_TAB':
      return { ...state, ui: { ...state.ui, activeTab: action.tab } }
    case 'UI/TOGGLE_DARK_MODE':
      return { ...state, ui: { ...state.ui, darkMode: !state.ui.darkMode } }
    case 'UI/TOGGLE_ASSUMPTIONS_PANEL':
      return { ...state, ui: { ...state.ui, assumptionsPanelOpen: !state.ui.assumptionsPanelOpen } }
    case 'UI/SET_ACCESS_GRANTED':
      return { ...state, ui: { ...state.ui, accessGranted: true } }
    case 'UI/SET_VALIDATION_ERRORS':
      return { ...state, ui: { ...state.ui, validationErrors: action.errors } }
    case 'UI/SET_REPORT_GENERATING':
      return { ...state, ui: { ...state.ui, reportGenerating: action.value, reportError: null } }
    case 'UI/SET_REPORT_CONTENT':
      return { ...state, ui: { ...state.ui, reportContent: action.content, reportGenerating: false, reportGeneratedAt: Date.now(), reportIsStale: false } }
    case 'UI/APPEND_REPORT_CONTENT':
      return { ...state, ui: { ...state.ui, reportContent: state.ui.reportContent + action.content } }
    case 'UI/SET_REPORT_MODEL':
      return { ...state, ui: { ...state.ui, reportModelUsed: action.model } }
    case 'UI/SET_REPORT_ERROR':
      return { ...state, ui: { ...state.ui, reportError: action.error, reportGenerating: false } }
    case 'UI/CLEAR_REPORT':
      return { ...state, ui: { ...state.ui, reportContent: '', reportModelUsed: '', reportError: null, reportIsStale: false } }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

// Safe sessionStorage fields (no salary, balances, or PII)
const SESSION_SAFE_FIELDS = [
  'birthYear', 'maritalStatus', 'currentStateCode', 'employmentType',
  'specialCategory', 'puertoRicanHeritage', 'lifeExpectancy', 'spouseLifeExpectancy',
  'retirementSystem', 'credibleServiceYears', 'militaryService', 'militaryServiceYears',
  'serviceStartYear', 'targetRetirementAge', 'retirementFlexibility', 'ssClaimingStrategy',
  'retirementLocationType', 'retirementStateCode', 'urbanRural', 'retirementCountryKey',
  'withdrawalStrategy', 'riskTolerance', 'biggestConcern', 'reportDetailLevel',
  'planType', 'hasRothIRA', 'hasPension', 'hasRentalProperty', 'vaRating',
]

function loadSessionData() {
  try {
    const saved = sessionStorage.getItem('retire_advisor_form')
    if (saved) return JSON.parse(saved)
  } catch {}
  return {}
}

function saveSessionData(form) {
  try {
    const safeData = {}
    SESSION_SAFE_FIELDS.forEach(f => { if (form[f] !== undefined) safeData[f] = form[f] })
    sessionStorage.setItem('retire_advisor_form', JSON.stringify(safeData))
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  // Check access from sessionStorage on init
  const accessGranted = sessionStorage.getItem('retire_advisor_access') === 'granted'
  const sessionData = loadSessionData()

  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    form: { ...initialForm, ...sessionData },
    ui: { ...initialUI, accessGranted },
  })

  // Auto-save safe form fields to sessionStorage
  useEffect(() => {
    saveSessionData(state.form)
  }, [state.form])

  // Apply dark mode class to <html>
  useEffect(() => {
    if (state.ui.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [state.ui.darkMode])

  const updateField = useCallback((field, value) => {
    dispatch({ type: 'FORM/UPDATE_FIELD', field, value })
  }, [])

  const updateExpense = useCallback((field, value) => {
    dispatch({ type: 'FORM/UPDATE_EXPENSE', field, value })
  }, [])

  const updateAssumption = useCallback((field, value) => {
    dispatch({ type: 'ASSUMPTIONS/UPDATE', field, value })
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch, updateField, updateExpense, updateAssumption }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

export function useForm() {
  const { state, updateField, updateExpense } = useAppState()
  return { form: state.form, updateField, updateExpense }
}

export function useAssumptions() {
  const { state, updateAssumption, dispatch } = useAppState()
  return {
    assumptions: state.assumptions,
    updateAssumption,
    resetAssumptions: () => dispatch({ type: 'ASSUMPTIONS/RESET' }),
    batchUpdate: (fields) => dispatch({ type: 'ASSUMPTIONS/BATCH_UPDATE', fields }),
  }
}

export function useUI() {
  const { state, dispatch } = useAppState()
  return { ui: state.ui, dispatch }
}

export { initialForm, initialAssumptions }
