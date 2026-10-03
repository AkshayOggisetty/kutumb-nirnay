/* Training centres, ITIs and colleges.
 *
 * SEEDED DEMONSTRATION DATA. Names, coordinates and seat counts are
 * representative. In production this layer is served from the DGT ITI directory
 * (15,024 ITIs — 3,291 government, 11,733 private), the PMKVY training-centre
 * registry and AISHE college listings, resolved to the user's district.
 *
 * Coordinates are real place coordinates so that distance and travel-mode
 * arithmetic on the map behaves correctly during a demo.
 */

export const CENTRES = [
  /* ---- Pune district & around ---------------------------------------- */
  { id:'c01', name:'Government ITI, Aundh',            type:'iti',     lat:18.5590, lon:73.8078, trades:['iti-electrician','iti-fitter'], seats:120, fee:6200,  govt:true,  rating:4.1 },
  { id:'c02', name:'Government ITI, Pune (Mundhwa)',   type:'iti',     lat:18.5362, lon:73.9231, trades:['iti-fitter','iti-electrician'], seats:96,  fee:6200,  govt:true,  rating:3.9 },
  { id:'c03', name:'Government Polytechnic, Pune',     type:'poly',    lat:18.5308, lon:73.8676, trades:['diploma-mech'],                 seats:180, fee:18000, govt:true,  rating:4.3 },
  { id:'c04', name:'Skill Hub — Hadapsar',             type:'pmkvy',   lat:18.5089, lon:73.9260, trades:['cnc-operator','solar-pv'],      seats:60,  fee:0,     govt:true,  rating:3.6 },
  { id:'c05', name:'Private ITI, Chinchwad',           type:'iti',     lat:18.6298, lon:73.7997, trades:['iti-electrician','cnc-operator'],seats:80, fee:28000, govt:false, rating:3.4 },
  { id:'c06', name:'Sassoon GNM Nursing School',       type:'nursing', lat:18.5280, lon:73.8745, trades:['gnm-nursing'],                  seats:60,  fee:42000, govt:true,  rating:4.4 },
  { id:'c07', name:'Fergusson College',                type:'degree',  lat:18.5219, lon:73.8414, trades:['ba-general','bsc-general'],     seats:900, fee:8500,  govt:false, rating:4.5 },
  { id:'c08', name:'Modern College, Shivajinagar',     type:'degree',  lat:18.5305, lon:73.8441, trades:['ba-general','bsc-general'],     seats:720, fee:8200,  govt:false, rating:4.0 },
  { id:'c09', name:'Government ITI, Khed',             type:'iti',     lat:18.8450, lon:73.8890, trades:['iti-fitter'],                   seats:64,  fee:6200,  govt:true,  rating:3.7 },
  { id:'c10', name:'Skill Hub — Baramati',             type:'pmkvy',   lat:18.1514, lon:74.5815, trades:['solar-pv','cnc-operator'],      seats:40,  fee:0,     govt:true,  rating:3.8 },

  /* ---- Mumbai / Thane ------------------------------------------------ */
  { id:'c11', name:'Government ITI, Dadar',            type:'iti',     lat:19.0176, lon:72.8442, trades:['iti-electrician','iti-fitter'], seats:140, fee:6200,  govt:true,  rating:4.2 },
  { id:'c12', name:'VJTI Polytechnic, Matunga',        type:'poly',    lat:19.0222, lon:72.8561, trades:['diploma-mech'],                 seats:240, fee:21000, govt:true,  rating:4.7 },
  { id:'c13', name:'Government ITI, Thane',            type:'iti',     lat:19.1972, lon:72.9722, trades:['iti-electrician'],              seats:100, fee:6200,  govt:true,  rating:3.9 },
  { id:'c14', name:'Skill Hub — Navi Mumbai',          type:'pmkvy',   lat:19.0330, lon:73.0297, trades:['cnc-operator','solar-pv'],      seats:70,  fee:0,     govt:true,  rating:3.5 },
  { id:'c15', name:'Ruia College, Matunga',            type:'degree',  lat:19.0233, lon:72.8553, trades:['ba-general','bsc-general'],     seats:840, fee:9000,  govt:false, rating:4.4 },

  /* ---- Nashik / Ahmednagar ------------------------------------------- */
  { id:'c16', name:'Government ITI, Nashik',           type:'iti',     lat:19.9975, lon:73.7898, trades:['iti-electrician','iti-fitter'], seats:110, fee:6200,  govt:true,  rating:4.0 },
  { id:'c17', name:'Government Polytechnic, Nashik',   type:'poly',    lat:20.0110, lon:73.7640, trades:['diploma-mech'],                 seats:160, fee:18000, govt:true,  rating:4.1 },
  { id:'c18', name:'Skill Hub — Ahmednagar',           type:'pmkvy',   lat:19.0948, lon:74.7480, trades:['solar-pv'],                     seats:45,  fee:0,     govt:true,  rating:3.6 },

  /* ---- Nagpur / Vidarbha --------------------------------------------- */
  { id:'c19', name:'Government ITI, Nagpur',           type:'iti',     lat:21.1458, lon:79.0882, trades:['iti-electrician','iti-fitter'], seats:130, fee:6200,  govt:true,  rating:4.0 },
  { id:'c20', name:'Government Polytechnic, Nagpur',   type:'poly',    lat:21.1370, lon:79.0500, trades:['diploma-mech'],                 seats:170, fee:18000, govt:true,  rating:4.2 },
  { id:'c21', name:'GNM School, Nagpur',               type:'nursing', lat:21.1540, lon:79.0810, trades:['gnm-nursing'],                  seats:50,  fee:40000, govt:true,  rating:4.1 },

  /* ---- Bengaluru ------------------------------------------------------ */
  { id:'c22', name:'Government ITI, Jayanagar',        type:'iti',     lat:12.9250, lon:77.5938, trades:['iti-electrician','iti-fitter'], seats:120, fee:5800,  govt:true,  rating:4.2 },
  { id:'c23', name:'Government Polytechnic, K.R. Road',type:'poly',    lat:12.9530, lon:77.5760, trades:['diploma-mech'],                 seats:200, fee:16500, govt:true,  rating:4.3 },
  { id:'c24', name:'Skill Hub — Peenya',               type:'pmkvy',   lat:13.0287, lon:77.5192, trades:['cnc-operator','solar-pv'],      seats:80,  fee:0,     govt:true,  rating:3.9 },
  { id:'c25', name:'Government ITI, Yelahanka',        type:'iti',     lat:13.1007, lon:77.5963, trades:['iti-electrician'],              seats:90,  fee:5800,  govt:true,  rating:3.8 },
  { id:'c26', name:'Bangalore University — Arts',      type:'degree',  lat:12.9440, lon:77.5010, trades:['ba-general','bsc-general'],     seats:1200,fee:7800,  govt:true,  rating:4.0 },
  { id:'c27', name:'Victoria GNM Nursing School',      type:'nursing', lat:12.9630, lon:77.5730, trades:['gnm-nursing'],                  seats:60,  fee:38000, govt:true,  rating:4.3 },

  /* ---- Mysuru / Hubballi / Kalaburagi --------------------------------- */
  { id:'c28', name:'Government ITI, Mysuru',           type:'iti',     lat:12.2958, lon:76.6394, trades:['iti-electrician','iti-fitter'], seats:100, fee:5800,  govt:true,  rating:4.0 },
  { id:'c29', name:'Government Polytechnic, Mysuru',   type:'poly',    lat:12.3120, lon:76.6520, trades:['diploma-mech'],                 seats:150, fee:16500, govt:true,  rating:4.1 },
  { id:'c30', name:'Government ITI, Hubballi',         type:'iti',     lat:15.3647, lon:75.1240, trades:['iti-fitter','iti-electrician'], seats:110, fee:5800,  govt:true,  rating:3.9 },
  { id:'c31', name:'Skill Hub — Hubballi',             type:'pmkvy',   lat:15.3500, lon:75.1400, trades:['solar-pv','cnc-operator'],      seats:55,  fee:0,     govt:true,  rating:3.7 },
  { id:'c32', name:'Government ITI, Kalaburagi',       type:'iti',     lat:17.3297, lon:76.8343, trades:['iti-electrician'],              seats:85,  fee:5800,  govt:true,  rating:3.6 },

  /* ---- Hyderabad ------------------------------------------------------ */
  { id:'c33', name:'Government ITI, Secunderabad',     type:'iti',     lat:17.4399, lon:78.4983, trades:['iti-electrician','iti-fitter'], seats:125, fee:6000,  govt:true,  rating:4.1 },
  { id:'c34', name:'Government Polytechnic, Masab Tank',type:'poly',   lat:17.4010, lon:78.4480, trades:['diploma-mech'],                 seats:190, fee:17000, govt:true,  rating:4.2 },
  { id:'c35', name:'Skill Hub — Balanagar',            type:'pmkvy',   lat:17.4760, lon:78.4350, trades:['cnc-operator'],                 seats:60,  fee:0,     govt:true,  rating:3.5 },

  /* ---- Delhi NCR ------------------------------------------------------ */
  { id:'c36', name:'Government ITI, Pusa',             type:'iti',     lat:28.6390, lon:77.1510, trades:['iti-electrician','iti-fitter'], seats:150, fee:5500,  govt:true,  rating:4.3 },
  { id:'c37', name:'Government Polytechnic, Pitampura',type:'poly',    lat:28.6980, lon:77.1320, trades:['diploma-mech'],                 seats:200, fee:15000, govt:true,  rating:4.1 },
  { id:'c38', name:'Skill Hub — Okhla',                type:'pmkvy',   lat:28.5350, lon:77.2730, trades:['solar-pv','cnc-operator'],      seats:75,  fee:0,     govt:true,  rating:3.8 },
  { id:'c39', name:'Government ITI, Gurugram',         type:'iti',     lat:28.4595, lon:77.0266, trades:['iti-electrician'],              seats:95,  fee:5500,  govt:true,  rating:3.9 },

  /* ---- Lucknow / Kanpur ----------------------------------------------- */
  { id:'c40', name:'Government ITI, Aliganj',          type:'iti',     lat:26.8890, lon:80.9430, trades:['iti-electrician','iti-fitter'], seats:115, fee:5000,  govt:true,  rating:3.8 },
  { id:'c41', name:'Government Polytechnic, Lucknow',  type:'poly',    lat:26.8700, lon:80.9770, trades:['diploma-mech'],                 seats:175, fee:14000, govt:true,  rating:4.0 },
  { id:'c42', name:'Government ITI, Kanpur',           type:'iti',     lat:26.4499, lon:80.3319, trades:['iti-fitter'],                   seats:105, fee:5000,  govt:true,  rating:3.7 },

  /* ---- Kolkata / Chennai / Ahmedabad ---------------------------------- */
  { id:'c43', name:'Government ITI, Howrah',           type:'iti',     lat:22.5958, lon:88.2636, trades:['iti-electrician','iti-fitter'], seats:110, fee:5200,  govt:true,  rating:3.9 },
  { id:'c44', name:'Government ITI, Guindy',           type:'iti',     lat:13.0067, lon:80.2206, trades:['iti-electrician','iti-fitter'], seats:130, fee:5600,  govt:true,  rating:4.2 },
  { id:'c45', name:'Government Polytechnic, Ahmedabad',type:'poly',    lat:23.0320, lon:72.5700, trades:['diploma-mech'],                 seats:185, fee:16000, govt:true,  rating:4.1 }
];

export const CENTRE_TYPE = {
  iti:     { label: 'ITI',                 glyph: 'spanner' },
  poly:    { label: 'Polytechnic',         glyph: 'compass' },
  pmkvy:   { label: 'PMKVY Skill Hub',     glyph: 'spark'   },
  nursing: { label: 'Nursing school',      glyph: 'cross'   },
  degree:  { label: 'Degree college',      glyph: 'book'    }
};

/* Fallback origin when the browser denies or cannot resolve geolocation.
   Pune — the district used throughout the walkthrough. */
export const FALLBACK_ORIGIN = { lat: 18.5204, lon: 73.8567, label: 'Pune, Maharashtra' };
