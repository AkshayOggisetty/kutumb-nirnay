/* The objection-handling engine, and local proof.
 *
 * This is the part no competing platform has. Career tools recommend; they do
 * not argue. A counsellor's actual work is answering the specific thing the
 * parent is afraid of — so these are catalogued as first-class content, each
 * with an evidence line and a local precedent.
 *
 * SEEDED DEMONSTRATION DATA for the alumni records. In production these are
 * consented, verified outcome records from families who used the platform —
 * which is also what turns the product into the district-level labour-market
 * information the CAG audit found missing.
 */

export const OBJECTIONS = [
  {
    id: 'o1',
    voice: 'parent',
    says: 'ITI is for children who could not study.',
    saysHi: 'आईटीआई उन बच्चों के लिए है जो पढ़ नहीं सके।',
    theme: 'status',
    answer:
      'Entry to a government ITI electrician seat is competitive — the Aundh centre ' +
      'admits 120 against far more applicants. It is a selection, not a fallback.',
    evidence: 'Seat pressure at government ITIs in this district',
    counter:
      'The real question is not who takes the seat. It is what the seat pays, and when.'
  },
  {
    id: 'o2',
    voice: 'parent',
    says: 'A degree is safer.',
    saysHi: 'डिग्री ज़्यादा सुरक्षित है।',
    theme: 'risk',
    answer:
      'Safer against what? On formal placement, the trade route lands roughly two in ' +
      'three; the general degree lands roughly one in three. The degree is safer only ' +
      'if the goal is a government exam — which is a real goal, and worth naming.',
    evidence: 'Placement rate comparison, this district',
    counter: 'Name the goal first. Then the safer path is a fact, not an opinion.'
  },
  {
    id: 'o3',
    voice: 'parent',
    says: 'It is a dead end. There is no growth after ITI.',
    saysHi: 'इसके बाद आगे कुछ नहीं है।',
    theme: 'ceiling',
    answer:
      'ITI (NSQF 4) → NAPS apprenticeship → diploma by lateral entry → B.E. directly ' +
      'into the second year. The ladder exists and is used. Most families have never ' +
      'been shown it.',
    evidence: 'NSQF progression pathway',
    counter: 'The fear is a ceiling. The answer is the ladder — so show the ladder.'
  },
  {
    id: 'o4',
    voice: 'parent',
    says: 'Only a government job is secure.',
    saysHi: 'सरकारी नौकरी ही सुरक्षित है।',
    theme: 'security',
    answer:
      'A licensed electrician holds a transferable trade licence. That is portable ' +
      'security — it does not depend on one employer, and it does not expire with a ' +
      'recruitment cycle.',
    evidence: 'Trade licensing and self-employment route',
    counter: 'There is more than one kind of security. Compare them honestly.'
  },
  {
    id: 'o5',
    voice: 'parent',
    says: 'What will people say?',
    saysHi: 'लोग क्या कहेंगे?',
    theme: 'social',
    answer:
      'Four families within 12 km of here made this choice in the last three years. ' +
      'Their outcomes are on the next screen, with names and workplaces where they ' +
      'consented to share.',
    evidence: 'Verified local precedent',
    counter:
      'This objection is never answered with statistics. It is answered with neighbours.'
  },
  {
    id: 'o6',
    voice: 'parent',
    says: 'We spent on his schooling. This feels like going backwards.',
    saysHi: 'हमने पढ़ाई पर खर्च किया, और अब यह?',
    theme: 'sunk-cost',
    answer:
      'Nothing is discarded. Class 10 and 12 remain on the record, and the diploma ' +
      'lateral-entry route uses them. What changes is when earning starts.',
    evidence: 'Cash-flow comparison at 24 and 36 months',
    counter: 'Reframe from status lost to time gained.'
  },
  {
    id: 'o7',
    voice: 'parent',
    says: 'She is a girl. This is not suitable work.',
    saysHi: 'वह लड़की है, यह काम उसके लिए ठीक नहीं।',
    theme: 'gender',
    answer:
      'GNM nursing shows the highest placement of any path here, and both nursing ' +
      'schools in this district are government-run with hostels. Electrician and solar ' +
      'trades have growing women-only batches at Skill Hubs.',
    evidence: 'Placement by path; women-only batch availability',
    counter: 'Answer with the specific trades and the specific institutions.'
  },
  {
    id: 'o8',
    voice: 'student',
    says: 'I do not know what I am good at.',
    saysHi: 'मुझे नहीं पता मैं किसमें अच्छा हूँ।',
    theme: 'self',
    answer:
      'Then do not start from aptitude. Start from exposure — three trades, a day ' +
      'each, at a centre within 10 km. Decide after seeing the work, not before.',
    evidence: 'Nearby centres offering taster sessions',
    counter: 'A test cannot tell you what a workshop floor will.'
  },
  {
    id: 'o9',
    voice: 'student',
    says: 'My friends are all going for the degree.',
    saysHi: 'मेरे सारे दोस्त डिग्री कर रहे हैं।',
    theme: 'peer',
    answer:
      'That is a real cost and it should be counted, not dismissed. It is also the ' +
      'reason the trade seat is less crowded and the wage starts earlier.',
    evidence: 'Enrolment distribution',
    counter: 'Acknowledge the cost. Do not argue the feeling away.'
  }
];

/* Verified local outcomes — the single most effective counter to "what will
   people say", because proximity is what makes social proof bite. */
export const ALUMNI = [
  {
    id: 'a1', name: 'Rahul K.', block: 'Haveli', km: 6.2, year: 2022,
    path: 'iti-electrician', now: 'Maintenance technician, auto components plant',
    wage: 24000, note: 'Apprenticed first, hired by the same plant.'
  },
  {
    id: 'a2', name: 'Sunita B.', block: 'Haveli', km: 8.9, year: 2021,
    path: 'gnm-nursing', now: 'Staff nurse, district hospital',
    wage: 29000, note: 'Doing post-basic B.Sc part-time now.'
  },
  {
    id: 'a3', name: 'Imran S.', block: 'Mulshi', km: 11.4, year: 2023,
    path: 'solar-pv', now: 'Rooftop installation, two-person crew',
    wage: 26000, note: 'Self-employed since the second year. Takes his own contracts.'
  },
  {
    id: 'a4', name: 'Pooja M.', block: 'Haveli', km: 4.1, year: 2020,
    path: 'diploma-mech', now: 'Junior engineer, lateral entry to B.E. in progress',
    wage: 31000, note: 'Used the exact lateral-entry ladder shown on the pathway screen.'
  },
  {
    id: 'a5', name: 'Ajay D.', block: 'Khed', km: 19.7, year: 2022,
    path: 'ba-general', now: 'Preparing for state services, second attempt',
    wage: 0, note: 'Included deliberately. The degree path is not always wrong, and it is not always right.'
  }
];
