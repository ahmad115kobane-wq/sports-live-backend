import { Router } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// DELETE /api/seed — مسح جميع البيانات
router.delete('/', async (req, res) => {
  try {
    await prisma.event.deleteMany();
    await prisma.matchOperator.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.lineupPlayer.deleteMany();
    await prisma.matchLineup.deleteMany();
    await prisma.match.deleteMany();
    await prisma.player.deleteMany();
    await prisma.teamCompetition.deleteMany();
    await prisma.team.deleteMany();
    await prisma.competition.deleteMany();
    await prisma.storeOrderItem.deleteMany();
    await prisma.storeOrder.deleteMany();
    await prisma.storeProduct.deleteMany();
    await prisma.storeCategory.deleteMany();
    await prisma.storeBanner.deleteMany();
    await prisma.newsArticle.deleteMany();
    await prisma.homeSlider.deleteMany();
    await prisma.legalPage.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    res.json({ success: true, message: 'All data deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed: ' + error.message });
  }
});

// POST /api/seed — إضافة البيانات الافتراضية (مرة واحدة)
router.post('/', async (req, res) => {
  try {
    // تحقق إذا البيانات موجودة مسبقاً
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0 && req.query.force !== 'true') {
      return res.json({ success: false, message: 'Database already seeded. Use ?force=true to re-seed (will delete existing data first).' });
    }

    // إذا force=true، امسح البيانات أولاً
    if (existingUsers > 0) {
      await prisma.event.deleteMany();
      await prisma.matchOperator.deleteMany();
      await prisma.favorite.deleteMany();
      await prisma.lineupPlayer.deleteMany();
      await prisma.matchLineup.deleteMany();
      await prisma.match.deleteMany();
      await prisma.player.deleteMany();
      await prisma.teamCompetition.deleteMany();
      await prisma.team.deleteMany();
      await prisma.competition.deleteMany();
      await prisma.storeOrderItem.deleteMany();
      await prisma.storeOrder.deleteMany();
      await prisma.storeProduct.deleteMany();
      await prisma.storeCategory.deleteMany();
      await prisma.storeBanner.deleteMany();
      await prisma.newsArticle.deleteMany();
      await prisma.homeSlider.deleteMany();
      await prisma.legalPage.deleteMany();
      await prisma.notification.deleteMany();
      await prisma.user.deleteMany();
    }

    console.log('🌱 Starting database seed via API...');

    // ============================================
    // USERS
    // ============================================
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: { name: 'المدير', email: 'admin@sportslive.com', passwordHash: adminPassword, role: 'admin' },
    });

    const operatorPassword = await bcrypt.hash('operator123', 10);
    const operator = await prisma.user.create({
      data: { name: 'مشغل المباريات', email: 'operator@sportslive.com', passwordHash: operatorPassword, role: 'operator' },
    });

    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = await prisma.user.create({
      data: { name: 'أحمد محمد', email: 'user@sportslive.com', passwordHash: userPassword, role: 'user' },
    });

    // ============================================
    // COMPETITIONS
    // ============================================
    const competitions = [
      { id: 'iraqi-league', name: 'الدوري العراقي الممتاز', shortName: 'الدوري', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-league.png', type: 'football', icon: 'football', sortOrder: 1, isActive: true },
      { id: 'iraqi-cup', name: 'كأس العراق', shortName: 'الكأس', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-cup.png', type: 'football', icon: 'trophy', sortOrder: 2, isActive: true },
      { id: 'iraqi-super-cup', name: 'كأس السوبر العراقي', shortName: 'السوبر', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-super.png', type: 'football', icon: 'star', sortOrder: 3, isActive: true },
      { id: 'iraqi-basketball', name: 'كأس العراق لكرة السلة', shortName: 'السلة', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-basketball.png', type: 'basketball', icon: 'basketball', sortOrder: 4, isActive: true },
      { id: 'iraqi-futsal', name: 'بطولة العراق للكرة المصغرة', shortName: 'المصغرة', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-futsal.png', type: 'futsal', icon: 'football-outline', sortOrder: 5, isActive: true },
      { id: 'iraqi-women', name: 'بطولة العراق النسوية', shortName: 'النسوية', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-women.png', type: 'women', icon: 'people', sortOrder: 6, isActive: true },
      { id: 'iraqi-national', name: 'المنتخبات الوطنية', shortName: 'المنتخبات', country: 'العراق', season: '2025-2026', logoUrl: '/competitions/iraqi-national.png', type: 'national', icon: 'flag', sortOrder: 7, isActive: true },
    ];

    for (const comp of competitions) {
      await prisma.competition.create({ data: comp });
    }

    // ============================================
    // TEAMS
    // ============================================
    const teams = [
      { id: 'team-quwa-jawiya', name: 'القوة الجوية', shortName: 'QWA', category: 'FOOTBALL', primaryColor: '#1E3A8A', country: 'العراق', logoUrl: '/teams/quwa-jawiya.png' },
      { id: 'team-shorta', name: 'الشرطة', shortName: 'SHR', category: 'FOOTBALL', primaryColor: '#166534', country: 'العراق', logoUrl: '/teams/shorta.png' },
    ];

    for (const team of teams) {
      await prisma.team.create({ data: team });
    }

    // ============================================
    // TEAM-COMPETITION RELATIONSHIPS
    // ============================================
    await prisma.teamCompetition.createMany({
      data: [
        { teamId: 'team-quwa-jawiya', competitionId: 'iraqi-league', season: '2025-2026' },
        { teamId: 'team-shorta', competitionId: 'iraqi-league', season: '2025-2026' },
        { teamId: 'team-quwa-jawiya', competitionId: 'iraqi-cup', season: '2025-2026' },
        { teamId: 'team-shorta', competitionId: 'iraqi-cup', season: '2025-2026' },
      ],
    });

    // ============================================
    // PLAYERS
    // ============================================
    const quwaJawiyaPlayers = [
      { name: 'جلال حسن', shirtNumber: 1, position: 'Goalkeeper', nationality: 'العراق' },
      { name: 'علي عدنان', shirtNumber: 2, position: 'Defender', nationality: 'العراق' },
      { name: 'أحمد إبراهيم', shirtNumber: 3, position: 'Defender', nationality: 'العراق' },
      { name: 'سعد عبد الأمير', shirtNumber: 4, position: 'Defender', nationality: 'العراق' },
      { name: 'ريبين سولاقا', shirtNumber: 5, position: 'Defender', nationality: 'العراق' },
      { name: 'أيمن حسين', shirtNumber: 7, position: 'Forward', nationality: 'العراق' },
      { name: 'محمد قاسم', shirtNumber: 8, position: 'Midfielder', nationality: 'العراق' },
      { name: 'علاء عباس', shirtNumber: 9, position: 'Forward', nationality: 'العراق' },
      { name: 'إبراهيم بايش', shirtNumber: 10, position: 'Midfielder', nationality: 'العراق' },
      { name: 'حسين علي', shirtNumber: 11, position: 'Forward', nationality: 'العراق' },
      { name: 'أمجد عطوان', shirtNumber: 14, position: 'Midfielder', nationality: 'العراق' },
      { name: 'محمد علي', shirtNumber: 17, position: 'Midfielder', nationality: 'العراق' },
      { name: 'علي فائز', shirtNumber: 20, position: 'Midfielder', nationality: 'العراق' },
      { name: 'شيركو كريم', shirtNumber: 23, position: 'Forward', nationality: 'العراق' },
    ];

    for (const player of quwaJawiyaPlayers) {
      await prisma.player.create({ data: { ...player, teamId: 'team-quwa-jawiya' } });
    }

    const shortaPlayers = [
      { name: 'فهد طالب', shirtNumber: 1, position: 'Goalkeeper', nationality: 'العراق' },
      { name: 'حسام كاظم', shirtNumber: 2, position: 'Defender', nationality: 'العراق' },
      { name: 'علي حسين', shirtNumber: 3, position: 'Defender', nationality: 'العراق' },
      { name: 'أحمد جلال', shirtNumber: 4, position: 'Defender', nationality: 'العراق' },
      { name: 'محمد كاصد', shirtNumber: 5, position: 'Defender', nationality: 'العراق' },
      { name: 'عمار عبد الحسين', shirtNumber: 6, position: 'Midfielder', nationality: 'العراق' },
      { name: 'مهند علي', shirtNumber: 7, position: 'Forward', nationality: 'العراق' },
      { name: 'حمزة عدنان', shirtNumber: 8, position: 'Midfielder', nationality: 'العراق' },
      { name: 'مروان حسين', shirtNumber: 9, position: 'Forward', nationality: 'العراق' },
      { name: 'علي جاسم', shirtNumber: 10, position: 'Midfielder', nationality: 'العراق' },
      { name: 'بشار رسن', shirtNumber: 11, position: 'Forward', nationality: 'العراق' },
      { name: 'أحمد عبد الزهرة', shirtNumber: 14, position: 'Midfielder', nationality: 'العراق' },
      { name: 'سيف سمير', shirtNumber: 17, position: 'Forward', nationality: 'العراق' },
      { name: 'ياسين حمود', shirtNumber: 22, position: 'Defender', nationality: 'العراق' },
    ];

    for (const player of shortaPlayers) {
      await prisma.player.create({ data: { ...player, teamId: 'team-shorta' } });
    }

    // ============================================
    // MATCHES
    // ============================================
    const now = new Date();

    const liveMatch = await prisma.match.create({
      data: { competitionId: 'iraqi-league', homeTeamId: 'team-quwa-jawiya', awayTeamId: 'team-shorta', startTime: new Date(now.getTime() - 55 * 60000), status: 'live', homeScore: 2, awayScore: 1, currentMinute: 55, isFeatured: true, venue: 'ملعب الشعب الدولي' },
    });

    const halftimeMatch = await prisma.match.create({
      data: { competitionId: 'iraqi-league', homeTeamId: 'team-shorta', awayTeamId: 'team-quwa-jawiya', startTime: new Date(now.getTime() - 47 * 60000), status: 'halftime', homeScore: 1, awayScore: 1, currentMinute: 45, isFeatured: true, venue: 'ملعب الكرخ' },
    });

    const scheduledMatch = await prisma.match.create({
      data: { competitionId: 'iraqi-league', homeTeamId: 'team-quwa-jawiya', awayTeamId: 'team-shorta', startTime: new Date(now.getTime() + 2 * 3600000), status: 'scheduled', venue: 'ملعب الشعب الدولي' },
    });

    await prisma.match.create({
      data: { competitionId: 'iraqi-league', homeTeamId: 'team-shorta', awayTeamId: 'team-quwa-jawiya', startTime: new Date(now.getTime() + 24 * 3600000), status: 'scheduled', venue: 'ملعب الشعب الدولي' },
    });

    await prisma.match.create({
      data: { competitionId: 'iraqi-cup', homeTeamId: 'team-quwa-jawiya', awayTeamId: 'team-shorta', startTime: new Date(now.getTime() + 26 * 3600000), status: 'scheduled', isFeatured: true, venue: 'ملعب كربلاء الدولي' },
    });

    await prisma.match.create({
      data: { competitionId: 'iraqi-league', homeTeamId: 'team-shorta', awayTeamId: 'team-quwa-jawiya', startTime: new Date(now.getTime() - 3 * 3600000), status: 'finished', homeScore: 2, awayScore: 2, venue: 'ملعب الكرخ' },
    });

    await prisma.match.create({
      data: { competitionId: 'iraqi-league', homeTeamId: 'team-quwa-jawiya', awayTeamId: 'team-shorta', startTime: new Date(now.getTime() - 20 * 3600000), status: 'finished', homeScore: 3, awayScore: 1, venue: 'ملعب الشعب الدولي' },
    });

    // ============================================
    // EVENTS
    // ============================================
    const aymanHussein = await prisma.player.findFirst({ where: { name: 'أيمن حسين' } });
    const alaaAbbas = await prisma.player.findFirst({ where: { name: 'علاء عباس' } });
    const ibrahimBayesh = await prisma.player.findFirst({ where: { name: 'إبراهيم بايش' } });
    const mohanadAli = await prisma.player.findFirst({ where: { name: 'مهند علي' } });
    const basharRasan = await prisma.player.findFirst({ where: { name: 'بشار رسن' } });

    if (aymanHussein && alaaAbbas && mohanadAli) {
      await prisma.event.createMany({
        data: [
          { matchId: liveMatch.id, minute: 12, type: 'goal', teamId: 'team-quwa-jawiya', playerId: aymanHussein.id, description: 'هدف رائع من أيمن حسين!', createdById: operator.id },
          { matchId: liveMatch.id, minute: 23, type: 'yellow_card', teamId: 'team-shorta', playerId: mohanadAli.id, description: 'بطاقة صفراء', createdById: operator.id },
          { matchId: liveMatch.id, minute: 34, type: 'goal', teamId: 'team-shorta', playerId: mohanadAli.id, description: 'هدف التعادل!', createdById: operator.id },
          { matchId: liveMatch.id, minute: 51, type: 'goal', teamId: 'team-quwa-jawiya', playerId: alaaAbbas.id, description: 'هدف! علاء عباس يسجل هدف التقدم!', createdById: operator.id },
        ],
      });
    }

    if (basharRasan && ibrahimBayesh) {
      await prisma.event.createMany({
        data: [
          { matchId: halftimeMatch.id, minute: 15, type: 'goal', teamId: 'team-shorta', playerId: basharRasan.id, description: 'بشار رسن يفتتح التسجيل!', createdById: operator.id },
          { matchId: halftimeMatch.id, minute: 38, type: 'goal', teamId: 'team-quwa-jawiya', playerId: ibrahimBayesh.id, description: 'التعادل من إبراهيم بايش!', createdById: operator.id },
        ],
      });
    }

    // ============================================
    // MATCH OPERATORS
    // ============================================
    await prisma.matchOperator.createMany({
      data: [
        { matchId: liveMatch.id, operatorId: operator.id },
        { matchId: halftimeMatch.id, operatorId: operator.id },
        { matchId: scheduledMatch.id, operatorId: operator.id },
      ],
    });

    // ============================================
    // FAVORITES
    // ============================================
    await prisma.favorite.createMany({
      data: [
        { userId: normalUser.id, matchId: liveMatch.id },
        { userId: normalUser.id, matchId: halftimeMatch.id },
      ],
    });

    // ============================================
    // STORE
    // ============================================
    const catShoes = await prisma.storeCategory.create({ data: { name: 'Shoes', nameAr: 'أحذية', nameKu: 'پێڵاو', icon: 'footsteps', sortOrder: 1, isActive: true } });
    const catShirts = await prisma.storeCategory.create({ data: { name: 'Jerseys', nameAr: 'قمصان', nameKu: 'فانیلە', icon: 'shirt', sortOrder: 2, isActive: true } });
    const catBalls = await prisma.storeCategory.create({ data: { name: 'Balls', nameAr: 'كرات', nameKu: 'تۆپ', icon: 'football', sortOrder: 3, isActive: true } });
    const catBags = await prisma.storeCategory.create({ data: { name: 'Bags', nameAr: 'حقائب', nameKu: 'جانتا', icon: 'bag-handle', sortOrder: 4, isActive: true } });
    const catAccessories = await prisma.storeCategory.create({ data: { name: 'Accessories', nameAr: 'إكسسوارات', nameKu: 'ئەکسسواری', icon: 'watch', sortOrder: 5, isActive: true } });
    const catEquipment = await prisma.storeCategory.create({ data: { name: 'Equipment', nameAr: 'معدات تدريب', nameKu: 'ئامێری وەرزش', icon: 'barbell', sortOrder: 6, isActive: true } });
    const catShorts = await prisma.storeCategory.create({ data: { name: 'Shorts & Pants', nameAr: 'شورتات وبناطيل', nameKu: 'شۆرت و پانتۆڵ', icon: 'accessibility', sortOrder: 7, isActive: true } });

    // Products
    const shoeProducts = [
      { name: 'Nike Mercurial Vapor 15', nameAr: 'نايك ميركوريال فابور 15', nameKu: 'نایکی مێرکوریال ڤاپور ١٥', price: 75000, originalPrice: 95000, discount: 21, emoji: '👟', badge: 'hot', colors: '["#000000","#FFFFFF","#FF0000"]', sizes: '["40","41","42","43","44","45"]', rating: 4.8, reviewsCount: 124 },
      { name: 'Adidas Predator Edge', nameAr: 'أديداس بريداتور إيدج', nameKu: 'ئەدیداس پریداتۆر ئیج', price: 65000, originalPrice: 80000, discount: 19, emoji: '👟', badge: 'sale', colors: '["#1E3A8A","#000000","#FFFFFF"]', sizes: '["39","40","41","42","43","44"]', rating: 4.6, reviewsCount: 89 },
      { name: 'Puma Future Z', nameAr: 'بوما فيوتشر زد', nameKu: 'پوما فیوچەر زێد', price: 55000, emoji: '👟', colors: '["#F59E0B","#000000"]', sizes: '["40","41","42","43"]', rating: 4.3, reviewsCount: 56 },
      { name: 'Nike Phantom GT2', nameAr: 'نايك فانتوم جي تي 2', nameKu: 'نایکی فانتۆم جی تی ٢', price: 85000, originalPrice: 100000, discount: 15, emoji: '👟', badge: 'new', colors: '["#DC2626","#000000","#FFFFFF"]', sizes: '["40","41","42","43","44"]', rating: 4.9, reviewsCount: 201 },
      { name: 'Adidas Copa Pure', nameAr: 'أديداس كوبا بيور', nameKu: 'ئەدیداس کۆپا پیور', price: 60000, emoji: '👟', colors: '["#000000","#FFFFFF"]', sizes: '["39","40","41","42","43","44","45"]', rating: 4.5, reviewsCount: 67 },
    ];
    for (const p of shoeProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catShoes.id, inStock: true, isActive: true } });
    }

    const shirtProducts = [
      { name: 'Iraq National Team Jersey 2025', nameAr: 'قميص المنتخب العراقي 2025', nameKu: 'فانیلەی هەڵبژاردەی عێراق ٢٠٢٥', price: 45000, originalPrice: 55000, discount: 18, emoji: '👕', badge: 'hot', colors: '["#FFFFFF","#166534"]', sizes: '["S","M","L","XL","XXL"]', rating: 4.9, reviewsCount: 312 },
      { name: 'Air Force FC Jersey', nameAr: 'قميص القوة الجوية', nameKu: 'فانیلەی هێزی ئاسمانی', price: 35000, emoji: '👕', colors: '["#1E3A8A","#FFFFFF"]', sizes: '["S","M","L","XL"]', rating: 4.7, reviewsCount: 156 },
      { name: 'Police FC Jersey', nameAr: 'قميص الشرطة', nameKu: 'فانیلەی پۆلیس', price: 35000, emoji: '👕', colors: '["#166534","#FFFFFF"]', sizes: '["S","M","L","XL"]', rating: 4.6, reviewsCount: 134 },
      { name: 'Training T-Shirt', nameAr: 'تيشيرت تدريب', nameKu: 'تیشێرتی ڕاهێنان', price: 18000, originalPrice: 25000, discount: 28, emoji: '👕', badge: 'sale', colors: '["#000000","#1E3A8A","#DC2626","#FFFFFF"]', sizes: '["S","M","L","XL","XXL"]', rating: 4.2, reviewsCount: 78 },
      { name: 'Compression Shirt', nameAr: 'قميص ضاغط', nameKu: 'فانیلەی فشاری', price: 22000, emoji: '👕', colors: '["#000000","#FFFFFF","#1E3A8A"]', sizes: '["S","M","L","XL"]', rating: 4.4, reviewsCount: 45 },
    ];
    for (const p of shirtProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catShirts.id, inStock: true, isActive: true } });
    }

    const ballProducts = [
      { name: 'Adidas Al Rihla Pro', nameAr: 'أديداس الرحلة برو', nameKu: 'ئەدیداس ئەلڕیحلە پرۆ', price: 45000, originalPrice: 60000, discount: 25, emoji: '⚽', badge: 'sale', rating: 4.8, reviewsCount: 98 },
      { name: 'Nike Flight Ball', nameAr: 'نايك فلايت', nameKu: 'نایکی فلایت', price: 38000, emoji: '⚽', badge: 'new', rating: 4.5, reviewsCount: 67 },
      { name: 'Puma Orbita', nameAr: 'بوما أوربيتا', nameKu: 'پوما ئۆربیتا', price: 28000, emoji: '⚽', rating: 4.3, reviewsCount: 45 },
      { name: 'Training Ball Set (3)', nameAr: 'طقم كرات تدريب (3)', nameKu: 'سێتی تۆپی ڕاهێنان (٣)', price: 35000, originalPrice: 45000, discount: 22, emoji: '⚽', badge: 'hot', rating: 4.1, reviewsCount: 34 },
    ];
    for (const p of ballProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catBalls.id, inStock: true, isActive: true } });
    }

    const bagProducts = [
      { name: 'Nike Brasilia Duffel', nameAr: 'شنطة نايك برازيليا', nameKu: 'جانتای نایکی بڕازیلیا', price: 32000, originalPrice: 40000, discount: 20, emoji: '🎒', badge: 'sale', colors: '["#000000","#1E3A8A"]', rating: 4.6, reviewsCount: 87 },
      { name: 'Adidas Team Bag', nameAr: 'حقيبة أديداس للفريق', nameKu: 'جانتای ئەدیداس بۆ تیم', price: 28000, emoji: '🎒', colors: '["#000000","#FFFFFF"]', rating: 4.4, reviewsCount: 56 },
      { name: 'Shoe Bag', nameAr: 'حقيبة أحذية', nameKu: 'جانتای پێڵاو', price: 12000, emoji: '👜', colors: '["#000000","#1E3A8A","#DC2626"]', rating: 4.2, reviewsCount: 43 },
      { name: 'Sports Backpack', nameAr: 'حقيبة ظهر رياضية', nameKu: 'جانتای پشتی وەرزشی', price: 25000, emoji: '🎒', badge: 'new', colors: '["#000000","#166534"]', rating: 4.7, reviewsCount: 91 },
      { name: 'Gym Sack', nameAr: 'كيس رياضي', nameKu: 'کیسەی وەرزشی', price: 8000, emoji: '👜', colors: '["#000000","#FFFFFF","#DC2626","#1E3A8A"]', rating: 4.0, reviewsCount: 29 },
    ];
    for (const p of bagProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catBags.id, inStock: true, isActive: true } });
    }

    const accProducts = [
      { name: 'Shin Guards Pro', nameAr: 'واقي ساق احترافي', nameKu: 'پارێزەری قاچ پڕۆفیشناڵ', price: 15000, originalPrice: 20000, discount: 25, emoji: '🦵', badge: 'sale', sizes: '["S","M","L"]', rating: 4.5, reviewsCount: 76 },
      { name: 'Captain Armband', nameAr: 'شارة القيادة', nameKu: 'بازووبەندی کاپتن', price: 5000, emoji: '💪', colors: '["#DC2626","#F59E0B","#1E3A8A"]', rating: 4.3, reviewsCount: 112 },
      { name: 'Sports Socks (3 pairs)', nameAr: 'جوارب رياضية (3 أزواج)', nameKu: 'گۆرەوی وەرزشی (٣ جووت)', price: 12000, emoji: '🧦', colors: '["#FFFFFF","#000000"]', sizes: '["S","M","L"]', rating: 4.1, reviewsCount: 89 },
      { name: 'Goalkeeper Gloves', nameAr: 'قفازات حارس المرمى', nameKu: 'دەسکەوانی گۆڵپار', price: 25000, originalPrice: 35000, discount: 29, emoji: '🧤', badge: 'hot', sizes: '["7","8","9","10"]', rating: 4.7, reviewsCount: 54 },
    ];
    for (const p of accProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catAccessories.id, inStock: true, isActive: true } });
    }

    const equipProducts = [
      { name: 'Agility Cones Set (20)', nameAr: 'مخاريط تدريب (20 قطعة)', nameKu: 'کۆنی ڕاهێنان (٢٠ دانە)', price: 15000, emoji: '🔶', rating: 4.4, reviewsCount: 67 },
      { name: 'Speed Ladder', nameAr: 'سلم السرعة', nameKu: 'پلیکانەی خێرایی', price: 18000, originalPrice: 25000, discount: 28, emoji: '🪜', badge: 'sale', rating: 4.6, reviewsCount: 45 },
      { name: 'Resistance Bands Set', nameAr: 'مجموعة أحزمة المقاومة', nameKu: 'سێتی بەندی بەرگری', price: 12000, emoji: '🏋️', rating: 4.2, reviewsCount: 38 },
      { name: 'Mini Training Goals', nameAr: 'مرمى تدريب صغير', nameKu: 'گۆڵی ڕاهێنانی بچووک', price: 35000, originalPrice: 45000, discount: 22, emoji: '🥅', badge: 'hot', rating: 4.5, reviewsCount: 23 },
      { name: 'Pump & Needles Set', nameAr: 'منفاخ وإبر', nameKu: 'پەمپ و دەرزی', price: 5000, emoji: '💨', rating: 3.9, reviewsCount: 56 },
    ];
    for (const p of equipProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catEquipment.id, inStock: true, isActive: true } });
    }

    const shortsProducts = [
      { name: 'Nike Dri-FIT Shorts', nameAr: 'شورت نايك دراي فت', nameKu: 'شۆرتی نایکی درای فیت', price: 22000, originalPrice: 30000, discount: 27, emoji: '🩳', badge: 'sale', colors: '["#000000","#1E3A8A","#FFFFFF"]', sizes: '["S","M","L","XL"]', rating: 4.5, reviewsCount: 98 },
      { name: 'Adidas Training Pants', nameAr: 'بنطلون تدريب أديداس', nameKu: 'پانتۆڵی ڕاهێنانی ئەدیداس', price: 28000, emoji: '👖', colors: '["#000000","#1E3A8A"]', sizes: '["S","M","L","XL","XXL"]', rating: 4.6, reviewsCount: 67 },
      { name: 'Compression Tights', nameAr: 'تايت ضاغط', nameKu: 'تایتی فشاری', price: 18000, emoji: '🩳', colors: '["#000000","#FFFFFF"]', sizes: '["S","M","L","XL"]', rating: 4.3, reviewsCount: 45 },
      { name: 'Match Day Shorts', nameAr: 'شورت يوم المباراة', nameKu: 'شۆرتی ڕۆژی یاری', price: 15000, emoji: '🩳', badge: 'new', colors: '["#FFFFFF","#000000","#166534","#1E3A8A"]', sizes: '["S","M","L","XL"]', rating: 4.4, reviewsCount: 78 },
    ];
    for (const p of shortsProducts) {
      await prisma.storeProduct.create({ data: { ...p, categoryId: catShorts.id, inStock: true, isActive: true } });
    }

    console.log('🎉 Database seeded successfully via API!');

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      summary: {
        users: 3,
        competitions: 7,
        teams: 2,
        players: 28,
        matches: 7,
        events: 6,
        storeCategories: 7,
        storeProducts: 32,
      },
      credentials: {
        admin: 'admin@sportslive.com / admin123',
        operator: 'operator@sportslive.com / operator123',
        user: 'user@sportslive.com / user123',
      },
    });
  } catch (error: any) {
    console.error('❌ Seed error:', error);
    res.status(500).json({ success: false, message: 'Seed failed: ' + error.message });
  }
});

export default router;
