const mongoose = require("mongoose");
const initData = require("../init/data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
require("dotenv").config();

async function seedDB() {
  await mongoose.connect(process.env.MONGO_URL);

  const demoHosts = [
    {
      username: "aanya-host",
      email: "aanya.host@gotrip.demo",
      password: "host12345",
      bio: "Design-loving host who curates peaceful stays with strong coffee, spotless rooms, and local food tips.",
      avatar: {
        filename: "host_aanya",
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
      },
      location: "Jaipur, India",
      hostingSince: 2021,
      languages: ["English", "Hindi"],
    },
    {
      username: "marco-stays",
      email: "marco.stays@gotrip.demo",
      password: "host12345",
      bio: "Former architect sharing character homes, thoughtful interiors, and walkable neighborhood recommendations.",
      avatar: {
        filename: "host_marco",
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
      },
      location: "Florence, Italy",
      hostingSince: 2019,
      languages: ["English", "Italian"],
    },
    {
      username: "maya-retreats",
      email: "maya.retreats@gotrip.demo",
      password: "host12345",
      bio: "Nature-first host focused on quiet escapes, reliable check-ins, and stays that feel easy from arrival.",
      avatar: {
        filename: "host_maya",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80",
      },
      location: "Bali, Indonesia",
      hostingSince: 2020,
      languages: ["English", "Bahasa Indonesia"],
    },
    {
      username: "kabir-homes",
      email: "kabir.homes@gotrip.demo",
      password: "host12345",
      bio: "City host who keeps every stay practical: fast WiFi, clean kitchens, honest guides, and flexible support.",
      avatar: {
        filename: "host_kabir",
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
      },
      location: "Mumbai, India",
      hostingSince: 2022,
      languages: ["English", "Hindi", "Marathi"],
    },
    {
      username: "sofia-villas",
      email: "sofia.villas@gotrip.demo",
      password: "host12345",
      bio: "Beach and villa specialist who loves calm mornings, beautiful views, and helping guests plan slow days.",
      avatar: {
        filename: "host_sofia",
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
      },
      location: "Mykonos, Greece",
      hostingSince: 2018,
      languages: ["English", "Greek", "Spanish"],
    },
  ];

  await User.deleteMany({ username: { $in: demoHosts.map((host) => host.username) } });

  const hosts = [];
  for (const host of demoHosts) {
    const user = new User({
      username: host.username,
      email: host.email,
      bio: host.bio,
      avatar: host.avatar,
      location: host.location,
      hostingSince: host.hostingSince,
      languages: host.languages,
    });
    hosts.push(await User.register(user, host.password));
  }

  await Listing.deleteMany({});
  const listingsWithOwners = initData.data.map((listing, index) => ({
    ...listing,
    owner: hosts[index % hosts.length]._id,
  }));

  await Listing.insertMany(listingsWithOwners);
  console.log(`Database seeded with ${listingsWithOwners.length} listings and ${hosts.length} demo hosts`);
  process.exit();
}

seedDB();
