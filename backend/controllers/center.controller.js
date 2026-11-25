const GrievanceCenter = require('../models/GrievanceCenter');

const DEFAULT_CENTERS = [
  {
    name: 'DARPG Central Public Grievance Cell (Sardar Patel Bhawan)',
    code: 'DEL-DARPG-01',
    type: 'central',
    departmentName: 'Ministry of Personnel, Public Grievances & Pensions',
    address: { street: 'Sansad Marg, Patel Chowk', landmark: 'Near Reserve Bank of India', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    location: { type: 'Point', coordinates: [77.2139, 28.6229] },
    phone: '1800-11-0031',
    email: 'grievance@jansamadhan.gov.in',
    workingDays: 'Mon - Fri',
    openHour: 9.5,
    closeHour: 17.5,
    services: ['Central Ministry Grievance', 'Appeal Escalation (DPG)', 'Senior Citizen Desk', 'Document Verification'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['English', 'Hindi'],
    nearestTransit: 'Patel Chowk Metro Station (250 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 18,
  },
  {
    name: 'Directorate of Public Grievances (DPG) — Cabinet Secretariat',
    code: 'DEL-DPG-02',
    type: 'appellate',
    departmentName: 'Cabinet Secretariat, Government of India',
    address: { street: '2nd Floor, Sardar Patel Bhawan, Parliament Street', landmark: 'Connaught Place South', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    location: { type: 'Point', coordinates: [77.2148, 28.6238] },
    phone: '011-23743139',
    email: 'dpg-cabsec@gov.in',
    workingDays: 'Mon - Fri',
    openHour: 9.5,
    closeHour: 17.5,
    services: ['Appellate Grievance Hearing', 'PSU & Banking Grievances', 'Railways & Telecom Escalation'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: false, parkingAvailable: true },
    languages: ['English', 'Hindi'],
    nearestTransit: 'Janpath Metro Station (450 m)',
    crowdLevel: 'low',
    avgWaitMinutes: 12,
  },
  {
    name: 'Delhi District Magistrate Public Grievance Kendra (Central Delhi)',
    code: 'DEL-DM-03',
    type: 'district',
    departmentName: 'Revenue & District Administration, Govt. of NCT Delhi',
    address: { street: '14, Daryaganj, Netaji Subhash Marg', landmark: 'Near Delhi Gate', city: 'New Delhi', state: 'Delhi', pincode: '110002' },
    location: { type: 'Point', coordinates: [77.2410, 28.6415] },
    phone: '011-23273555',
    email: 'dccentral@nic.in',
    workingDays: 'Mon - Sat',
    openHour: 9.5,
    closeHour: 17.0,
    services: ['Certificate Grievances', 'Ration & PDS Issues', 'Land Revenue Complaints', 'Citizen Seva Counter'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Hindi', 'English', 'Punjabi', 'Urdu'],
    nearestTransit: 'Delhi Gate Metro Station (300 m)',
    crowdLevel: 'busy',
    avgWaitMinutes: 25,
  },
  {
    name: 'Maharashtra Lokshahi Din & Mantralaya Grievance Cell',
    code: 'MUM-MANT-01',
    type: 'state',
    departmentName: 'General Administration Dept, Govt. of Maharashtra',
    address: { street: 'Madame Cama Road, Nariman Point', landmark: 'Opposite Vidhan Bhavan', city: 'Mumbai', state: 'Maharashtra', pincode: '400032' },
    location: { type: 'Point', coordinates: [72.8258, 18.9284] },
    phone: '022-22025042',
    email: 'grievance.mh@gov.in',
    workingDays: 'Mon - Fri',
    openHour: 9.75,
    closeHour: 17.75,
    services: ['State Department Grievance', 'Lokshahi Din Hearings', 'Pension & Revenue Appeals'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: false },
    languages: ['Marathi', 'Hindi', 'English'],
    nearestTransit: 'Churchgate Railway Station (700 m)',
    crowdLevel: 'busy',
    avgWaitMinutes: 28,
  },
  {
    name: 'Mumbai City District Collectorate Citizen Facilitation Center',
    code: 'MUM-DIST-02',
    type: 'district',
    departmentName: 'Collectorate of Mumbai City',
    address: { street: 'Old Custom House, Shahid Bhagat Singh Road, Fort', landmark: 'Near Horniman Circle', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    location: { type: 'Point', coordinates: [72.8355, 18.9322] },
    phone: '022-22661231',
    email: 'collector.mumbai@maharashtra.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 10.0,
    closeHour: 17.5,
    services: ['Document Delivery Desk', 'Revenue & Land Records', 'Municipal Escalation'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Marathi', 'Hindi', 'English'],
    nearestTransit: 'CSMT Railway Station (900 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 16,
  },
  {
    name: 'Karnataka Janaspandana & Vidhana Soudha Grievance Kendra',
    code: 'BLR-STATE-01',
    type: 'state',
    departmentName: 'Department of Personnel & Administrative Reforms, Karnataka',
    address: { street: 'Dr. Ambedkar Veedhi, Sampangi Rama Nagar', landmark: 'Near Cubbon Park Gate', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    location: { type: 'Point', coordinates: [77.5906, 12.9797] },
    phone: '080-22258555',
    email: 'janaspandana@karnataka.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 10.0,
    closeHour: 17.5,
    services: ['Janaspandana Grievance Filing', 'Civic & BBMP Escalation', 'e-Governance Seva'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Kannada', 'English', 'Hindi'],
    nearestTransit: 'Dr. B.R. Ambedkar Vidhana Soudha Metro (200 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 14,
  },
  {
    name: 'Tamil Nadu CM Cell & Secretariat Public Grievance Center',
    code: 'CHN-STATE-01',
    type: 'state',
    departmentName: 'Public Department, Govt. of Tamil Nadu',
    address: { street: 'Fort St. George, Rajaji Salai', landmark: 'Near Secretariat Complex', city: 'Chennai', state: 'Tamil Nadu', pincode: '600009' },
    location: { type: 'Point', coordinates: [80.2872, 13.0797] },
    phone: '044-25671764',
    email: 'cmcell@tn.gov.in',
    workingDays: 'Mon - Fri',
    openHour: 10.0,
    closeHour: 17.75,
    services: ['State Public Grievance', 'Welfare & Pension Desk', 'Citizen Token Counter'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Tamil', 'English'],
    nearestTransit: 'Chennai Fort Suburban Station (350 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 15,
  },
  {
    name: 'West Bengal Nabanna Citizen Grievance Redressal Desk',
    code: 'KOL-STATE-01',
    type: 'state',
    departmentName: 'Public Grievance Cell, Govt. of West Bengal',
    address: { street: '325, Sarat Chatterjee Road, Shibpur', landmark: 'Nabanna State Secretariat', city: 'Kolkata', state: 'West Bengal', pincode: '711102' },
    location: { type: 'Point', coordinates: [88.3204, 22.5588] },
    phone: '033-22145555',
    email: 'grievance.wb@gov.in',
    workingDays: 'Mon - Fri',
    openHour: 10.0,
    closeHour: 17.5,
    services: ['State Grievance Submission', 'Ration & Municipal Issues', 'Appeal Verification'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Bengali', 'Hindi', 'English'],
    nearestTransit: 'Howrah Maidan Metro (2.4 km)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 18,
  },
  {
    name: 'Telangana Prajavani Grievance Center (Collectorate Hyderabad)',
    code: 'HYD-DIST-01',
    type: 'district',
    departmentName: 'Hyderabad District Collectorate',
    address: { street: 'Chirag Ali Lane, Abids, Nampally', landmark: 'Near Nampally Station Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    location: { type: 'Point', coordinates: [78.4728, 17.3913] },
    phone: '040-23202813',
    email: 'collector_hyd@telangana.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 10.0,
    closeHour: 17.0,
    services: ['Prajavani Weekly Hearing', 'Revenue & Civil Supplies', 'Senior Citizen Counter'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Telugu', 'Urdu', 'Hindi', 'English'],
    nearestTransit: 'Nampally Metro Station (400 m)',
    crowdLevel: 'low',
    avgWaitMinutes: 10,
  },
  {
    name: 'Uttar Pradesh Jan Sunwai Kendra (Lok Bhawan, Lucknow)',
    code: 'LKO-STATE-01',
    type: 'state',
    departmentName: 'Department of Public Grievances, Govt. of UP',
    address: { street: 'Vidhan Sabha Marg, Hazratganj', landmark: 'Opposite Vidhan Bhawan', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
    location: { type: 'Point', coordinates: [80.9462, 26.8424] },
    phone: '1076',
    email: 'jansunwai@up.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 9.5,
    closeHour: 17.5,
    services: ['IGRS Jan Sunwai Filing', 'Police & Revenue Grievances', 'CM Helpline Physical Desk'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Hindi', 'English', 'Urdu'],
    nearestTransit: 'Sachivalaya Metro Station (150 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 15,
  },
  {
    name: 'Pune District Collectorate Setu & Grievance Kendra',
    code: 'PUN-DIST-01',
    type: 'district',
    departmentName: 'District Collectorate Pune',
    address: { street: 'Station Road, Bund Garden, Agarkar Nagar', landmark: 'Opposite Sassoon Hospital', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    location: { type: 'Point', coordinates: [73.8736, 18.5262] },
    phone: '020-26123371',
    email: 'collector.pune@maharashtra.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 9.75,
    closeHour: 17.5,
    services: ['Setu Citizen Services', 'District Grievance Redressal', 'Certificate Delivery'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Marathi', 'Hindi', 'English'],
    nearestTransit: 'Pune Railway Station Metro (300 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 14,
  },
  {
    name: 'Rajasthan Sampark Jan Sunwai Center (Jaipur)',
    code: 'JAI-STATE-01',
    type: 'state',
    departmentName: 'Department of Administrative Reforms, Rajasthan',
    address: { street: 'Collectorate Circle, Bani Park', landmark: 'Mini Secretariat Campus', city: 'Jaipur', state: 'Rajasthan', pincode: '302016' },
    location: { type: 'Point', coordinates: [75.7955, 26.9245] },
    phone: '181',
    email: 'sampark.raj@gov.in',
    workingDays: 'Mon - Fri',
    openHour: 9.5,
    closeHour: 18.0,
    services: ['Rajasthan Sampark 181 Desk', 'District Collector Hearing', 'Electricity & Water Redressal'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Hindi', 'English'],
    nearestTransit: 'Sindhi Camp Metro Station (1.2 km)',
    crowdLevel: 'low',
    avgWaitMinutes: 10,
  },
  {
    name: 'Gujarat Swagat Public Grievance Center (Ahmedabad)',
    code: 'AMD-DIST-01',
    type: 'district',
    departmentName: 'Collector Office Ahmedabad',
    address: { street: 'Subhash Bridge Circle, Near RTO', landmark: 'Jilla Seva Sadan', city: 'Ahmedabad', state: 'Gujarat', pincode: '380027' },
    location: { type: 'Point', coordinates: [72.5784, 23.0638] },
    phone: '079-27551681',
    email: 'collector-ahd@gujarat.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 10.5,
    closeHour: 18.0,
    services: ['SWAGAT Grievance Hearing', 'Revenue & Civic Complaints', 'Jan Seva Kendra'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Gujarati', 'Hindi', 'English'],
    nearestTransit: 'Sabarmati Metro Station (900 m)',
    crowdLevel: 'low',
    avgWaitMinutes: 12,
  },
  {
    name: 'Madhya Pradesh CM Jan Seva & Collectorate Kendra (Bhopal)',
    code: 'BPL-DIST-01',
    type: 'district',
    departmentName: 'District Administration Bhopal',
    address: { street: 'A-Block, Old Secretariat, Sultania Road', landmark: 'Near Kohefiza', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001' },
    location: { type: 'Point', coordinates: [77.3928, 23.2611] },
    phone: '0755-2540355',
    email: 'dmbhopal@nic.in',
    workingDays: 'Mon - Fri',
    openHour: 10.0,
    closeHour: 17.5,
    services: ['Jansunwai Tuesday Counter', 'CM Helpline Physical Support', 'Welfare Scheme Redressal'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Hindi', 'English'],
    nearestTransit: 'Nadra Bus Stand (2.1 km)',
    crowdLevel: 'low',
    avgWaitMinutes: 11,
  },
  {
    name: 'Bihar Lok Shikayat Nivaran Kendra (Patna Collectorate)',
    code: 'PAT-DIST-01',
    type: 'district',
    departmentName: 'Public Grievance Redressal Authority, Bihar',
    address: { street: 'Chajju Bagh, Gandhi Maidan West', landmark: 'Near Golghar', city: 'Patna', state: 'Bihar', pincode: '800001' },
    location: { type: 'Point', coordinates: [85.1376, 25.6197] },
    phone: '0612-2219205',
    email: 'dm-patna.bih@nic.in',
    workingDays: 'Mon - Sat',
    openHour: 10.0,
    closeHour: 17.0,
    services: ['Right to Public Grievance Hearing', 'Sub-Divisional Escalation', 'Document Support'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['Hindi', 'English', 'Bhojpuri', 'Maithili'],
    nearestTransit: 'Gandhi Maidan Bus Hub (400 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 17,
  },
  {
    name: 'Chandigarh UT Sampark & Public Grievance Center',
    code: 'IXC-CSC-01',
    type: 'csc',
    departmentName: 'Department of Information Technology, Chandigarh UT',
    address: { street: 'Sector 17-D, Jan Marg', landmark: 'Near Neelam Theatre Plaza', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017' },
    location: { type: 'Point', coordinates: [76.7834, 30.7415] },
    phone: '0172-2700072',
    email: 'sampark-chd@nic.in',
    workingDays: 'Mon - Sat',
    openHour: 9.0,
    closeHour: 17.5,
    services: ['Utility & Municipal Grievance', 'Passport & Transport Helpdesk', 'e-Sampark Token'],
    facilities: { wheelchairAccessible: true, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: true },
    languages: ['English', 'Hindi', 'Punjabi'],
    nearestTransit: 'ISBT Sector 17 Bus Terminus (300 m)',
    crowdLevel: 'low',
    avgWaitMinutes: 8,
  },
  {
    name: 'Common Service Centre (CSC e-Governance) — Connaught Place Hub',
    code: 'DEL-CSC-04',
    type: 'csc',
    departmentName: 'CSC e-Governance Services India Ltd (MeitY)',
    address: { street: 'Block B, Inner Circle, Connaught Place', landmark: 'Near Rajiv Chowk Gate 5', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    location: { type: 'Point', coordinates: [77.2195, 28.6328] },
    phone: '14599',
    email: 'helpdesk@csc.gov.in',
    workingDays: 'Mon - Sat',
    openHour: 9.5,
    closeHour: 18.5,
    services: ['Assisted Grievance Typing & Scan', 'Aadhaar/PAN Grievance Support', 'Digital Certificate Print'],
    facilities: { wheelchairAccessible: false, womensDesk: true, tokenCounter: true, photocopyAvailable: true, parkingAvailable: false },
    languages: ['Hindi', 'English'],
    nearestTransit: 'Rajiv Chowk Metro Station (120 m)',
    crowdLevel: 'moderate',
    avgWaitMinutes: 12,
  },
];

let seededOnce = false;

const ensureSeeded = async () => {
  if (seededOnce) return;
  const count = await GrievanceCenter.countDocuments();
  if (count === 0) {
    await GrievanceCenter.insertMany(DEFAULT_CENTERS);
  }
  seededOnce = true;
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc    Get all physical grievance centers (optionally sorted by distance from lat/lng)
// @route   GET /api/centers
// @access  Public
exports.getCenters = async (req, res, next) => {
  try {
    await ensureSeeded();
    const { lat, lng, type, search, wheelchair } = req.query;

    const query = { isActive: true };
    if (type && type !== 'all') query.type = type;
    if (wheelchair === 'true') query['facilities.wheelchairAccessible'] = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { 'address.pincode': { $regex: search, $options: 'i' } },
      ];
    }

    const centers = await GrievanceCenter.find(query).lean();

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasCoords = !Number.isNaN(userLat) && !Number.isNaN(userLng);

    const enriched = centers.map((c) => {
      const [cLng, cLat] = c.location?.coordinates || [77.2139, 28.6229];
      const distanceKm = hasCoords ? haversineKm(userLat, userLng, cLat, cLng) : null;
      return {
        ...c,
        lat: cLat,
        lng: cLng,
        distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(2)) : null,
        distanceMeters: distanceKm !== null ? Math.round(distanceKm * 1000) : null,
      };
    });

    if (hasCoords) {
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed default physical centers
// @route   POST /api/centers/seed
// @access  Private (Admin)
exports.seedCenters = async (req, res, next) => {
  try {
    await GrievanceCenter.deleteMany({});
    const created = await GrievanceCenter.insertMany(DEFAULT_CENTERS);
    seededOnce = true;
    res.json({ success: true, count: created.length, data: created });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a physical grievance center
// @route   POST /api/centers
// @access  Private (Admin)
exports.createCenter = async (req, res, next) => {
  try {
    const center = await GrievanceCenter.create(req.body);
    res.status(201).json({ success: true, data: center });
  } catch (error) {
    next(error);
  }
};
