const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// 1. دالة لإنشاء أدمن جديد (لا يمكن للعميل استدعاءها مباشرة بهذا الشكل، يتم حمايتها)
// يتم استدعاؤها عبر Firebase Console أو HTTP Request مع التحقق من أدمن حالي.
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // التحقق من أن المستخدم الذي يطلب العملية هو أدمن
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin.');
  }

  const email = data.email;
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Audit Log
    await admin.firestore().collection('audit_logs').add({
      action: 'ADMIN_ROLE_GRANTED',
      target: email,
      performedBy: context.auth.token.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
