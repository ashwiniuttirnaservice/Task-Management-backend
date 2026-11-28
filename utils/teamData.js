// Team roster: employee -> list of assigned projects.
// This mirrors the real project-assignment sheet used by the team lead
// and is treated as reference/config data rather than a Mongo collection,
// since it changes rarely and is small.

const TEAM_DATA = [
  { name: "Sojwal Sir",     workingEmail: "sojwal@uttirna.in",     role: "admin",    position: "fullStack",  projects: ["Gram Panchayat", "Panchayat Samiti"] },
  { name: "Pranjal",        workingEmail: "pranjal@uttirna.in",    role: "employee", position: "fullStack",  projects: ["Gram Panchayat"] },
  { name: "Rushi",          workingEmail: "rushi@uttirna.in",      role: "employee", position: "frontend",   projects: ["Gram Panchayat"] },
  { name: "Gaurav Sir",     workingEmail: "gaurav@uttirna.in",     role: "admin",    position: "backend",    projects: ["Code Drift Uttiran", "Language Lab Project", "Career Jupiter", "Exam Panel", "Master Panel", "QP Panel", "Data Entry Panel", "Form Filling Panel"] },
  { name: "Jayesh Sir",     workingEmail: "jayesh@uttirna.in",     role: "admin",    position: "fullStack",  projects: ["Track Spot", "Trekvede", "Vatydya", "Nashikcha Khabharnama", "Aza LMS", "Git Up Skill"] },
  { name: "Ashwini Mokate", workingEmail: "ashwini@uttirna.in",    role: "employee", position: "backend",    projects: ["Backend Support"] },
  { name: "Nikita Madam",   workingEmail: "nikita@uttirna.in",     role: "admin",    position: "frontend",   projects: ["Language Lab Project"] },
  { name: "Dipali Madam",   workingEmail: "dipali@uttirna.in",     role: "employee", position: "fullStack",  projects: ["Gruha Mumbai Project", "Maza Nagar Sevak", "Apla Neta", "Language Lab"] },
];

module.exports = { TEAM_DATA };
