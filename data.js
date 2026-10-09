// =====================================================================
//  YOUR DATA  -  this is the only file you need to change.
//  Change the words between the quotes, save the file, and refresh the page.
//  Keep the commas and the quotes. If you add a new item, copy one whole
//  { ... } block and put a comma after the one before it.
// =====================================================================
const DATA = {
  name: 'Akshum Garg',
  tagline: 'Student developer',   // keep it short (under 20 letters). It is written on the big painting

  // Shown when you click the big painting on the back wall
  about: 'I am a B.Tech Software Engineering student at Delhi Technological University (2024-2028), with a CGPA of 8.88. I have worked with React and Django, and I have studied machine learning and satellite data.',

  // Right wall sign
  skills: [
    { group: 'Languages', items: ['C', 'C++', 'HTML', 'CSS', 'JavaScript', 'Python'] },
    { group: 'Frameworks', items: ['React', 'Django', 'Django REST', 'Android'] },
    { group: 'Tools', items: ['Git', 'VSCode', 'GEE', 'Jupyter Notebook'] }
  ],

  // Left wall boards (room for 4). They look like Minecraft "advancements".
  // title = big words on the board, subtitle and detail = the two small lines under it
  achievementsTitle: 'Achievements',   // heading of the window that opens
  achievementsShort: 'Awards',         // short name on the bottom bar (keep it short)
  achievements: [
    { title: 'JEE Advanced 2024', subtitle: 'AIR 5047', detail: 'Among 180,000+ qualified',
      points: ['Secured AIR 5047 in JEE Advanced 2024 among 180,000+ qualified candidates.'] },
    { title: 'ML Specialization', subtitle: 'Andrew Ng, Coursera', detail: 'DeepLearning.AI',
      points: ['Completed the Machine Learning Specialization by Andrew Ng (Coursera, DeepLearning.AI).',
               'It covered supervised and unsupervised learning, neural networks, and ML best practices.'] },
    { title: '200+ DSA problems', subtitle: 'LeetCode, Codeforces', detail: 'Graphs, DP and trees',
      points: ['Solved 200+ DSA problems across LeetCode and Codeforces.',
               'Topics: arrays, graphs, dynamic programming, and trees.'] },
    { title: 'Mentoring (MS299)', subtitle: 'Community Outreach, DTU', detail: 'Class 10 students',
      points: ['Mentored Class 10 students at a government school on future academic and career pathways, as part of MS299 (Community Outreach) at Delhi Technological University.'] }
  ],

  // The chests in the middle of the room (room for 3)
  projects: [
    {
      name: 'BAH 2026: Surface AQI',   // keep it under 22 letters. It floats above the chest
      tech: ['Python', 'Google Earth Engine', 'TROPOMI', 'ERA5', 'MODIS'],
      desc: 'BAH 2026 project: surface AQI prediction and HCHO (formaldehyde) hotspot detection from satellite data.',
      points: [
        'Processed Sentinel-5P TROPOMI HCHO column data over India using Google Earth Engine to detect formaldehyde hotspots during the Oct-Nov crop burning season. Found 1,182 hotspot cells, mostly over Punjab, Haryana, Delhi-NCR, and UP.',
        'Found a statistically significant fire-HCHO correlation with a 5-day atmospheric transport lag, confirmed with ERA5 wind back-trajectory analysis that traced smoke plumes toward Delhi-NCR.'
      ],
      link: 'https://github.com/akshumgarg'   // TODO: paste the exact link of this project here
    }
  ],

  // Front wall sign (the sign shows only the "degree" line of each item)
  education: [
    { degree: 'B.Tech Software Engineering', school: 'Delhi Technological University, New Delhi', period: '2024 - 2028', score: 'CGPA 8.88' },
    { degree: 'Class XII (AISSCE, CBSE)', school: 'Bharatmata Saraswati Bal Mandir Senior Sec. School', period: '2024', score: '87.60%' },
    { degree: 'Class X (AISCE, CBSE)', school: 'OSDAV Public School', period: '2022', score: '93.20%' }
  ],

  contact: {
    email: 'akshumgarg20@gmail.com',
    github: 'https://github.com/akshumgarg',
    linkedin: 'https://www.linkedin.com/in/akshum-garg-06840b2b7/'
    // phone: '+91 XXXXXXXXXX'   // remove the // at the start to show a phone number. Think first: this page is public
  }
};
