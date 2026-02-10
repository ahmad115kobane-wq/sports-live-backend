import { Router } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

// POST /api/seed/legal — إضافة الصفحات القانونية فقط
router.post('/legal', async (req, res) => {
  try {
    // حذف الصفحات القانونية الموجودة
    await prisma.legalPage.deleteMany();

    // إضافة الصفحات القانونية
    await prisma.legalPage.createMany({
      data: [
        {
          slug: 'privacy-policy',
          title: 'Privacy Policy',
          titleAr: 'سياسة الخصوصية',
          titleKu: 'سیاسەتی تایبەتمەندی',
          content: 'Privacy Policy\n\nWe respect your privacy and are committed to protecting your personal data.',
          contentAr: 'سياسة الخصوصية\n\nنحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.',
          contentKu: 'سیاسەتی تایبەتمەندی\n\nئێمە ڕێزی تایبەتمەندیت دەگرین.',
          isActive: true,
          sortOrder: 1,
        },
        {
          slug: 'terms-of-service',
          title: 'Terms of Service',
          titleAr: 'شروط الاستخدام',
          titleKu: 'مەرجەکانی بەکارهێنان',
          content: 'Terms of Service\n\nBy using Mini Football, you agree to the following terms.',
          contentAr: 'شروط الاستخدام\n\nباستخدامك لتطبيق Mini Football، فإنك توافق على الشروط التالية.',
          contentKu: 'مەرجەکانی بەکارهێنان\n\nبە بەکارهێنانی Mini Football، ڕازی دەبیت بەم مەرجانە.',
          isActive: true,
          sortOrder: 2,
        },
        {
          slug: 'about-app',
          title: 'About App',
          titleAr: 'حول التطبيق',
          titleKu: 'دەربارەی ئەپ',
          content: 'About Mini Football\n\nYour ultimate companion for Iraqi sports.',
          contentAr: 'حول التطبيق\n\nرفيقك المثالي لمتابعة الرياضة العراقية.',
          contentKu: 'دەربارەی ئەپ\n\nهاوڕێی تەواوت بۆ وەرزشی عێراقی.',
          isActive: true,
          sortOrder: 3,
        },
      ],
    });

    res.json({ success: true, message: 'Legal pages created successfully' });
  } catch (error: any) {
    console.error('Create legal pages error:', error);
    res.status(500).json({ success: false, message: 'Failed to create legal pages: ' + error.message });
  }
});

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

    // ============================================
    // LEGAL PAGES
    // ============================================
    await prisma.legalPage.createMany({
      data: [
        {
          slug: 'privacy-policy',
          title: 'Privacy Policy',
          titleAr: 'سياسة الخصوصية',
          titleKu: 'سیاسەتی تایبەتمەندی',
          content: 'Privacy Policy\n\nWe respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our application.\n\n1. Information We Collect\nWe collect information you provide directly, such as your name, email address, and profile information. We also collect usage data to improve our services.\n\n2. How We Use Your Information\nWe use your information to provide and improve our services, send notifications about matches and news, and personalize your experience.\n\n3. Data Security\nWe implement appropriate security measures to protect your personal information from unauthorized access or disclosure.\n\n4. Your Rights\nYou have the right to access, update, or delete your personal information at any time through your account settings.\n\n5. Contact Us\nIf you have questions about this privacy policy, please contact us through the app.',
          contentAr: 'سياسة الخصوصية\n\nنحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها وحمايتها عند استخدام تطبيقنا.\n\n1. المعلومات التي نجمعها\nنجمع المعلومات التي تقدمها مباشرة، مثل اسمك وعنوان بريدك الإلكتروني ومعلومات ملفك الشخصي. كما نجمع بيانات الاستخدام لتحسين خدماتنا.\n\n2. كيف نستخدم معلوماتك\nنستخدم معلوماتك لتقديم خدماتنا وتحسينها، وإرسال إشعارات حول المباريات والأخبار، وتخصيص تجربتك.\n\n3. أمان البيانات\nننفذ تدابير أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الكشف عنها.\n\n4. حقوقك\nلديك الحق في الوصول إلى معلوماتك الشخصية أو تحديثها أو حذفها في أي وقت من خلال إعدادات حسابك.\n\n5. تواصل معنا\nإذا كانت لديك أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر التطبيق.',
          contentKu: 'سیاسەتی تایبەتمەندی\n\nئێمە ڕێزی تایبەتمەندیت دەگرین و پابەندین بە پاراستنی داتا کەسییەکانت. ئەم سیاسەتی تایبەتمەندییە ڕوون دەکاتەوە چۆن زانیارییەکانت کۆ دەکەینەوە و بەکاریان دەهێنین و دەیانپارێزین کاتێک ئەپەکەمان بەکاردەهێنیت.\n\n1. زانیارییەکانی کۆکراوە\nئەو زانیارییانە کۆ دەکەینەوە کە ڕاستەوخۆ دابین دەکەیت، وەک ناوت و ناونیشانی ئیمەیڵت و زانیاری پڕۆفایلەکەت.\n\n2. چۆن زانیارییەکانت بەکاردەهێنین\nزانیارییەکانت بەکاردەهێنین بۆ دابینکردن و باشترکردنی خزمەتگوزارییەکانمان.\n\n3. ئاسایشی داتا\nئێمە ڕێوشوێنی ئاسایشی گونجاو جێبەجێ دەکەین بۆ پاراستنی زانیاری کەسییەکانت.\n\n4. مافەکانت\nمافی دەستگەیشتن، نوێکردنەوە، یان سڕینەوەی زانیاری کەسییەکانت هەیە لە هەر کاتێکدا.\n\n5. پەیوەندیمان پێوە بکە\nئەگەر پرسیارت هەیە دەربارەی ئەم سیاسەتە، تکایە پەیوەندیمان پێوە بکە لە ڕێگەی ئەپەکەوە.',
          isActive: true,
          sortOrder: 1,
        },
        {
          slug: 'terms-of-service',
          title: 'Terms of Service',
          titleAr: 'شروط الاستخدام',
          titleKu: 'مەرجەکانی بەکارهێنان',
          content: 'Terms of Service\n\nBy using Mini Football, you agree to the following terms and conditions.\n\n1. Acceptance of Terms\nBy accessing or using our application, you agree to be bound by these terms of service.\n\n2. User Accounts\nYou are responsible for maintaining the security of your account and password. You must notify us immediately of any unauthorized use.\n\n3. Acceptable Use\nYou agree not to misuse our services or help anyone else do so. You must not attempt to access our systems in unauthorized ways.\n\n4. Content\nAll content provided through the application is for informational purposes. Match scores and statistics are provided as-is.\n\n5. Termination\nWe may terminate or suspend your account at any time for violations of these terms.\n\n6. Changes to Terms\nWe reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of modified terms.',
          contentAr: 'شروط الاستخدام\n\nباستخدامك لتطبيق Mini Football، فإنك توافق على الشروط والأحكام التالية.\n\n1. قبول الشروط\nبالوصول إلى تطبيقنا أو استخدامه، فإنك توافق على الالتزام بشروط الاستخدام هذه.\n\n2. حسابات المستخدمين\nأنت مسؤول عن الحفاظ على أمان حسابك وكلمة المرور الخاصة بك. يجب عليك إخطارنا فوراً بأي استخدام غير مصرح به.\n\n3. الاستخدام المقبول\nتوافق على عدم إساءة استخدام خدماتنا أو مساعدة أي شخص آخر على ذلك. يجب عدم محاولة الوصول إلى أنظمتنا بطرق غير مصرح بها.\n\n4. المحتوى\nجميع المحتويات المقدمة عبر التطبيق هي لأغراض إعلامية. يتم تقديم نتائج المباريات والإحصائيات كما هي.\n\n5. الإنهاء\nيجوز لنا إنهاء أو تعليق حسابك في أي وقت بسبب انتهاك هذه الشروط.\n\n6. التغييرات على الشروط\nنحتفظ بالحق في تعديل هذه الشروط في أي وقت. يعتبر الاستمرار في استخدام التطبيق قبولاً للشروط المعدلة.',
          contentKu: 'مەرجەکانی بەکارهێنان\n\nبە بەکارهێنانی ئەپی Mini Football، ڕازی دەبیت بەم مەرج و مەرجانە.\n\n1. قبوڵکردنی مەرجەکان\nبە دەستگەیشتن یان بەکارهێنانی ئەپەکەمان، ڕازی دەبیت بە پابەندبوون بەم مەرجانەی بەکارهێنان.\n\n2. ئەکاونتی بەکارهێنەران\nتۆ بەرپرسیت لە پاراستنی ئاسایشی ئەکاونت و وشەی نهێنییەکەت.\n\n3. بەکارهێنانی قبوڵکراو\nڕازی دەبیت خزمەتگوزارییەکانمان بە خراپ بەکارنەهێنیت.\n\n4. ناوەڕۆک\nهەموو ناوەڕۆکێک کە لە ڕێگەی ئەپەکەوە دابین دەکرێت بۆ مەبەستی زانیارییە.\n\n5. کۆتایی\nلەوانەیە ئەکاونتەکەت هەڵبوەشێنینەوە لە هەر کاتێکدا بۆ پێشێلکردنی ئەم مەرجانە.\n\n6. گۆڕانکاری لە مەرجەکان\nمافی گۆڕینی ئەم مەرجانەمان هەیە لە هەر کاتێکدا.',
          isActive: true,
          sortOrder: 2,
        },
        {
          slug: 'about-app',
          title: 'About App',
          titleAr: 'حول التطبيق',
          titleKu: 'دەربارەی ئەپ',
          content: 'About Mini Football\n\nMini Football is your ultimate companion for following Iraqi sports. Get live match scores, instant notifications, team lineups, and much more.\n\nFeatures:\n- Live match scores and updates\n- Instant goal and event notifications\n- Team lineups and match statistics\n- Follow your favorite teams and competitions\n- Sports store with official merchandise\n- News and articles about Iraqi sports\n\nVersion: 1.0.0\nDeveloper: Mini Football Team\nContact: support@sportslive.app',
          contentAr: 'حول تطبيق ميني فوتبول\n\nميني فوتبول هو رفيقك المثالي لمتابعة الرياضة العراقية. احصل على نتائج المباريات المباشرة، إشعارات فورية، تشكيلات الفرق، والمزيد.\n\nالمميزات:\n- نتائج مباشرة وتحديثات فورية\n- إشعارات فورية للأهداف والأحداث\n- تشكيلات الفرق وإحصائيات المباريات\n- تابع فرقك وبطولاتك المفضلة\n- متجر رياضي بمنتجات رسمية\n- أخبار ومقالات عن الرياضة العراقية\n\nالإصدار: 1.0.0\nالمطور: فريق ميني فوتبول\nالتواصل: support@sportslive.app',
          contentKu: 'دەربارەی ئەپی مینی فوتبۆڵ\n\nمینی فوتبۆڵ هاوەڵی باشترینت بۆ بەدواداگرتنی وەرزشی عێراقی. ئەنجامی ڕاستەوخۆی یارییەکان، ئاگاداری خێرا، ڕیزبەندی تیمەکان، و زۆری تر.\n\nتایبەتمەندییەکان:\n- ئەنجامی ڕاستەوخۆ و نوێکردنەوەی خێرا\n- ئاگاداری خێرا بۆ گۆڵ و ڕووداوەکان\n- ڕیزبەندی تیمەکان و ئامارەکانی یارییەکان\n- تیم و یارییە دڵخوازەکانت بەدواداگرە\n- فرۆشگای وەرزشی بە بەرهەمی فەرمی\n- هەواڵ و بابەتەکان دەربارەی وەرزشی عێراقی\n\nوەشان: 1.0.0\nگەشەپێدەر: تیمی مینی فوتبۆڵ\nپەیوەندی: support@sportslive.app',
          isActive: true,
          sortOrder: 3,
        },
      ],
    });

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

// POST /api/seed/legal — إنشاء الصفحات القانونية المفقودة فقط
router.post('/legal', async (req, res) => {
  try {
    const defaultPages = [
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        titleAr: 'سياسة الخصوصية',
        titleKu: 'سیاسەتی تایبەتمەندی',
        content: 'Privacy Policy\n\nWe respect your privacy and are committed to protecting your personal data.\n\n1. Information We Collect\nWe collect information you provide directly, such as your name, email address, and profile information.\n\n2. How We Use Your Information\nWe use your information to provide and improve our services.\n\n3. Data Security\nWe implement appropriate security measures to protect your personal information.\n\n4. Your Rights\nYou have the right to access, update, or delete your personal information at any time.\n\n5. Contact Us\nIf you have questions, please contact us through the app.',
        contentAr: 'سياسة الخصوصية\n\nنحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.\n\n1. المعلومات التي نجمعها\nنجمع المعلومات التي تقدمها مباشرة.\n\n2. كيف نستخدم معلوماتك\nنستخدم معلوماتك لتقديم خدماتنا وتحسينها.\n\n3. أمان البيانات\nننفذ تدابير أمنية مناسبة لحماية معلوماتك.\n\n4. حقوقك\nلديك الحق في الوصول إلى معلوماتك أو تحديثها أو حذفها.\n\n5. تواصل معنا\nيرجى التواصل معنا عبر التطبيق.',
        contentKu: 'سیاسەتی تایبەتمەندی\n\nئێمە ڕێزی تایبەتمەندیت دەگرین و پابەندین بە پاراستنی داتا کەسییەکانت.',
        isActive: true,
        sortOrder: 1,
      },
      {
        slug: 'terms-of-service',
        title: 'Terms of Service',
        titleAr: 'شروط الاستخدام',
        titleKu: 'مەرجەکانی بەکارهێنان',
        content: 'Terms of Service\n\nBy using Mini Football, you agree to the following terms.\n\n1. Acceptance of Terms\nBy accessing our application, you agree to be bound by these terms.\n\n2. User Accounts\nYou are responsible for maintaining the security of your account.\n\n3. Acceptable Use\nYou agree not to misuse our services.\n\n4. Content\nAll content is for informational purposes.\n\n5. Termination\nWe may terminate your account for violations.\n\n6. Changes\nWe reserve the right to modify these terms at any time.',
        contentAr: 'شروط الاستخدام\n\nباستخدامك لتطبيق Mini Football، فإنك توافق على الشروط التالية.\n\n1. قبول الشروط\nبالوصول إلى تطبيقنا، توافق على الالتزام بهذه الشروط.\n\n2. حسابات المستخدمين\nأنت مسؤول عن أمان حسابك.\n\n3. الاستخدام المقبول\nتوافق على عدم إساءة استخدام خدماتنا.\n\n4. المحتوى\nجميع المحتويات لأغراض إعلامية.\n\n5. الإنهاء\nيجوز لنا إنهاء حسابك بسبب انتهاك الشروط.\n\n6. التغييرات\nنحتفظ بالحق في تعديل هذه الشروط.',
        contentKu: 'مەرجەکانی بەکارهێنان\n\nبە بەکارهێنانی ئەپی Mini Football، ڕازی دەبیت بەم مەرجانە.',
        isActive: true,
        sortOrder: 2,
      },
      {
        slug: 'about-app',
        title: 'About App',
        titleAr: 'حول التطبيق',
        titleKu: 'دەربارەی ئەپ',
        content: 'About Mini Football\n\nMini Football is your ultimate companion for following Iraqi sports. Get live match scores, instant notifications, team lineups, and much more.\n\nFeatures:\n- Live match scores and updates\n- Instant goal and event notifications\n- Team lineups and match statistics\n- Follow your favorite teams\n- Sports store with official merchandise\n- News and articles\n\nVersion: 1.0.0\nDeveloper: Mini Football Team\nContact: support@sportslive.app',
        contentAr: 'حول تطبيق ميني فوتبول\n\nميني فوتبول هو رفيقك المثالي لمتابعة الرياضة العراقية.\n\nالمميزات:\n- نتائج مباشرة وتحديثات فورية\n- إشعارات فورية للأهداف والأحداث\n- تشكيلات الفرق وإحصائيات المباريات\n- تابع فرقك وبطولاتك المفضلة\n- متجر رياضي بمنتجات رسمية\n- أخبار ومقالات عن الرياضة العراقية\n\nالإصدار: 1.0.0\nالمطور: فريق ميني فوتبول\nالتواصل: support@sportslive.app',
        contentKu: 'دەربارەی ئەپی مینی فوتبۆڵ\n\nمینی فوتبۆڵ هاوەڵی باشترینت بۆ بەدواداگرتنی وەرزشی عێراقی.\n\nتایبەتمەندییەکان:\n- ئەنجامی ڕاستەوخۆ و نوێکردنەوەی خێرا\n- ئاگاداری خێرا بۆ گۆڵ و ڕووداوەکان\n- ڕیزبەندی تیمەکان و ئامارەکان\n- تیم و یارییە دڵخوازەکانت بەدواداگرە\n- فرۆشگای وەرزشی\n- هەواڵ و بابەتەکان\n\nوەشان: 1.0.0\nگەشەپێدەر: تیمی مینی فوتبۆڵ\nپەیوەندی: support@sportslive.app',
        isActive: true,
        sortOrder: 3,
      },
    ];

    let created = 0;
    for (const page of defaultPages) {
      const exists = await prisma.legalPage.findUnique({ where: { slug: page.slug } });
      if (!exists) {
        await prisma.legalPage.create({ data: page });
        created++;
      }
    }

    res.json({ success: true, message: `Legal pages seeded: ${created} created, ${defaultPages.length - created} already existed`, created });
  } catch (error: any) {
    console.error('Seed legal pages error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed legal pages: ' + error.message });
  }
});

// GET /api/seed/check-tokens — فحص حالة push tokens
router.get('/check-tokens', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, pushToken: true, role: true },
    });
    
    const withToken = users.filter(u => u.pushToken);
    const withoutToken = users.filter(u => !u.pushToken);
    
    res.json({
      success: true,
      total: users.length,
      withPushToken: withToken.length,
      withoutPushToken: withoutToken.length,
      users: users.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        hasToken: !!u.pushToken,
        tokenPreview: u.pushToken ? u.pushToken.substring(0, 20) + '...' : null,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/seed/test-notification — إرسال إشعار تجريبي
router.post('/test-notification', async (req, res) => {
  try {
    const admin = await import('firebase-admin');
    
    const users = await prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { id: true, name: true, pushToken: true },
    });

    if (users.length === 0) {
      return res.json({ success: false, message: 'No users with push tokens found' });
    }

    const results: any[] = [];
    
    for (const user of users) {
      try {
        const message = {
          token: user.pushToken!,
          notification: {
            title: '🔔 إشعار تجريبي',
            body: `مرحباً ${user.name}! هذا إشعار تجريبي من السيرفر.`,
          },
          data: {
            type: 'test',
          },
          android: {
            priority: 'high' as const,
            notification: {
              channelId: 'match-notifications',
              sound: 'default',
            },
          },
        };
        
        const response = await admin.default.messaging().send(message);
        results.push({ user: user.name, status: 'success', response });
        console.log(`✅ Test notification sent to ${user.name}: ${response}`);
      } catch (err: any) {
        results.push({ user: user.name, status: 'failed', error: err.code || err.message });
        console.error(`❌ Test notification failed for ${user.name}:`, err.code, err.message);
      }
    }

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
