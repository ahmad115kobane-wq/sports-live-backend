# إعداد نظام الإشعارات | Notifications Setup

## ✅ ما تم إنجازه | Completed

### 1. قاعدة البيانات | Database
- ✅ إضافة جدول `notifications` في Prisma Schema
- ✅ إضافة indexes للأداء
- ✅ إضافة العلاقات مع User و Match
- ⚠️ **يجب تشغيل Migration:**
  ```bash
  cd backend
  npm install
  npx prisma db push
  # أو
  npx prisma migrate dev --name add_notifications
  ```

### 2. الحزم المطلوبة | Required Packages
- ✅ `expo-server-sdk` - موجود مسبقاً
- ✅ `node-cron` - تمت الإضافة
- ✅ `node-cache` - تمت الإضافة
- ⚠️ **يجب تثبيت الحزم:**
  ```bash
  cd backend
  npm install
  ```

### 3. الملفات المنشأة | Created Files

#### خدمات | Services
- ✅ `src/utils/notification-templates.ts` - قوالب الإشعارات
- ✅ `src/services/notification.service.enhanced.ts` - خدمة الإشعارات المحسّنة
- ✅ `src/services/scheduler.service.ts` - جدولة الإشعارات

#### Routes
- ✅ `src/routes/notification.routes.ts` - API endpoints للإشعارات
- ✅ `src/routes/user.routes.ts` - تم التحديث (Push Token & Preferences)

#### تحديثات | Updates
- ✅ `src/server.ts` - إضافة notification routes و scheduler
- ✅ `src/routes/event.routes.ts` - إرسال إشعارات الأحداث
- ✅ `src/routes/operator.routes.ts` - إرسال إشعارات بداية/نهاية المباراة

### 4. API Endpoints الجديدة | New API Endpoints

#### Push Token Management
```
POST   /api/users/push-token        - تسجيل Push Token
DELETE /api/users/push-token        - حذف Push Token
```

#### Preferences
```
GET    /api/users/preferences       - الحصول على التفضيلات
PUT    /api/users/preferences       - تحديث التفضيلات
```

#### Notifications
```
GET    /api/notifications           - الحصول على الإشعارات (مع pagination)
GET    /api/notifications/unread-count - عدد الإشعارات غير المقروءة
PUT    /api/notifications/:id/read - تحديد إشعار كمقروء
PUT    /api/notifications/read-all - تحديد الكل كمقروء
DELETE /api/notifications/:id      - حذف إشعار
```

### 5. أنواع الإشعارات | Notification Types

- ✅ `pre_match` - قبل المباراة بـ 15 دقيقة (Cron Job)
- ✅ `match_start` - بداية المباراة
- ✅ `goal` - هدف
- ✅ `red_card` - بطاقة حمراء
- ✅ `penalty` - ركلة جزاء
- ✅ `match_end` - نهاية المباراة

### 6. الميزات | Features

✅ **إرسال إشعارات فقط للمستخدمين الذين أضافوا الفريق/البطولة للمفضلة**
✅ **احترام تفضيلات المستخدم لأنواع الإشعارات**
✅ **حفظ سجل الإشعارات في قاعدة البيانات**
✅ **إرسال على دفعات (Batch Processing)**
✅ **دعم اللغتين العربية والإنجليزية**
✅ **جدولة تلقائية للإشعارات قبل المباراة**

---

## ⚠️ خطوات التشغيل | Setup Steps

### 1. تثبيت الحزم
```bash
cd backend
npm install
```

### 2. تطبيق Migration
```bash
npx prisma db push
# أو
npx prisma migrate dev --name add_notifications
```

### 3. تحديث Prisma Client
```bash
npx prisma generate
```

### 4. إضافة متغيرات البيئة (اختياري)
```env
# .env
EXPO_ACCESS_TOKEN=your_expo_access_token
NOTIFICATION_BATCH_SIZE=100
PRE_MATCH_NOTIFICATION_MINUTES=15
```

### 5. تشغيل السيرفر
```bash
npm run dev
```

---

## 📝 ملاحظات مهمة | Important Notes

1. **Expo Push Tokens:**
   - يجب أن يكون التطبيق مثبتاً على جهاز حقيقي (لا يعمل على المحاكي)
   - يجب الحصول على Expo Push Token من التطبيق

2. **Scheduler:**
   - يعمل تلقائياً عند بدء السيرفر
   - يفحص كل دقيقة عن مباريات تبدأ خلال 15 دقيقة

3. **Favorites:**
   - يجب أن يكون لدى المستخدم فرق أو بطولات في المفضلة
   - يتم حفظ المفضلة في `preferences.favoriteTeams` و `preferences.favoriteCompetitions`

4. **Notification Preferences:**
   - القيم الافتراضية: جميع الإشعارات مفعّلة
   - يمكن للمستخدم تعطيل أنواع معينة من الإشعارات

---

## 🧪 اختبار النظام | Testing

### 1. تسجيل Push Token
```bash
curl -X POST http://localhost:3000/api/users/push-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"}'
```

### 2. تحديث التفضيلات
```bash
curl -X PUT http://localhost:3000/api/users/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": {
      "enabled": true,
      "preMatch": true,
      "matchStart": true,
      "goals": true,
      "redCards": true,
      "penalties": true,
      "matchEnd": true
    }
  }'
```

### 3. الحصول على الإشعارات
```bash
curl http://localhost:3000/api/notifications?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 الخطوات التالية | Next Steps

### Backend ✅ (مكتمل)
- [x] إنشاء جدول Notifications
- [x] إنشاء API endpoints
- [x] تحديث خدمة الإشعارات
- [x] إضافة Scheduler
- [x] تكامل مع Event Routes
- [x] تكامل مع Operator Routes

### Mobile 📱 (قيد التنفيذ)
- [ ] إعداد Expo Notifications
- [ ] طلب إذن الإشعارات
- [ ] تسجيل Push Token
- [ ] صفحة إعدادات الإشعارات
- [ ] تحديث صفحة الإشعارات
- [ ] معالجة الإشعارات الواردة

---

**تاريخ الإنشاء:** 2026-02-05  
**الحالة:** Backend Complete - Mobile Pending  
**المطور:** Kiro AI Assistant
