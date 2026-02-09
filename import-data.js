/**
 * سكريبت استيراد البيانات من ملفات CSV
 * 
 * الاستخدام:
 * node import-data.js teams ../teams_template.csv
 * node import-data.js players ../players_template.csv
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// قراءة ملف CSV وتحويله إلى مصفوفة من الكائنات
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('الملف فارغ');
  }

  // قراءة الأعمدة من السطر الأول
  const headers = lines[0].split(',').map(h => h.trim());
  
  // قراءة البيانات من الأسطر المتبقية
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      const value = values[index] ? values[index].trim() : '';
      row[header] = value === '' ? null : value;
    });
    
    data.push(row);
  }
  
  return data;
}

// استيراد الأندية
async function importTeams(filePath) {
  console.log('📥 بدء استيراد الأندية...');
  
  const teams = parseCSV(filePath);
  let successCount = 0;
  let errorCount = 0;
  
  for (const team of teams) {
    try {
      // التحقق من وجود النادي
      const existing = await prisma.team.findFirst({
        where: { shortName: team.short_name }
      });
      
      if (existing) {
        console.log(`⚠️  النادي "${team.name}" موجود مسبقاً - تم التخطي`);
        continue;
      }
      
      // إنشاء النادي
      await prisma.team.create({
        data: {
          name: team.name,
          shortName: team.short_name,
          category: team.category || 'FOOTBALL',
          logoUrl: team.logo_url,
          primaryColor: team.primary_color,
          country: team.country,
          city: team.city,
          stadium: team.stadium,
          coach: team.coach,
          founded: team.founded ? parseInt(team.founded) : null,
        }
      });
      
      successCount++;
      console.log(`✅ تم إضافة: ${team.name}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في إضافة "${team.name}":`, error.message);
    }
  }
  
  console.log(`\n📊 النتيجة: ${successCount} نجح، ${errorCount} فشل`);
}

// استيراد اللاعبين
async function importPlayers(filePath) {
  console.log('📥 بدء استيراد اللاعبين...');
  
  const players = parseCSV(filePath);
  let successCount = 0;
  let errorCount = 0;
  
  for (const player of players) {
    try {
      // البحث عن النادي
      const team = await prisma.team.findFirst({
        where: { shortName: player.team_name }
      });
      
      if (!team) {
        console.error(`❌ النادي "${player.team_name}" غير موجود - تم تخطي اللاعب "${player.name}"`);
        errorCount++;
        continue;
      }
      
      // التحقق من وجود اللاعب
      const existing = await prisma.player.findFirst({
        where: {
          teamId: team.id,
          name: player.name
        }
      });
      
      if (existing) {
        console.log(`⚠️  اللاعب "${player.name}" موجود مسبقاً في "${player.team_name}" - تم التخطي`);
        continue;
      }
      
      // إنشاء اللاعب
      await prisma.player.create({
        data: {
          teamId: team.id,
          name: player.name,
          shirtNumber: player.shirt_number ? parseInt(player.shirt_number) : null,
          position: player.position,
          imageUrl: player.image_url,
          nationality: player.nationality,
          dateOfBirth: player.date_of_birth ? new Date(player.date_of_birth) : null,
          height: player.height ? parseInt(player.height) : null,
          weight: player.weight ? parseInt(player.weight) : null,
          preferredFoot: player.preferred_foot,
        }
      });
      
      successCount++;
      console.log(`✅ تم إضافة: ${player.name} (${player.team_name})`);
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في إضافة "${player.name}":`, error.message);
    }
  }
  
  console.log(`\n📊 النتيجة: ${successCount} نجح، ${errorCount} فشل`);
}

// الدالة الرئيسية
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
📖 الاستخدام:
  node import-data.js teams <مسار_ملف_csv>
  node import-data.js players <مسار_ملف_csv>

📝 أمثلة:
  node import-data.js teams ../teams_template.csv
  node import-data.js players ../players_template.csv
    `);
    process.exit(1);
  }
  
  const [type, filePath] = args;
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ الملف غير موجود: ${filePath}`);
    process.exit(1);
  }
  
  try {
    if (type === 'teams') {
      await importTeams(filePath);
    } else if (type === 'players') {
      await importPlayers(filePath);
    } else {
      console.error(`❌ نوع غير صحيح: ${type}. استخدم "teams" أو "players"`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
