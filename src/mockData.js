export const TEAMS_DATA = [
  {
    id: "gla",
    name: "Gladiators",
    shortName: "GLA",
    color: "from-blue-600 to-indigo-700",
    bgClass: "bg-blue-600",
    borderClass: "border-blue-500",
    textClass: "text-blue-400",
    emoji: "🛡️",
    squad: [
      { id: "g1", name: "K. L. Rahul (C/WK)" },
      { id: "g2", name: "S. Iyer" },
      { id: "g3", name: "H. Pandya" },
      { id: "g4", name: "K. Pandya" },
      { id: "g5", name: "R. Bishnoi" },
      { id: "g6", name: "M. Wood" },
      { id: "g7", name: "A. Mishra" }
    ],
    stats: { played: 3, won: 2, lost: 1, points: 4, nrr: 0.85 }
  },
  {
    id: "bbu",
    name: "Boundary Busters",
    shortName: "BBU",
    color: "from-red-600 to-rose-700",
    bgClass: "bg-red-600",
    borderClass: "border-red-500",
    textClass: "text-red-400",
    emoji: "💥",
    squad: [
      { id: "b1", name: "R. Sharma (C)" },
      { id: "b2", name: "I. Kishan (WK)" },
      { id: "b3", name: "S. Yadav" },
      { id: "b4", name: "T. David" },
      { id: "b5", name: "J. Bumrah" },
      { id: "b6", name: "P. Chawla" },
      { id: "b7", name: "G. Coetzee" }
    ],
    stats: { played: 3, won: 2, lost: 1, points: 4, nrr: 0.42 }
  },
  {
    id: "yki",
    name: "Yorker Kings",
    shortName: "YKI",
    color: "from-amber-600 to-yellow-700",
    bgClass: "bg-amber-600",
    borderClass: "border-amber-500",
    textClass: "text-amber-400",
    emoji: "🎯",
    squad: [
      { id: "y1", name: "S. Samson (C/WK)" },
      { id: "y2", name: "Y. Jaiswal" },
      { id: "y3", name: "J. Buttler" },
      { id: "y4", name: "R. Parag" },
      { id: "y5", name: "Y. Chahal" },
      { id: "y6", name: "T. Boult" },
      { id: "y7", name: "S. Sharma" }
    ],
    stats: { played: 3, won: 3, lost: 0, points: 6, nrr: 1.56 }
  },
  {
    id: "swi",
    name: "Spin Wizards",
    shortName: "SWI",
    color: "from-purple-600 to-fuchsia-700",
    bgClass: "bg-purple-600",
    borderClass: "border-purple-500",
    textClass: "text-purple-400",
    emoji: "🔮",
    squad: [
      { id: "s1", name: "M. S. Dhoni (C/WK)" },
      { id: "s2", name: "R. Gaikwad" },
      { id: "s3", name: "S. Dube" },
      { id: "s4", name: "R. Jadeja" },
      { id: "s5", name: "M. Pathirana" },
      { id: "s6", name: "M. Theekshana" },
      { id: "s7", name: "T. Deshpande" }
    ],
    stats: { played: 3, won: 1, lost: 2, points: 2, nrr: -0.62 }
  },
  {
    id: "phi",
    name: "Power Hitters",
    shortName: "PHI",
    color: "from-emerald-600 to-teal-700",
    bgClass: "bg-emerald-600",
    borderClass: "border-emerald-500",
    textClass: "text-emerald-400",
    emoji: "⚡",
    squad: [
      { id: "p1", name: "S. Gill (C)" },
      { id: "p2", name: "W. Saha (WK)" },
      { id: "p3", name: "B. Sai Sudharsan" },
      { id: "p4", name: "D. Miller" },
      { id: "p5", name: "R. Khan" },
      { id: "p6", name: "M. Shami" },
      { id: "p7", name: "M. Sharma" }
    ],
    stats: { played: 3, won: 1, lost: 2, points: 2, nrr: -0.34 }
  },
  {
    id: "sst",
    name: "Seam Strikers",
    shortName: "SST",
    color: "from-cyan-600 to-blue-700",
    bgClass: "bg-cyan-600",
    borderClass: "border-cyan-500",
    textClass: "text-cyan-400",
    emoji: "🌪️",
    squad: [
      { id: "ss1", name: "S. Iyer (C)" },
      { id: "ss2", name: "P. Salt (WK)" },
      { id: "ss3", name: "V. Iyer" },
      { id: "ss4", name: "R. Singh" },
      { id: "ss5", name: "A. Russell" },
      { id: "ss6", name: "S. Narine" },
      { id: "ss7", name: "M. Starc" }
    ],
    stats: { played: 3, won: 0, lost: 3, points: 0, nrr: -1.82 }
  }
];

export const SCHEDULE_DATA = [
  {
    id: "m1",
    matchNo: 1,
    teamA: "Yorker Kings",
    teamB: "Seam Strikers",
    emojiA: "🎯",
    emojiB: "🌪️",
    status: "completed",
    date: "July 10, 2026",
    time: "4:00 PM",
    venue: "Howzat Arena, Pitch A",
    scoreA: "76/2 (6.0 ov)",
    scoreB: "52/5 (6.0 ov)",
    result: "Yorker Kings won by 24 runs"
  },
  {
    id: "m2",
    matchNo: 2,
    teamA: "Gladiators",
    teamB: "Spin Wizards",
    emojiA: "🛡️",
    emojiB: "🔮",
    status: "completed",
    date: "July 10, 2026",
    time: "7:00 PM",
    venue: "Howzat Arena, Pitch B",
    scoreA: "59/3 (6.0 ov)",
    scoreB: "58/4 (6.0 ov)",
    result: "Gladiators won by 1 run"
  },
  {
    id: "m3",
    matchNo: 3,
    teamA: "Boundary Busters",
    teamB: "Power Hitters",
    emojiA: "💥",
    emojiB: "⚡",
    status: "completed",
    date: "July 11, 2026",
    time: "4:00 PM",
    venue: "Howzat Arena, Pitch A",
    scoreA: "84/1 (6.0 ov)",
    scoreB: "80/3 (6.0 ov)",
    result: "Boundary Busters won by 4 runs"
  },
  {
    id: "m4",
    matchNo: 4,
    teamA: "Gladiators",
    teamB: "Yorker Kings",
    emojiA: "🛡️",
    emojiB: "🎯",
    status: "live",
    date: "July 12, 2026",
    time: "4:00 PM",
    venue: "Howzat Arena, Main Ground",
    scoreA: "Currently playing",
    scoreB: "",
    result: ""
  },
  {
    id: "m5",
    matchNo: 5,
    teamA: "Spin Wizards",
    teamB: "Boundary Busters",
    emojiA: "🔮",
    emojiB: "💥",
    status: "upcoming",
    date: "July 12, 2026",
    time: "7:30 PM",
    venue: "Howzat Arena, Main Ground",
    scoreA: "",
    scoreB: "",
    result: ""
  },
  {
    id: "m6",
    matchNo: 6,
    teamA: "Power Hitters",
    teamB: "Seam Strikers",
    emojiA: "⚡",
    emojiB: "🌪️",
    status: "upcoming",
    date: "July 13, 2026",
    time: "6:00 PM",
    venue: "Howzat Arena, Main Ground",
    scoreA: "",
    scoreB: "",
    result: ""
  }
];

export const RULES = [
  "Match duration is exactly 6 overs (36 legal deliveries) per innings.",
  "Max 2 overs per bowler.",
  "Powerplay is active for the first 2 overs of each innings (max 2 fielders outside the circle).",
  "Wide balls and No balls grant 1 run to the opposition and must be re-bowled.",
  "A No ball is followed by a Free Hit on the next delivery.",
  "Maximum of 7 players per squad in the field. 10 wickets are not required; when 6 wickets fall, the innings is declared closed.",
  "Target chase: The team batting second has 6 overs to exceed the opponent's score."
];
