require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Task = require("./models/Task");
const TeamMember = require("./models/TeamMember");
const { TEAM_DATA } = require("./utils/teamData");

function fmt(d) {
  return d.toISOString().split("T")[0];
}
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

async function seed() {
  await connectDB();
  const today = new Date();

  const demoTasks = [
    { employeeName: "Sojwal Sir", projectName: "Gram Panchayat", title: "Village data verification", description: "Verify household records submitted for the Gram Panchayat module.", priority: "High", status: "In Progress", startDate: fmt(addDays(today, -3)), deadline: fmt(addDays(today, 1)), startTime: "09:00", endTime: "13:00" },
    { employeeName: "Pranjal", projectName: "Gram Panchayat", title: "Fix login OTP issue", description: "Resolve OTP delivery delay reported by field users.", priority: "High", status: "Pending", startDate: fmt(today), deadline: fmt(addDays(today, 2)), startTime: "10:00", endTime: "12:00" },
    { employeeName: "Rushi", projectName: "Gram Panchayat", title: "UI polish for dashboard", description: "Improve spacing and mobile responsiveness of the panchayat dashboard.", priority: "Medium", status: "Completed", startDate: fmt(addDays(today, -6)), deadline: fmt(addDays(today, -1)), startTime: "14:00", endTime: "17:00" },
    // Gaurav Sir has two tasks that both start "today" — different time
    // slots on the same day, showing multiple tasks per employee per day
    // is expected, not a conflict.
    { employeeName: "Gaurav Sir", projectName: "Exam Panel", title: "Configure new exam pattern", description: "Set up question distribution rules for the upcoming exam cycle.", priority: "High", status: "In Progress", startDate: fmt(addDays(today, -2)), deadline: fmt(addDays(today, 3)), startTime: "09:30", endTime: "11:30" },
    { employeeName: "Gaurav Sir", projectName: "Data Entry Panel", title: "Bulk upload validation", description: "Add validation checks for bulk student data uploads.", priority: "Medium", status: "Pending", startDate: fmt(today), deadline: fmt(addDays(today, 4)), startTime: "13:00", endTime: "15:00" },
    { employeeName: "Jayesh Sir", projectName: "Track Spot", title: "GPS tracking accuracy fix", description: "Improve live location accuracy on the tracking module.", priority: "High", status: "In Progress", startDate: fmt(addDays(today, -1)), deadline: fmt(addDays(today, 2)), startTime: "09:00", endTime: "12:00" },
    { employeeName: "Jayesh Sir", projectName: "Aza LMS", title: "Course completion certificate", description: "Auto-generate certificates once a learner finishes a course.", priority: "Low", status: "Completed", startDate: fmt(addDays(today, -8)), deadline: fmt(addDays(today, -2)), startTime: "11:00", endTime: "12:30" },
    { employeeName: "Nikita Madam", projectName: "Language Lab Project", title: "Pronunciation module testing", description: "QA the speech-scoring feature across three sample lessons.", priority: "Medium", status: "Pending", startDate: fmt(today), deadline: fmt(addDays(today, 5)), startTime: "10:00", endTime: "13:00" },
    { employeeName: "Dipali Madam", projectName: "Apla Neta", title: "Candidate profile page", description: "Build the public candidate profile page with voting stats.", priority: "High", status: "In Progress", startDate: fmt(addDays(today, -4)), deadline: fmt(addDays(today, 1)), startTime: "09:00", endTime: "14:00" },
    { employeeName: "Dipali Madam", projectName: "Maza Nagar Sevak", title: "Complaint status tracker", description: "Add status timeline for citizen-raised complaints.", priority: "Medium", status: "Completed", startDate: fmt(addDays(today, -7)), deadline: fmt(addDays(today, -3)), startTime: "15:00", endTime: "17:00" },
    { employeeName: "Ashwini Mokate", projectName: "Backend Support", title: "API rate-limit tuning", description: "Adjust rate limits after last week's traffic spike.", priority: "Low", status: "Pending", startDate: fmt(today), deadline: fmt(addDays(today, 6)), startTime: "09:00", endTime: "11:00" }
  ];

  await Task.deleteMany({});
  await Task.insertMany(demoTasks);
  console.log(`[Seed] Inserted ${demoTasks.length} demo tasks.`);

  const demoMembers = Object.entries(TEAM_DATA).map(([name, projects]) => ({ name, projects }));
  await TeamMember.deleteMany({});
  await TeamMember.insertMany(demoMembers);
  console.log(`[Seed] Inserted ${demoMembers.length} team members.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
