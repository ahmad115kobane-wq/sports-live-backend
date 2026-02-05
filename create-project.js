const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 إنشاء مشروع EAS...');
console.log('Creating EAS project...\n');

try {
  // Run eas init with auto-yes
  console.log('📝 تشغيل eas init...');
  const output = execSync('npx eas-cli init --yes', {
    cwd: __dirname,
    stdio: 'inherit',
    input: 'Y\n'
  });
  
  console.log('\n✅ تم إنشاء المشروع بنجاح!');
  console.log('Project created successfully!');
  
  // Read app.json to get project ID
  const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  const projectId = appJson.expo?.extra?.eas?.projectId;
  
  if (projectId) {
    console.log('\n📋 Project ID:', projectId);
    console.log('\n🎉 المشروع جاهز للبناء!');
    console.log('Project is ready to build!');
    console.log('\nلبناء التطبيق، شغّل:');
    console.log('To build the app, run:');
    console.log('\n  npx eas-cli build --profile development --platform android\n');
  }
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error('Error:', error.message);
  process.exit(1);
}
