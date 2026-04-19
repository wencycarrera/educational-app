# Firebase Billing Setup Guide

## ⚠️ Important: Billing is Required (But Free Tier is Free!)

Firebase requires you to enable billing on your project, **even if you're using the free tier**. This is because:
- Some features require the Blaze (pay-as-you-go) plan
- Firebase needs a payment method on file for account verification
- **You will NOT be charged** if you stay within the free tier limits

## Firebase Pricing Tiers

### Spark Plan (Free Tier) - What You Get:
- **Firestore**: 
  - 1 GB storage
  - 50K reads/day
  - 20K writes/day
  - 20K deletes/day
- **Authentication**: Unlimited
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Cloud Functions**: 2 million invocations/month
- **Storage**: 5 GB storage, 1 GB/day download

### Blaze Plan (Pay-as-you-go):
- Everything in Spark plan, PLUS:
- Pay only for what you use beyond free tier
- Access to additional features

**For most educational apps, the Spark plan is more than enough!**

---

## Step-by-Step: Enable Billing

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: **educational-app-52979**

### Step 2: Navigate to Billing
1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Usage and billing"** or **"Billing"**

### Step 3: Enable Billing
1. You'll see a message about enabling billing
2. Click **"Upgrade project"** or **"Enable billing"**
3. You'll be redirected to Google Cloud Console

### Step 4: Link a Billing Account
1. In Google Cloud Console, you'll see the billing setup
2. If you don't have a billing account:
   - Click **"Create billing account"**
   - Fill in your information:
     - Account name (e.g., "My Firebase Projects")
     - Country/Region
     - Payment method (credit/debit card)
   - Click **"Submit and enable billing"**
3. If you already have a billing account:
   - Select it from the dropdown
   - Click **"Set account"**

### Step 5: Verify Billing is Enabled
1. Go back to Firebase Console
2. Check that billing status shows as "Active"
3. You should see "Blaze plan" or "Pay-as-you-go" plan

### Step 6: Set Budget Alerts (Recommended)
To avoid unexpected charges, set up budget alerts:

1. In Firebase Console → **Usage and billing**
2. Click **"Set budget alert"** or go to Google Cloud Console → **Billing** → **Budgets & alerts**
3. Create a budget:
   - Amount: **$0** (or a small amount like $5)
   - Set alerts at 50%, 90%, and 100%
   - This way you'll be notified if you approach the free tier limits

---

## After Enabling Billing

### Step 1: Create Firestore Database
1. Go back to Firebase Console
2. Click **"Firestore Database"** in the left sidebar
3. Click **"Create database"**
4. Choose **"Start in test mode"** (for development)
5. Select a **location** (choose closest to your users)
6. Click **"Enable"**

### Step 2: Wait for Database Creation
- Takes 1-2 minutes
- You'll see a success message when ready

### Step 3: Set Up Security Rules
1. In Firestore Database, click **"Rules"** tab
2. For development, you can use:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```
3. Click **"Publish"**

**⚠️ Important**: These rules allow anyone to read/write. Only use for development!

---

## Understanding Free Tier Limits

### Firestore Free Tier (Daily):
- **Reads**: 50,000 per day
- **Writes**: 20,000 per day
- **Deletes**: 20,000 per day
- **Storage**: 1 GB total

### What Happens if You Exceed?
- You'll start getting charged per operation
- Example: $0.06 per 100,000 reads after free tier
- You'll receive email alerts if you approach limits

### For Your Educational App:
- 50K reads/day = ~2,000 reads/hour = plenty for most apps
- 20K writes/day = ~800 writes/hour = more than enough for user data

---

## Cost Monitoring

### Check Your Usage:
1. Firebase Console → **Usage and billing**
2. View current usage vs. free tier limits
3. See estimated costs (should be $0 if within free tier)

### Set Up Alerts:
1. Google Cloud Console → **Billing** → **Budgets & alerts**
2. Create budget alerts to get notified before charges

---

## Common Questions

### Q: Will I be charged?
**A**: No, as long as you stay within the free tier limits. The Spark plan is very generous for development and small apps.

### Q: What if I accidentally exceed limits?
**A**: 
- You'll receive email alerts
- Charges are minimal (cents per 1,000 operations)
- You can set a budget cap to prevent large charges

### Q: Can I disable billing later?
**A**: Yes, but you'll lose access to some features. You can always re-enable it.

### Q: Do I need a credit card?
**A**: Yes, but it's only used for verification. You won't be charged unless you exceed free tier limits.

---

## Quick Checklist

- [ ] Enable billing in Firebase Console
- [ ] Link or create billing account in Google Cloud
- [ ] Verify billing is active
- [ ] Set up budget alerts (recommended)
- [ ] Create Firestore database
- [ ] Set up security rules
- [ ] Test your Firebase connection

---

## Next Steps After Billing is Enabled

1. **Create Firestore Database** (as shown above)
2. **Enable Authentication** (if not already done):
   - Firebase Console → Authentication → Sign-in method
   - Enable Email/Password or other methods
3. **Test Your App**:
   - Your Firebase config is already set up in `firebase.ts`
   - Try connecting to Firestore from your app

---

## Need Help?

- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firestore Free Tier Limits](https://firebase.google.com/docs/firestore/quotas)
- [Firebase Support](https://firebase.google.com/support)

---

**Remember**: Enabling billing is safe and free for the Spark plan tier. You're only charged if you exceed the generous free limits!

