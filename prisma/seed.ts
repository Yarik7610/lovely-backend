import { Gender, PrismaClient } from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const password = "12345Aa*"
  const hashedPassword = await bcrypt.hash(password, 10)

  const users = Array.from({ length: 100 }, (_, i) => ({
    email: `user${i + 1}@example.com`,
    emailVerified: true,
    hashedPassword,
    name: `Person ${i + 1}`,
    age: Math.floor(Math.random() * (40 - 18 + 1)) + 18,
    gender: [Gender.male, Gender.female, Gender.other][Math.floor(Math.random() * 3)],
    city: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"][Math.floor(Math.random() * 5)],
    bio: `Biography of person ${i + 1}`,
    photoUrls: JSON.stringify([`https://example.com/photo${i + 1}.jpg`])
  }))

  await prisma.user.createMany({
    data: users
  })

  const interests = [
    "Cooking",
    "Rock",
    "Funk",
    "Baseball",
    "Football",
    "Basketball",
    "Tennis",
    "Yoga",
    "Swimming",
    "Running",
    "Fitness",
    "Dancing",
    "Ballet",
    "Hip-hop",
    "Jazz",
    "Classical",
    "Movies",
    "Theater",
    "Books",
    "Poetry",
    "Painting",
    "Photography",
    "Traveling",
    "Nature",
    "Mountains",
    "Sea",
    "Hiking",
    "Camping",
    "Fishing",
    "Hunting",
    "Video games",
    "Board games",
    "Chess",
    "Poker",
    "Programming",
    "Design",
    "Fashion",
    "Cuisine",
    "Wine",
    "Coffee",
    "Tea",
    "Music",
    "Guitar",
    "Piano",
    "Violin",
    "Astronomy",
    "Space",
    "Science",
    "History",
    "Philosophy",
    "Psychology",
    "Meditation",
    "Surfing",
    "Skateboarding",
    "Snowboarding"
  ]

  await prisma.interest.createMany({
    data: interests.map((name) => ({ name }))
  })

  const createdUsers = await prisma.user.findMany()
  const createdInterests = await prisma.interest.findMany()

  for (const user of createdUsers) {
    const numInterests = Math.floor(Math.random() * (10 - 3 + 1)) + 3
    const shuffledInterests = createdInterests.sort(() => 0.5 - Math.random())
    const selectedInterests = shuffledInterests.slice(0, numInterests)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        interests: {
          connect: selectedInterests.map((interest) => ({ id: interest.id }))
        }
      }
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(
    void (async () => {
      await prisma.$disconnect()
    })()
  )
