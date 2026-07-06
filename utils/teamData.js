// Team roster: employee -> list of assigned projects.
// This mirrors the real project-assignment sheet used by the team lead
// and is treated as reference/config data rather than a Mongo collection,
// since it changes rarely and is small.

const TEAM_DATA = {
  "Sojwal Sir":     ["Gram Panchayat", "Panchayat Samiti"],
  "Pranjal":        ["Gram Panchayat"],
  "Rushi":          ["Gram Panchayat"],
  "Gaurav Sir":     ["Code Drift Uttiran", "Language Lab Project", "Career Jupiter", "Exam Panel", "Master Panel", "QP Panel", "Data Entry Panel", "Form Filling Panel"],
  "Jayesh Sir":     ["Track Spot", "Trekvede", "Vatydya", "Nashikcha Khabharnama", "Aza LMS", "Git Up Skill"],
  "Ashwini Mokate": ["Backend Support"],
  "Nikita Madam":   ["Language Lab Project"],
  "Dipali Madam":   ["Gruha Mumbai Project", "Maza Nagar Sevak", "Apla Neta", "Language Lab"]
};

module.exports = { TEAM_DATA };
