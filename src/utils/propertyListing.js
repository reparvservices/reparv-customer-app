// Listing rules for the "List Property" form — kept in step with the website
// (reparv-website src/utils/propertyListing.js) so app and web listings match.
//
// Flow: Sell / Rent → (New Launch / Resale) → Residential / Commercial /
// Agriculture → category. propertyCategory values are the same ones the
// website filters and the server use.

export const LISTING_TYPES = [
  {key: 'Sell', label: 'Sell', hint: 'List a property for sale'},
  {key: 'Rent', label: 'Rent', hint: 'List a property for rent'},
];

export const PROPERTY_KINDS = [
  {key: 'Residential', label: 'Residential'},
  {key: 'Commercial', label: 'Commercial'},
  {key: 'Agriculture', label: 'Agriculture / Land'},
];

export const SALE_CONDITIONS = [
  {key: 'new', label: 'New Launch'},
  {key: 'resale', label: 'Resale'},
];

// `icon` is a lucide-react-native icon name, resolved by the screen
const NEW_CATEGORIES = [
  {label: 'New Flat', value: 'NewFlat', icon: 'Building2', kind: 'Residential'},
  {label: 'New Plot', value: 'NewPlot', icon: 'LandPlot', kind: 'Residential'},
  {label: 'Row House', value: 'RowHouse', icon: 'House', kind: 'Residential'},
  {label: 'New Shop', value: 'NewShop', icon: 'Store', kind: 'Commercial'},
  {
    label: 'Commercial Flat',
    value: 'CommercialFlat',
    icon: 'Building',
    kind: 'Commercial',
  },
  {
    label: 'Commercial Plot',
    value: 'CommercialPlot',
    icon: 'LandPlot',
    kind: 'Commercial',
  },
  {
    label: 'Industrial Space',
    value: 'IndustrialSpace',
    icon: 'Factory',
    kind: 'Commercial',
  },
  {label: 'Farm Land', value: 'FarmLand', icon: 'Trees', kind: 'Agriculture'},
  {label: 'Farm House', value: 'FarmHouse', icon: 'House', kind: 'Agriculture'},
];

const RESALE_CATEGORIES = [
  {
    label: 'Resale Flat',
    value: 'ResaleFlat',
    icon: 'Building2',
    kind: 'Residential',
  },
  {
    label: 'Resale Plot',
    value: 'ResalePlot',
    icon: 'LandPlot',
    kind: 'Residential',
  },
  {
    label: 'Resale House',
    value: 'ResaleHouse',
    icon: 'House',
    kind: 'Residential',
  },
  {
    label: 'Resale Villa',
    value: 'ResalelVilla',
    icon: 'Trees',
    kind: 'Residential',
  },
  {
    label: 'Resale Bungalow',
    value: 'ResaleBunglow',
    icon: 'Building',
    kind: 'Residential',
  },
  {
    label: 'Resale Shop',
    value: 'ResaleShop',
    icon: 'Store',
    kind: 'Commercial',
  },
  {
    label: 'Resale Office',
    value: 'ResaleOffice',
    icon: 'Building',
    kind: 'Commercial',
  },
  {
    label: 'Resale Godown',
    value: 'ResaleGodown',
    icon: 'Warehouse',
    kind: 'Commercial',
  },
  {
    label: 'Resale ShowRoom',
    value: 'ResaleShowroom',
    icon: 'Store',
    kind: 'Commercial',
  },
  {
    label: 'Resale Farm House',
    value: 'ResaleFarmHouse',
    icon: 'Tractor',
    kind: 'Agriculture',
  },
];

const RENTAL_CATEGORIES = [
  {
    label: 'Rental Flat',
    value: 'RentalFlat',
    icon: 'Building2',
    kind: 'Residential',
  },
  {
    label: 'Rental House',
    value: 'RentalHouse',
    icon: 'House',
    kind: 'Residential',
  },
  {
    label: 'Rental Villa',
    value: 'RentalVilla',
    icon: 'Trees',
    kind: 'Residential',
  },
  {
    label: 'Rental Plot',
    value: 'RentalPlot',
    icon: 'LandPlot',
    kind: 'Residential',
  },
  {
    label: 'Rental Shop',
    value: 'RentalShop',
    icon: 'Store',
    kind: 'Commercial',
  },
  {
    label: 'Rental Office',
    value: 'RentalOffice',
    icon: 'Building',
    kind: 'Commercial',
  },
  {
    label: 'Rental Godown',
    value: 'RentalGodown',
    icon: 'Warehouse',
    kind: 'Commercial',
  },
  {
    label: 'Rental ShowRoom',
    value: 'RentalShowroom',
    icon: 'Store',
    kind: 'Commercial',
  },
  {
    label: 'Rental Land',
    value: 'RentalOpenLand',
    icon: 'Trees',
    kind: 'Agriculture',
  },
];

const ALL_CATEGORIES = [
  ...NEW_CATEGORIES,
  ...RESALE_CATEGORIES,
  ...RENTAL_CATEGORIES,
];

export const kindOfCategory = category => {
  const c = String(category || '');
  if (!c) return '';
  return ALL_CATEGORIES.find(item => item.value === c)?.kind || 'Residential';
};

/** Categories to offer for a listing type / sale condition / property kind */
export const categoriesFor = ({listingType, condition, propertyKind}) => {
  const group =
    listingType === 'Rent'
      ? RENTAL_CATEGORIES
      : condition === 'resale'
      ? RESALE_CATEGORIES
      : NEW_CATEGORIES;
  return propertyKind ? group.filter(c => c.kind === propertyKind) : group;
};

/* ── Basic information: fields change with the property type ── */

export const FURNISHING_OPTIONS = [
  'Unfurnished',
  'Semi-Furnished',
  'Fully Furnished',
];
export const COMMERCIAL_FURNISHING_OPTIONS = [
  ...FURNISHING_OPTIONS,
  'Bare Shell',
];
export const FACING_OPTIONS = [
  'North-facing',
  'North-East-facing (NE)',
  'East-facing',
  'South-East-facing (SE)',
  'South-facing',
  'South-West-facing (SW)',
  'West-facing',
  'North-West-facing (NW)',
  'Road Facing',
];
export const YES_NO = ['Yes', 'No'];
export const POWER_OPTIONS = [
  'State Electricity Board Supply',
  'Dedicated Transformer Supply',
  'DG (Diesel Generator) Backup',
  'Inverter / Battery Backup',
  'Solar Power Supply',
  'No Power Supply',
];
export const WATER_SOURCE_OPTIONS = [
  'Borewell / Tube Well',
  'Open Well',
  'Canal / River',
  'Municipal / Corporation Water',
  'Combination / Mixed',
  'No Water Source',
];
export const OWNERSHIP_OPTIONS = [
  'Freehold',
  'Lease Hold',
  'Single Ownership',
  'Joint Ownership',
  'Power of Attorney',
  'Government Alloted Property',
];
export const LAND_UNITS = ['Acre', 'Guntha', 'Hectare', 'Sq.ft'];

/** "built" (flat/shop/office…), "plot" (residential/commercial plot) or "land" (agriculture) */
export const areaModeFor = ({propertyKind, propertyCategory}) => {
  const kind = propertyKind || kindOfCategory(propertyCategory);
  if (kind === 'Agriculture') return 'land';
  return /Plot|Land/.test(String(propertyCategory || '')) ? 'plot' : 'built';
};

/** Area column that must be filled for the property's type */
export const requiredAreaField = property =>
  areaModeFor(property) === 'land' ? 'builtUpArea' : 'carpetArea';

const FIELD = {
  furnishing: {
    key: 'furnishing',
    label: 'Furnishing',
    type: 'select',
    options: FURNISHING_OPTIONS,
  },
  floorNo: {
    key: 'floorNo',
    label: 'Floor No.',
    type: 'number',
    placeholder: 'e.g. 3',
  },
  totalFloors: {
    key: 'totalFloors',
    label: 'Total Floors',
    type: 'number',
    placeholder: 'e.g. 12',
  },
  propertyFacing: {
    key: 'propertyFacing',
    label: 'Facing',
    type: 'select',
    options: FACING_OPTIONS,
  },
  parkingAvailability: {
    key: 'parkingAvailability',
    label: 'Parking Available',
    type: 'select',
    options: YES_NO,
  },
  powerBackup: {
    key: 'powerBackup',
    label: 'Power Supply / Backup',
    type: 'select',
    options: POWER_OPTIONS,
  },
  waterSupply: {
    key: 'waterSupply',
    label: 'Water Source',
    type: 'select',
    options: WATER_SOURCE_OPTIONS,
  },
  ownershipType: {
    key: 'ownershipType',
    label: 'Ownership',
    type: 'select',
    options: OWNERSHIP_OPTIONS,
  },
};

/** Extra basic-info fields (besides area & price) for the selected type */
export const basicDetailFieldsFor = ({propertyKind, propertyCategory}) => {
  const kind = propertyKind || kindOfCategory(propertyCategory);
  const mode = areaModeFor({propertyKind: kind, propertyCategory});
  if (mode === 'land') {
    return [FIELD.waterSupply, FIELD.ownershipType, FIELD.propertyFacing];
  }
  if (mode === 'plot') return [FIELD.propertyFacing, FIELD.ownershipType];
  if (kind === 'Commercial') {
    return [
      {...FIELD.furnishing, options: COMMERCIAL_FURNISHING_OPTIONS},
      FIELD.floorNo,
      FIELD.totalFloors,
      FIELD.parkingAvailability,
      FIELD.powerBackup,
    ];
  }
  return [
    FIELD.furnishing,
    FIELD.floorNo,
    FIELD.totalFloors,
    FIELD.propertyFacing,
  ];
};

export const BASIC_DETAIL_KEYS = Object.keys(FIELD);

/** Split a stored land area like "2.5 Acre" into { value, unit } */
export const parseLandArea = stored => {
  const text = String(stored ?? '').trim();
  const unit = LAND_UNITS.find(u =>
    text.toLowerCase().endsWith(u.toLowerCase()),
  );
  return {
    value: unit ? text.slice(0, -unit.length).trim() : text,
    unit: unit || 'Acre',
  };
};

/* Configuration (BHK) — same values the website BHK filters use */
export const BHK_OPTIONS = [
  '1 RK',
  '1 BHK',
  '2 BHK',
  '2.5 BHK',
  '3 BHK',
  '3.5 BHK',
  '4 BHK',
  '5 BHK',
  'Above 5 BHK',
  'Pent House',
  'Studio Apartment',
  'Duplex Apartment',
];

/** BHK is asked for residential built property (flat, house, villa, bungalow, row house) */
export const needsConfiguration = ({propertyKind, propertyCategory}) => {
  if (!propertyCategory) return false;
  const kind = propertyKind || kindOfCategory(propertyCategory);
  return (
    kind === 'Residential' &&
    areaModeFor({propertyKind: kind, propertyCategory}) === 'built'
  );
};
