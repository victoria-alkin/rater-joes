const { setGlobalOptions } = require("firebase-functions");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();

const ADMIN_EMAILS = new Set(["alkin.victoria@gmail.com"]);

exports.aggregateProductRating = onDocumentWritten(
  "reviews/{reviewId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const productId = after?.productId ?? before?.productId;

    if (!productId) {
      logger.warn("Review write had no productId; skipping", {
        reviewId: event.params.reviewId,
      });
      return;
    }

    const reviewsSnap = await db
      .collection("reviews")
      .where("productId", "==", productId)
      .get();

    const reviewCount = reviewsSnap.size;
    const avgRating = reviewCount
      ? reviewsSnap.docs.reduce((sum, d) => sum + (d.data().rating || 0), 0) /
        reviewCount
      : 0;

    await db.doc(`products/${productId}`).set(
      {
        avgRating,
        reviewCount,
      },
      { merge: true }
    );

    logger.info("Updated product aggregates", {
      productId,
      avgRating,
      reviewCount,
    });
  }
);

exports.backfillProductRatings = onCall(async (request) => {
  const email = request.auth?.token?.email;
  if (!email || !ADMIN_EMAILS.has(email)) {
    throw new HttpsError("permission-denied", "Admin only");
  }

  const reviewsSnap = await db.collection("reviews").get();
  const totals = new Map();
  for (const doc of reviewsSnap.docs) {
    const { productId, rating } = doc.data();
    if (!productId) continue;
    const entry = totals.get(productId) || { sum: 0, count: 0 };
    entry.sum += rating || 0;
    entry.count += 1;
    totals.set(productId, entry);
  }

  const productsSnap = await db.collection("products").get();
  const writer = db.bulkWriter();
  for (const doc of productsSnap.docs) {
    const entry = totals.get(doc.id) || { sum: 0, count: 0 };
    writer.set(
      doc.ref,
      {
        avgRating: entry.count ? entry.sum / entry.count : 0,
        reviewCount: entry.count,
      },
      { merge: true }
    );
  }
  await writer.close();

  logger.info("Backfill complete", {
    products: productsSnap.size,
    reviews: reviewsSnap.size,
  });
  return { products: productsSnap.size, reviews: reviewsSnap.size };
});
