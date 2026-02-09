const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  console.log('Teams in database:');
  console.log(JSON.stringify(teams, null, 2));
  
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    take: 3,
  });
  console.log('\nMatches with teams:');
  console.log(JSON.stringify(matches.map(m => ({
    id: m.id,
    homeTeam: { name: m.homeTeam.name, shortName: m.homeTeam.shortName },
    awayTeam: { name: m.awayTeam.name, shortName: m.awayTeam.shortName },
  })), null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
