const { getCollections } = require("../config/db");

function futureDateISO(daysAhead, hour = 9) {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function getInitialEvents() {
  return [
    {
      title: "Winter Clothes Distribution – Mirpur 10, Dhaka",
      description:
        "Join our neighbourhood volunteer brigade at Mirpur 10 Gol Chattar to sort, pack, and distribute warm fleece jackets, shawls, and children's knitwear to 350+ daily-wage rickshaw pullers, street vendors, and elderly residents before the peak January cold wave.",
      eventType: "Donation",
      thumbnail:
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85",
      location: "Mirpur 10, Dhaka",
      eventDate: futureDateISO(9, 10),
      creatorEmail: "coordinator@uddog.org",
      creatorName: "Tanvir Hasan",
      creatorPhoto:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      participantsCount: 42,
      targetVolunteers: 60,
      impactMetric: "350+ Warm Garment Kits",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Blanket Distribution for the Needy – Mohammadpur, Dhaka",
      description:
        "Nighttime outreach drive across Mohammadpur Town Hall, Geneva Camp perimeter, and Shia Mosque intersections. Volunteers will walk in coordinated teams of four to hand-deliver heavy-grade thermal blankets and warm saline packs to families sleeping rough.",
      eventType: "Donation",
      thumbnail:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=85",
      location: "Mohammadpur, Dhaka",
      eventDate: futureDateISO(14, 15),
      creatorEmail: "coordinator@uddog.org",
      creatorName: "Nusrat Jahan",
      creatorPhoto:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
      participantsCount: 58,
      targetVolunteers: 80,
      impactMetric: "500 Thermal Blankets",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Dhanmondi Lake Plastic & Walkway Cleanup Drive",
      description:
        "A Saturday morning civic cleanup along Dhanmondi Lake from Rabindra Sarobar to Road 27 bridge. Gloves, biodegradable collection sacks, and waste-weighing scales will be provided on site as we separate recyclable PET plastic from organic shoreline debris.",
      eventType: "Cleanup",
      thumbnail:
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1000&q=85",
      location: "Dhanmondi 27, Dhaka",
      eventDate: futureDateISO(18, 7),
      creatorEmail: "arif.rahman@uddog.org",
      creatorName: "Arifur Rahman",
      creatorPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
      participantsCount: 36,
      targetVolunteers: 50,
      impactMetric: "800 kg Plastic Recovery",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Urban Roadside Native Sapling Plantation Drive",
      description:
        "Help restore urban shade cover in Uttara Sector 7 and Sector 11 median strips. Working alongside local ward botanists, volunteers will plant 250 native Neem, Krishnachura, and Jarul saplings complete with bamboo protective fencing and compost beds.",
      eventType: "Plantation",
      thumbnail:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=85",
      location: "Uttara Sector 7, Dhaka",
      eventDate: futureDateISO(23, 8),
      creatorEmail: "farhana.akter@uddog.org",
      creatorName: "Farhana Akter",
      creatorPhoto:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
      participantsCount: 49,
      targetVolunteers: 70,
      impactMetric: "250 Native Saplings",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Korail Community Primary Health & Vision Screening Camp",
      description:
        "A full-day community medical camp providing blood pressure checks, blood glucose testing, pediatric nutrition consultations, and free reading glasses for senior citizens living in the Korail community near Banani Lake.",
      eventType: "Medical Camp",
      thumbnail:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=85",
      location: "Korail, Banani, Dhaka",
      eventDate: futureDateISO(29, 9),
      creatorEmail: "dr.mahmud@uddog.org",
      creatorName: "Dr. Mahmudul Karim",
      creatorPhoto:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      participantsCount: 31,
      targetVolunteers: 45,
      impactMetric: "400+ Patient Screenings",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Street Children Literacy & Stationery Kit Distribution",
      description:
        "Assemble and distribute waterproof school backpacks, geometry sets, bilingual storybooks, and solar reading lamps to 180 out-of-school children attending open-air afternoon classes around TSC and Suhrawardy Udyan.",
      eventType: "Education",
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1000&q=85",
      location: "TSC, Dhaka University, Dhaka",
      eventDate: futureDateISO(35, 11),
      creatorEmail: "tasnim.zara@uddog.org",
      creatorName: "Tasnim Zara",
      creatorPhoto:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
      participantsCount: 64,
      targetVolunteers: 75,
      impactMetric: "180 Student Kits",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Buriganga Riverbank Waste Recovery & Eco Sorting",
      description:
        "Mobilizing youth volunteers at Sadarghat Wiseghat terminal to clear single-use polythene and styrofoam accumulation along the river steps, paired with an awareness campaign for launch passengers and ghat vendors.",
      eventType: "Cleanup",
      thumbnail:
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=85",
      location: "Sadarghat, Old Dhaka",
      eventDate: futureDateISO(41, 7),
      creatorEmail: "coordinator@uddog.org",
      creatorName: "Tanvir Hasan",
      creatorPhoto:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      participantsCount: 27,
      targetVolunteers: 55,
      impactMetric: "1.2 Tons Riverbank Waste",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Coastal Mangrove & Embankment Sapling Drive",
      description:
        "Weekend ecological expedition to plant salt-tolerant Keora and Sundari mangrove seedlings along vulnerable river embankments in Dacope to protect farming households from tidal surges and riverbank erosion.",
      eventType: "Plantation",
      thumbnail:
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1000&q=85",
      location: "Dacope, Khulna",
      eventDate: futureDateISO(48, 8),
      creatorEmail: "farhana.akter@uddog.org",
      creatorName: "Farhana Akter",
      creatorPhoto:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
      participantsCount: 44,
      targetVolunteers: 60,
      impactMetric: "1,000 Mangrove Seedlings",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Voluntary Thalassemia & Emergency Blood Grouping Camp",
      description:
        "Partnering with certified hematology technicians to host a safe voluntary blood donation and free blood-grouping camp for university students and community residents supporting thalassemia patients.",
      eventType: "Blood Donation",
      thumbnail:
        "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=85",
      location: "Panthapath, Dhaka",
      eventDate: futureDateISO(54, 10),
      creatorEmail: "dr.mahmud@uddog.org",
      creatorName: "Dr. Mahmudul Karim",
      creatorPhoto:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      participantsCount: 39,
      targetVolunteers: 65,
      impactMetric: "150+ Blood Units Collected",
      createdAt: new Date().toISOString(),
    },
  ];
}

async function ensureUpcomingSeedData() {
  const { eventsCollection } = await getCollections();
  const nowISO = new Date().toISOString();

  const upcomingCount = await eventsCollection.countDocuments({
    eventDate: { $gte: nowISO },
  });

  if (upcomingCount < 6) {
    const seedItems = getInitialEvents();
    for (const item of seedItems) {
      const existing = await eventsCollection.findOne({ title: item.title });
      if (!existing) {
        await eventsCollection.insertOne(item);
      } else if (existing.eventDate < nowISO) {
        await eventsCollection.updateOne(
          { _id: existing._id },
          { $set: { eventDate: item.eventDate } }
        );
      }
    }
  }
}

if (require.main === module && process.argv.includes("--run")) {
  ensureUpcomingSeedData()
    .then(() => {
      console.log("Seeded upcoming social development events in MongoDB.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to seed events:", err);
      process.exit(1);
    });
}

module.exports = {
  getInitialEvents,
  ensureUpcomingSeedData,
};
