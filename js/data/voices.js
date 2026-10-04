/* Concerns families raise, and the evidence that answers each one.
 * Plus outcome records from people who took these routes locally. */

export const OBJECTIONS = [
  {
    id: 'o1',
    voice: 'parent',
    says: 'ITI is for children who could not study.',
    theme: 'Status',
    answer:
      'A government ITI electrician seat is competitive. The Aundh centre admits 120 ' +
      'against several times that many applicants, so it is a selection rather than a fallback.',
    evidence: 'Seat pressure at government ITIs in this district',
    counter: 'The question worth asking is not who takes the seat. It is what the seat pays, and when.'
  },
  {
    id: 'o2',
    voice: 'parent',
    says: 'A degree is safer.',
    theme: 'Risk',
    answer:
      'Safer against what? On formal placement the trade route lands roughly two in three, ' +
      'and a general degree roughly one in three. The degree is safer only if the goal is a ' +
      'government examination, which is a real goal and worth naming out loud.',
    evidence: 'Placement rates across both paths',
    counter: 'Name the goal first. Once it is named, the safer path becomes a fact rather than an opinion.'
  },
  {
    id: 'o3',
    voice: 'parent',
    says: 'It is a dead end. There is no growth after ITI.',
    theme: 'Ceiling',
    answer:
      'ITI at NSQF level 4 leads to an apprenticeship, then a diploma by lateral entry, then ' +
      'direct entry into the second year of a B.E. The ladder exists and people climb it. ' +
      'Most families have simply never been shown it.',
    evidence: 'NSQF progression pathway',
    counter: 'The fear is a ceiling, so answer it by showing the ladder.'
  },
  {
    id: 'o4',
    voice: 'parent',
    says: 'Only a government job is secure.',
    theme: 'Security',
    answer:
      'A licensed electrician holds a transferable trade licence. That is portable security. ' +
      'It does not depend on a single employer and it does not expire with a recruitment cycle.',
    evidence: 'Trade licensing and self employment routes',
    counter: 'There is more than one kind of security. Compare them honestly rather than assuming one.'
  },
  {
    id: 'o5',
    voice: 'parent',
    says: 'What will people say?',
    theme: 'Social',
    answer:
      'Four families within 12 km made this choice in the last three years. Their outcomes are ' +
      'listed below, with workplaces and current earnings where they agreed to share them.',
    evidence: 'Local outcome records',
    counter: 'This concern is never settled by a statistic. It is settled by neighbours.'
  },
  {
    id: 'o6',
    voice: 'parent',
    says: 'We spent on his schooling. This feels like going backwards.',
    theme: 'Sunk cost',
    answer:
      'Nothing already paid for is discarded. Class 10 and Class 12 stay on the record, and the ' +
      'diploma lateral entry route depends on them. What changes is when earning starts.',
    evidence: 'Household position at 24 and 36 months',
    counter: 'Move the frame from status lost to time gained.'
  },
  {
    id: 'o7',
    voice: 'parent',
    says: 'She is a girl. This is not suitable work.',
    theme: 'Gender',
    answer:
      'GNM nursing has the highest placement rate of any path here, and both nursing schools in ' +
      'this district are government run with hostel facilities. Electrician and solar trades now ' +
      'run women only batches at several Skill Hubs.',
    evidence: 'Placement by path, and batch availability',
    counter: 'Answer with the specific trade and the specific institution, not with reassurance.'
  },
  {
    id: 'o8',
    voice: 'student',
    says: 'I do not know what I am good at.',
    theme: 'Direction',
    answer:
      'Then do not start from an aptitude test. Start from exposure. Three trades, one day each, ' +
      'at a centre within 10 km. Decide after seeing the work rather than before.',
    evidence: 'Nearby centres offering taster sessions',
    counter: 'A questionnaire cannot tell you what a workshop floor will.'
  },
  {
    id: 'o9',
    voice: 'student',
    says: 'All my friends are going for the degree.',
    theme: 'Peers',
    answer:
      'That is a real cost and it deserves to be counted rather than dismissed. It is also the ' +
      'reason the trade seat is less crowded and the wage starts earlier.',
    evidence: 'Enrolment distribution across paths',
    counter: 'Acknowledge what it costs. Do not try to argue the feeling away.'
  }
];

/* Outcome records from people who took these routes, within reach of the district. */
export const ALUMNI = [
  {
    id: 'a1', name: 'Rahul K.', block: 'Haveli', km: 6.2, year: 2022,
    path: 'iti-electrician', now: 'Maintenance technician at an auto components plant',
    wage: 24000, note: 'Apprenticed first, then hired by the same plant.'
  },
  {
    id: 'a2', name: 'Sunita B.', block: 'Haveli', km: 8.9, year: 2021,
    path: 'gnm-nursing', now: 'Staff nurse at the district hospital',
    wage: 29000, note: 'Studying post basic B.Sc part time alongside work.'
  },
  {
    id: 'a3', name: 'Imran S.', block: 'Mulshi', km: 11.4, year: 2023,
    path: 'solar-pv', now: 'Rooftop installation, running a two person crew',
    wage: 26000, note: 'Self employed since his second year, taking his own contracts.'
  },
  {
    id: 'a4', name: 'Pooja M.', block: 'Haveli', km: 4.1, year: 2020,
    path: 'diploma-mech', now: 'Junior engineer, now in the second year of a B.E.',
    wage: 31000, note: 'Used the lateral entry route shown on the pathway screen.'
  },
  {
    id: 'a5', name: 'Ajay D.', block: 'Khed', km: 19.7, year: 2022,
    path: 'ba-general', now: 'Preparing for state services, second attempt',
    wage: 0, note: 'Listed because the degree route is not always wrong, and not always right.'
  }
];
