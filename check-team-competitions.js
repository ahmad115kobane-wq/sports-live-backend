const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeamCompetitions() {
  try {
    console.log('Checking TeamCompetition relationships...\n');
    
    const teamCompetitions = await prisma.teamCompetition.findMany({
      include: {
        team: true,
        competition: true,
      },
    });
    
    console.log('TeamCompetition records:', JSON.stringify(teamCompetitions, null, 2));
    
    console.log('\n\nTeams with their competitions:');
    const teams = await prisma.team.findMany({
      include: {
        competitions: {
          include: {
            competition: true,
          },
        },
      },
    });
    
    teams.forEach(team => {
      console.log(`\n${team.name} (${team.shortName}):`);
      console.log(`  Competitions: ${team.competitions.length}`);
      team.competitions.forEach(tc => {
        console.log(`    - ${tc.competition.name}`);
      });
    });
    
    console.log('\n\nCompetitions with their teams:');
    const competitions = await prisma.competition.findMany({
      include: {
        teams: {
          include: {
            team: true,
          },
        },
      },
    });
    
    competitions.forEach(comp => {
      console.log(`\n${comp.name}:`);
      console.log(`  Teams: ${comp.teams.length}`);
      comp.teams.forEach(tc => {
        console.log(`    - ${tc.team.name}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamCompetitions();
