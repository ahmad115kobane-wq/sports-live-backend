const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFirebaseManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      return config;
    }

    const application = manifest.application[0];
    
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // إزالة meta-data القديمة إن وجدت
    application['meta-data'] = application['meta-data'].filter(
      (meta) => 
        meta.$['android:name'] !== 'com.google.firebase.messaging.default_notification_color'
    );

    // إضافة meta-data جديدة مع tools:replace
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.firebase.messaging.default_notification_color',
        'android:resource': '@color/white',
        'tools:replace': 'android:resource',
      },
    });

    // التأكد من وجود tools namespace
    if (!manifest.$) {
      manifest.$ = {};
    }
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    return config;
  });
};
