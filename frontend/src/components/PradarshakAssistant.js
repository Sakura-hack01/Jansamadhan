import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

// ===== Language Detection =====
function detectLanguage(text) {
  const hindiRegex = /[\u0900-\u097F]/;
  if (hindiRegex.test(text)) return 'hindi';
  const hinglishWords = ['kya', 'kaise', 'kab', 'kaha', 'kahan', 'mera', 'meri', 'mere', 'hai', 'hain', 'ho', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'pe', 'par', 'bhi', 'nahi', 'nahin', 'nhi', 'ya', 'aur', 'yeh', 'ye', 'woh', 'wo', 'koi', 'kuch', 'sab', 'bahut', 'bohot', 'accha', 'acha', 'thik', 'theek', 'hum', 'tum', 'aap', 'main', 'mujhe', 'mujhko', 'humko', 'unko', 'isko', 'usko', 'kitna', 'kitne', 'kitni', 'kaun', 'konsa', 'konsi', 'kyu', 'kyun', 'kyunki', 'lekin', 'phir', 'abhi', 'pehle', 'baad', 'sarkari', 'sarkar', 'shikayat', 'samadhan', 'darj', 'darjee', 'vibhag', 'adhikari', 'madad', 'suvidha', 'seva', 'complaint', 'karein', 'karen', 'karo', 'batao', 'bataiye', 'bataye', 'dijiye', 'dedo', 'challan', 'paisa', 'rishwat', 'bhrashtachar', 'daftar', 'jankari', 'pata', 'lagao', 'btao', 'krna', 'krne', 'krein', 'chahiye', 'wala', 'wali', 'wale', 'raha', 'rahi', 'rahe', 'gaya', 'gayi', 'gaye', 'milega', 'milegi', 'milenge', 'hoga', 'hogi', 'honge', 'tha', 'thi', 'the', 'jayega', 'jayegi', 'jaenge', 'diya', 'diyi', 'kar', 'le', 'de', 'bol', 'sun', 'dekh', 'padh', 'likh', 'bhej', 'jama', 'karna', 'hona', 'jaana', 'aana', 'dena', 'lena', 'bolna', 'sunna', 'dekhna', 'padhna', 'likhna', 'bhejna', 'samajh', 'samjha', 'samjho', 'pls', 'plz', 'sir', 'madam', 'ji', 'sahab', 'sahib', 'babu'];
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let hinglishCount = 0;
  for (const w of words) { if (hinglishWords.includes(w)) hinglishCount++; }
  if (hinglishCount >= 2 || (words.length <= 4 && hinglishCount >= 1)) return 'hinglish';
  return 'english';
}

// ===== Knowledge Base: English / Hindi / Hinglish =====
const KB = {
  lodge: {
    english: '**How to Lodge a Grievance:**\n\n1. Click "Register Now" and create your account\n2. Login with your Email/Password\n3. Go to "File Complaint" from your dashboard\n4. Select the concerned Department / Ministry\n5. Describe your issue clearly and attach supporting documents\n6. Submit — You\'ll receive a unique Registration Number\n\n📞 You can also call our Toll-Free Helpline: **1800-11-0031**\n\n**Types of Grievances you can file:**\n• Public Grievance (any government service issue)\n• Pension Grievance (pension-related matters)\n• Service Matter Grievance (government employee issues)\n• PM Office Grievance (directed to PMO)',
    hindi: '**शिकायत कैसे दर्ज करें:**\n\n1. "Register Now" पर क्लिक करें और अपना खाता बनाएं\n2. अपने ईमेल/पासवर्ड से लॉगिन करें\n3. अपने डैशबोर्ड से "File Complaint" पर जाएं\n4. संबंधित विभाग/मंत्रालय चुनें\n5. अपनी समस्या का स्पष्ट विवरण दें और दस्तावेज़ संलग्न करें\n6. सबमिट करें — आपको एक अद्वितीय पंजीकरण संख्या मिलेगी\n\n📞 टोल-फ्री हेल्पलाइन: **1800-11-0031**\n\n**शिकायत के प्रकार:**\n• सार्वजनिक शिकायत\n• पेंशन शिकायत\n• सेवा संबंधी शिकायत\n• प्रधानमंत्री कार्यालय शिकायत',
    hinglish: '**Shikayat kaise darj karein:**\n\n1. "Register Now" pe click karein aur account banayein\n2. Email/Password se login karein\n3. Dashboard mein "File Complaint" pe jaayein\n4. Apna department/ministry select karein\n5. Apni problem clearly describe karein aur documents attach karein\n6. Submit karein — Aapko ek unique Registration Number milega\n\n📞 Toll-Free Helpline: **1800-11-0031**\n\n**Shikayat ke types:**\n• Public Grievance (koi bhi sarkaari seva ki samasya)\n• Pension Grievance (pension se related)\n• Service Matter (sarkaari karmchaari ke liye)\n• PMO Grievance (PM Office ko bhejne ke liye)',
  },
  track: {
    english: '**How to Track Your Grievance:**\n\n1. Go to "View Status" → "Grievance Status" from the top menu\n2. Or use the **Quick Track** widget on the homepage\n3. Enter your unique Registration Number (e.g., JANSR/2026/00001)\n4. View detailed status: Pending → Assigned → In Progress → Resolved → Closed\n\nYou will see:\n• Current status of your grievance\n• Name of the officer handling your case\n• Complete audit trail with dates\n• Resolution remarks when resolved\n\n📱 Also check via **UMANG App** or call **1800-11-0031**',
    hindi: '**अपनी शिकायत की स्थिति कैसे जानें:**\n\n1. ऊपर मेनू से "View Status" → "Grievance Status" पर जाएं\n2. या होमपेज पर **Quick Track** विजेट का उपयोग करें\n3. अपना पंजीकरण नंबर दर्ज करें (जैसे: JANSR/2026/00001)\n4. विस्तृत स्थिति देखें: लंबित → सौंपी गई → प्रगति में → हल → बंद\n\nआप देख सकते हैं:\n• शिकायत की वर्तमान स्थिति\n• आपके मामले को संभालने वाले अधिकारी का नाम\n• तारीखों के साथ पूरा रिकॉर्ड\n• हल होने पर समाधान टिप्पणी\n\n📱 **UMANG App** या **1800-11-0031** पर भी जांच करें',
    hinglish: '**Apni shikayat ka status kaise check karein:**\n\n1. Top menu se "View Status" → "Grievance Status" pe jaayein\n2. Ya homepage pe **Quick Track** widget use karein\n3. Apna Registration Number daalein (e.g., JANSR/2026/00001)\n4. Detailed status dekhein: Pending → Assigned → In Progress → Resolved → Closed\n\nAapko dikhega:\n• Grievance ka current status\n• Kaunsa officer handle kar raha hai\n• Puri timeline saari dates ke saath\n• Resolve hone pe officer ki remarks\n\n📱 **UMANG App** ya **1800-11-0031** pe bhi track kar sakte ho',
  },
  appeal: {
    english: '**How to File an Appeal:**\n\nIf you\'re not satisfied with the resolution of your grievance:\n\n1. Go to "Nodal Authority for Appeal" → "File an Appeal"\n2. After your grievance is closed, provide feedback with a star rating\n3. If rated **"Poor" (1-2 stars)**, the Appeal option is automatically enabled\n4. Click "File Appeal" on your grievance detail page\n5. The appeal is reviewed by the **Appellate Authority** (senior Nodal Officer)\n\n⏱️ Appeals are typically resolved within **15 working days**\n\n**Important:** You can also approach the **Directorate of Public Grievances (DPG), Cabinet Secretariat** if your grievance remains unresolved.',
    hindi: '**अपील कैसे दायर करें:**\n\nयदि आप शिकायत के समाधान से संतुष्ट नहीं हैं:\n\n1. "Nodal Authority for Appeal" → "File an Appeal" पर जाएं\n2. शिकायत बंद होने के बाद, स्टार रेटिंग के साथ फीडबैक दें\n3. यदि रेटिंग **"खराब" (1-2 स्टार)** है, तो अपील स्वचालित रूप से सक्षम हो जाती है\n4. अपनी शिकायत के विवरण पृष्ठ पर "File Appeal" क्लिक करें\n5. अपील की समीक्षा **अपीलीय प्राधिकरण** (वरिष्ठ नोडल अधिकारी) द्वारा की जाती है\n\n⏱️ अपील आमतौर पर **15 कार्य दिवसों** में हल की जाती है\n\nआप **लोक शिकायत निदेशालय (DPG), कैबिनेट सचिवालय** से भी संपर्क कर सकते हैं।',
    hinglish: '**Appeal kaise file karein:**\n\nAgar aap grievance ke resolution se khush nahi hain:\n\n1. "Nodal Authority for Appeal" → "File an Appeal" pe jaayein\n2. Grievance close hone ke baad star rating ke saath feedback dein\n3. Agar rating **"Poor" (1-2 stars)** hai, toh Appeal option automatic enable ho jaata hai\n4. Apni grievance detail page pe "File Appeal" click karein\n5. Appeal ko **Appellate Authority** (senior officer) review karta hai\n\n⏱️ Appeals usually **15 working days** mein resolve hoti hain\n\n**Important:** Aap **Directorate of Public Grievances (DPG), Cabinet Secretariat** se bhi madad le sakte hain.',
  },
  departments: {
    english: '**Connected Departments (580+):**\n\n🏛️ **Central Ministries:**\n• Home Affairs • Finance • Health & Family Welfare\n• Education • Railways • Defence • Agriculture\n• IT & Electronics • Commerce • Labour & Employment\n• Housing & Urban Affairs • Law & Justice\n• External Affairs • Women & Child Development\n• Environment, Forest & Climate Change\n• Road Transport & Highways\n\n📍 **States & UTs (36):**\nAll 28 States and 8 Union Territories are connected.\n\n🏢 **Other Bodies:**\nPSUs, Autonomous Bodies, District-level offices\n\nSelect your department while filing. The AI will suggest the right one based on your description.',
    hindi: '**जुड़े विभाग (580+):**\n\n🏛️ **केंद्रीय मंत्रालय:**\n• गृह मंत्रालय • वित्त • स्वास्थ्य • शिक्षा\n• रेलवे • रक्षा • कृषि • IT और इलेक्ट्रॉनिक्स\n• वाणिज्य • श्रम • आवास • विधि\n• विदेश मंत्रालय • महिला और बाल विकास\n• पर्यावरण • सड़क परिवहन और राजमार्ग\n\n📍 **राज्य और केंद्र शासित प्रदेश (36):**\nसभी 28 राज्य और 8 केंद्र शासित प्रदेश जुड़े हैं।\n\n🏢 **अन्य:**\nPSU, स्वायत्त निकाय, जिला स्तरीय कार्यालय',
    hinglish: '**Connected Departments (580+):**\n\n🏛️ **Central Ministries:**\n• Home Affairs • Finance • Health • Education\n• Railways • Defence • Agriculture • IT\n• Commerce • Labour • Housing • Law\n• External Affairs • Women & Child Dev\n\n📍 **States & UTs (36):**\nSaare 28 States aur 8 UTs connected hain.\n\n🏢 **Other Bodies:**\nPSUs, Autonomous Bodies, District offices\n\nFiling karte waqt department select karein. AI suggest karega ki aapki complaint ko kaunsa department handle karega.',
  },
  timeline: {
    english: '**Resolution Timelines (SLA):**\n\n⏱️ **Regular Grievances:** 30 working days\n⏱️ **Priority Grievances:** 15 working days\n⏱️ **Emergency Grievances:** 7 working days\n\n**Status Flow:**\nPending → Acknowledged → Assigned to Nodal Officer → In Progress → Resolved → Closed\n\n📧 You receive **email + SMS** at every stage\n📱 Check on **UMANG App** anytime\n\nIf not resolved in 30 days, you can:\n• Send a Reminder through the portal\n• File an Appeal\n• Contact DPG, Cabinet Secretariat',
    hindi: '**समाधान की समय-सीमा (SLA):**\n\n⏱️ **सामान्य शिकायत:** 30 कार्य दिवस\n⏱️ **प्राथमिकता शिकायत:** 15 कार्य दिवस\n⏱️ **आपातकालीन शिकायत:** 7 कार्य दिवस\n\n**स्थिति प्रवाह:**\nलंबित → स्वीकृत → नोडल अधिकारी को सौंपी → प्रगति में → हल → बंद\n\n📧 हर चरण पर **ईमेल + SMS** मिलता है\n📱 **UMANG App** पर कभी भी जाँचें\n\n30 दिनों में हल न होने पर:\n• पोर्टल से रिमाइंडर भेजें\n• अपील दायर करें\n• DPG, कैबिनेट सचिवालय से संपर्क करें',
    hinglish: '**Resolution kab tak hoga (SLA):**\n\n⏱️ **Regular Grievances:** 30 working days\n⏱️ **Priority Grievances:** 15 working days\n⏱️ **Emergency Grievances:** 7 working days\n\n**Status Flow:**\nPending → Acknowledged → Officer ko assign → In Progress → Resolved → Closed\n\n📧 Har stage pe **email + SMS** milega\n📱 **UMANG App** pe bhi check kar sakte ho\n\n30 din mein solve na ho toh:\n• Portal se Reminder bhejein\n• Appeal file karein\n• DPG, Cabinet Secretariat se contact karein',
  },
  documents: {
    english: '**Documents Required for Filing:**\n\n📄 **Identity Proof (any one):**\n• Aadhaar Card • PAN Card • Voter ID • Passport\n\n📎 **Supporting Documents:**\n• Previous correspondence with the department\n• Relevant receipts, bills, or challan\n• Photographs or evidence (if applicable)\n• Any order/notice received from government\n\n**File Format:** PDF, JPG, PNG\n**Max Size:** 10 MB per attachment\n**Max Files:** Up to 5 documents per grievance\n\n💡 Tip: Clear scans with readable text speed up resolution.',
    hindi: '**शिकायत दर्ज करने के लिए आवश्यक दस्तावेज़:**\n\n📄 **पहचान प्रमाण (कोई एक):**\n• आधार कार्ड • पैन कार्ड • मतदाता पहचान पत्र • पासपोर्ट\n\n📎 **सहायक दस्तावेज़:**\n• विभाग के साथ पिछला पत्र-व्यवहार\n• प्रासंगिक रसीदें, बिल, या चालान\n• तस्वीरें या सबूत (यदि लागू हो)\n• सरकार का कोई आदेश/नोटिस\n\n**फ़ाइल प्रारूप:** PDF, JPG, PNG\n**अधिकतम आकार:** प्रति अटैचमेंट 10 MB\n**अधिकतम फ़ाइलें:** प्रति शिकायत 5 दस्तावेज़',
    hinglish: '**Filing ke liye kaunse documents chahiye:**\n\n📄 **Identity Proof (koi ek):**\n• Aadhaar Card • PAN Card • Voter ID • Passport\n\n📎 **Supporting Documents:**\n• Department ke saath purana correspondence\n• Receipts, bills, ya challan\n• Photos ya evidence (agar ho toh)\n• Government ka koi order/notice\n\n**Format:** PDF, JPG, PNG\n**Max Size:** 10 MB per file\n**Max Files:** 5 documents per grievance\n\n💡 Tip: Clear aur readable scans attach karein — jaldi resolve hoga.',
  },
  security: {
    english: '**Data Security & Privacy:**\n\n🔒 **Encryption:** 256-bit SSL end-to-end encryption\n🛡️ **Authentication:** JWT token-based session management\n🤖 **Bot Protection:** CAPTCHA verification on forms\n💉 **Injection Prevention:** NoSQL injection + XSS protection\n🔐 **Rate Limiting:** Redis-backed to prevent brute force attacks\n\n**Your data is safe:**\n• Only authorized Nodal Officers can view your grievance\n• Personal details are not shared publicly\n• Follows MeitY (Ministry of Electronics & IT) cybersecurity guidelines\n• Data stored on Government-secured servers\n\n⚠️ **Beware of scams:** Government does NOT charge any fee for filing.',
    hindi: '**डेटा सुरक्षा और गोपनीयता:**\n\n🔒 **एन्क्रिप्शन:** 256-बिट SSL एन्क्रिप्शन\n🛡️ **प्रमाणीकरण:** JWT टोकन आधारित सत्र प्रबंधन\n🤖 **बॉट सुरक्षा:** CAPTCHA सत्यापन\n💉 **इंजेक्शन रोकथाम:** NoSQL + XSS सुरक्षा\n🔐 **रेट लिमिटिंग:** ब्रूट फोर्स हमलों को रोकने के लिए\n\n**आपका डेटा सुरक्षित है:**\n• केवल अधिकृत अधिकारी ही शिकायत देख सकते हैं\n• व्यक्तिगत विवरण सार्वजनिक नहीं किए जाते\n• MeitY साइबर सुरक्षा दिशानिर्देशों का पालन\n\n⚠️ **धोखाधड़ी से सावधान:** सरकार कोई शुल्क नहीं लेती!',
    hinglish: '**Data Security & Privacy:**\n\n🔒 256-bit SSL encryption se data secure hai\n🛡️ JWT token-based authentication\n🤖 CAPTCHA se bots block hote hain\n💉 NoSQL injection aur XSS attacks se protection\n🔐 Rate limiting se brute force attacks ruke hain\n\n**Aapka data safe hai:**\n• Sirf authorized officers hi aapki complaint dekh sakte hain\n• Personal details publicly share nahi hoti\n• MeitY cybersecurity guidelines follow hoti hain\n\n⚠️ **Dhyan rakhein:** Government koi fee NAHI leti! Scam se bachein.',
  },
  anonymous: {
    english: '**Anonymous Grievance Filing:**\n\nYes! You can file a grievance without providing your identity.\n\n**How it works:**\n• You still get a unique Registration Number to track your complaint\n• Your identity is NOT revealed to the department\n\n**Limitations of anonymous filing:**\n• Department cannot contact you for clarification\n• You won\'t receive SMS/email updates (only track via portal)\n• Appeal option may be limited\n\n💡 **Recommendation:** Provide your contact details for better resolution. Your information is kept confidential.',
    hindi: '**गुमनाम शिकायत दर्ज करना:**\n\nहाँ! आप अपनी पहचान बताए बिना शिकायत दर्ज कर सकते हैं।\n\n**यह कैसे काम करता है:**\n• आपको ट्रैकिंग के लिए एक पंजीकरण नंबर मिलता है\n• आपकी पहचान विभाग को नहीं बताई जाती\n\n**सीमाएं:**\n• विभाग स्पष्टीकरण के लिए आपसे संपर्क नहीं कर सकता\n• SMS/ईमेल अपडेट नहीं मिलेंगे\n• अपील का विकल्प सीमित हो सकता है\n\n💡 **सुझाव:** बेहतर समाधान के लिए अपना संपर्क विवरण दें।',
    hinglish: '**Bina naam diye shikayat darj karein:**\n\nHaan! Bina identity bataye complaint file kar sakte ho.\n\n**Kaise kaam karta hai:**\n• Registration Number milega tracking ke liye\n• Aapki identity department ko nahi pata chalegi\n\n**Limitations:**\n• Department aapse clarification ke liye contact nahi kar payega\n• SMS/email updates nahi milenge\n• Appeal ka option limited ho sakta hai\n\n💡 **Suggestion:** Contact details dena better hai — jaldi resolve hoga aur updates milenge.',
  },
  nodal: {
    english: '**Nodal PG Officers:**\n\nEvery government department has a designated **Nodal Public Grievance Officer** responsible for resolving your complaint.\n\n**How to find them:**\n• Go to "Nodal PG Officers" in the navigation menu\n• Options: Central Ministry Officers, State Government Officers, District Level Officers, PSU Officers\n• You can also download the full Officers Directory (PDF)\n\n**What they do:**\n• Receive and review your grievance\n• Coordinate with internal departments\n• Ensure resolution within SLA (30 days)\n• Update status on the portal\n\nIf the Nodal Officer doesn\'t resolve your issue, escalate to the **Appellate Authority** via "Nodal Authority for Appeal".',
    hindi: '**नोडल लोक शिकायत अधिकारी:**\n\nहर सरकारी विभाग में एक **नोडल लोक शिकायत अधिकारी** होता है जो आपकी शिकायत का समाधान करता है।\n\n**कैसे खोजें:**\n• नेवीगेशन मेनू से "Nodal PG Officers" पर जाएं\n• केंद्रीय मंत्रालय, राज्य सरकार, जिला स्तर, PSU अधिकारी\n• पूरी अधिकारी सूची (PDF) डाउनलोड करें\n\n**वे क्या करते हैं:**\n• आपकी शिकायत प्राप्त करते हैं और समीक्षा करते हैं\n• आंतरिक विभागों से समन्वय करते हैं\n• SLA (30 दिन) के भीतर समाधान सुनिश्चित करते हैं\n\nयदि नोडल अधिकारी समस्या हल नहीं करता → **अपीलीय प्राधिकरण** से संपर्क करें।',
    hinglish: '**Nodal PG Officers:**\n\nHar government department mein ek **Nodal Officer** hota hai jo aapki complaint handle karta hai.\n\n**Kaise dhundhein:**\n• Top menu se "Nodal PG Officers" pe jaayein\n• Central Ministry, State Government, District Level, PSU Officers — sab mil jaayenge\n• Officers Directory (PDF) bhi download kar sakte ho\n\n**Ye kya karte hain:**\n• Aapki grievance receive karke review karte hain\n• Internal departments se coordinate karte hain\n• 30 din ke andar resolve karna hota hai\n\nAgar Nodal Officer resolve na kare → "Nodal Authority for Appeal" se escalate karein.',
  },
  website: {
    english: '**About JanSamadhan Portal:**\n\n🏛️ **What is it?** Centralized Public Grievance Redress & Monitoring System — an official Government of India portal.\n\n**Sections available:**\n• **Grievance** — File public, pension, service, or PMO grievances\n• **View Status** — Track grievance, appeal, pension, reminder status\n• **Nodal PG Officers** — Find officers from Central, State, District, PSU\n• **Redress Process** — 6-step grievance resolution flow\n• **Nodal Authority for Appeal** — Escalate unresolved grievances\n• **About Us** — Portal description, exclusions, DPG info\n• **FAQs** — 8 detailed Q&As about the portal\n• **Contact Us** — Helpline, email, address\n\n**Key Stats:** 2.5M+ resolved, 580+ departments, 36 States/UTs, 95% resolution rate\n\n🤖 **Pradarshak AI** — Your guide (that\'s me!) available 24/7.',
    hindi: '**जनसमाधान पोर्टल के बारे में:**\n\n🏛️ **यह क्या है?** केंद्रीकृत लोक शिकायत निवारण और निगरानी प्रणाली — भारत सरकार का आधिकारिक पोर्टल।\n\n**उपलब्ध अनुभाग:**\n• **शिकायत** — सार्वजनिक, पेंशन, सेवा, PMO शिकायतें\n• **स्थिति देखें** — शिकायत, अपील, पेंशन की स्थिति ट्रैक करें\n• **नोडल अधिकारी** — केंद्रीय, राज्य, जिला, PSU अधिकारी\n• **निवारण प्रक्रिया** — 6 चरणीय शिकायत समाधान प्रवाह\n• **अपील प्राधिकरण** — अनसुलझी शिकायतों को आगे बढ़ाएं\n• **हमारे बारे में** — पोर्टल विवरण, अपवाद\n• **FAQs** — 8 विस्तृत प्रश्नोत्तर\n• **संपर्क करें** — हेल्पलाइन, ईमेल, पता\n\n**प्रमुख आंकड़े:** 25 लाख+ हल, 580+ विभाग, 36 राज्य/केंद्र शासित प्रदेश, 95% समाधान दर',
    hinglish: '**JanSamadhan Portal ke baare mein:**\n\n🏛️ **Ye kya hai?** Government of India ka official grievance portal.\n\n**Portal mein kya-kya hai:**\n• **Grievance** — Public, pension, service, PMO grievances file karein\n• **View Status** — Complaint, appeal, pension ka status track karein\n• **Nodal Officers** — Central, State, District, PSU officers dhundhein\n• **Redress Process** — 6-step process\n• **Appeal** — Unsatisfied ho toh appeal karein\n• **About Us** — Portal ki poori jaankari\n• **FAQs** — 8 detailed sawal-jawaab\n• **Contact Us** — Helpline, email, address\n\n**Stats:** 25 lakh+ resolved, 580+ departments, 36 States/UTs, 95% rate',
  },
  contact: {
    english: '**Contact Information:**\n\n📞 **Toll-Free Helpline:** 1800-11-0031\n⏰ Mon–Sat, 9:00 AM – 6:00 PM\n\n📧 **Email:** grievance@jansamadhan.gov.in\n⏰ Response within 24 hours\n\n🏢 **Office:** Sardar Patel Bhawan, Sansad Marg, New Delhi – 110001\n\n🌐 **Portal:** Available 24/7 at jansamadhan.gov.in\n📱 **Mobile:** UMANG App (Google Play Store / Apple App Store)\n\n**Also reach us through:**\n• MyGov.in\n• india.gov.in\n• CPGRAMS (pgportal.gov.in)',
    hindi: '**संपर्क जानकारी:**\n\n📞 **टोल-फ्री हेल्पलाइन:** 1800-11-0031\n⏰ सोम–शनि, सुबह 9:00 – शाम 6:00\n\n📧 **ईमेल:** grievance@jansamadhan.gov.in\n⏰ 24 घंटे में जवाब\n\n🏢 **कार्यालय:** सरदार पटेल भवन, संसद मार्ग, नई दिल्ली – 110001\n\n🌐 **पोर्टल:** 24/7 उपलब्ध\n📱 **मोबाइल:** UMANG ऐप',
    hinglish: '**Contact details:**\n\n📞 **Toll-Free Helpline:** 1800-11-0031\n⏰ Mon–Sat, 9 AM – 6 PM\n\n📧 **Email:** grievance@jansamadhan.gov.in\n⏰ 24 ghante mein reply\n\n🏢 **Office:** Sardar Patel Bhawan, Sansad Marg, New Delhi – 110001\n\n🌐 **Portal:** 24/7 available\n📱 **Mobile:** UMANG App pe bhi use karein',
  },
  greeting: {
    english: 'Hello! 🙏 Welcome to **JanSamadhan**.\n\nI\'m **Pradarshak**, your AI assistant. I can help with:\n• Filing a grievance\n• Tracking complaint status\n• Appeal process\n• Department information\n• Nodal officers\n• And everything on this website!\n\nType **"help"** for all topics, or just ask your question!',
    hindi: 'नमस्ते! 🙏 **जनसमाधान** में आपका स्वागत है।\n\nमैं **प्रदर्शक** हूँ, आपका AI सहायक। मैं इनमें मदद कर सकता हूँ:\n• शिकायत दर्ज करना\n• शिकायत की स्थिति ट्रैक करना\n• अपील प्रक्रिया\n• विभाग की जानकारी\n• नोडल अधिकारी\n• और इस वेबसाइट पर सब कुछ!\n\nसभी विषयों के लिए **"madad"** टाइप करें!',
    hinglish: 'Namaste! 🙏 **JanSamadhan** mein aapka swagat hai.\n\nMain **Pradarshak** hoon, aapka AI assistant. Main help kar sakta hoon:\n• Shikayat file karna\n• Complaint ka status track karna\n• Appeal process\n• Department ki jaankari\n• Nodal officers\n• Aur portal ki har cheez!\n\n**"help"** ya **"madad"** type karein saare topics ke liye!',
  },
  help: {
    english: 'I can help you with:\n\n📝 **"lodge grievance"** — How to file a complaint\n🔍 **"track status"** — Check complaint status\n⚖️ **"appeal"** — File an appeal if unsatisfied\n🏛️ **"departments"** — 580+ connected departments\n👨‍💼 **"nodal officers"** — Find PG officers\n⏱️ **"timeline"** — Resolution timelines (SLA)\n📄 **"documents"** — Required documents for filing\n🔒 **"security"** — Data security information\n👤 **"anonymous"** — Filing without identity\n📞 **"contact"** — Helpline & email\n🌐 **"website"** — About this portal & sections\n\nYou can ask in **English, Hindi, or Hinglish** — I understand all! 🇮🇳',
    hindi: 'मैं इनमें मदद कर सकता हूँ:\n\n📝 **"शिकायत दर्ज"** — शिकायत कैसे दर्ज करें\n🔍 **"स्थिति जानें"** — शिकायत की स्थिति जानें\n⚖️ **"अपील"** — असंतुष्ट होने पर अपील करें\n🏛️ **"विभाग"** — 580+ जुड़े विभाग\n👨‍💼 **"नोडल अधिकारी"** — PG अधिकारी खोजें\n⏱️ **"समय"** — समाधान की समय-सीमा\n📄 **"दस्तावेज़"** — आवश्यक दस्तावेज़\n🔒 **"सुरक्षा"** — डेटा सुरक्षा\n👤 **"गुमनाम"** — बिना पहचान शिकायत\n📞 **"संपर्क"** — हेल्पलाइन और ईमेल\n\nआप **हिंदी, अंग्रेजी, या हिंग्लिश** में पूछ सकते हैं! 🇮🇳',
    hinglish: 'Main in sab mein help kar sakta hoon:\n\n📝 **"shikayat"** — Complaint kaise file karein\n🔍 **"status"** — Complaint ka status check karein\n⚖️ **"appeal"** — Unsatisfied ho toh appeal karein\n🏛️ **"departments"** — 580+ jude vibhaag\n👨‍💼 **"nodal officers"** — PG officers dhundhein\n⏱️ **"time"** — Kitne din mein resolve hoga\n📄 **"documents"** — Kaunse documents chahiye\n🔒 **"security"** — Data safe hai ya nahi\n👤 **"anonymous"** — Bina naam diye file karein\n📞 **"contact"** — Helpline aur email\n🌐 **"website"** — Portal ke baare mein\n\n**English, Hindi, ya Hinglish** — sab samajhta hoon! 🇮🇳',
  },
  thanks: {
    english: 'You\'re welcome! 🙏 Happy to help.\n\nIf you need further assistance, feel free to ask anytime.\n📞 Helpline: **1800-11-0031**\n\nJai Hind! 🇮🇳',
    hindi: 'आपका स्वागत है! 🙏 मदद करके खुशी हुई।\n\nकिसी और सहायता के लिए कभी भी पूछें।\n📞 हेल्पलाइन: **1800-11-0031**\n\nजय हिंद! 🇮🇳',
    hinglish: 'Koi baat nahi! 🙏 Madad karke khushi hui.\n\nAur kuch puchna ho toh kabhi bhi puchho.\n📞 Helpline: **1800-11-0031**\n\nJai Hind! 🇮🇳',
  },
  fee: {
    english: '**No Fee for Filing Grievances!**\n\n⚠️ The Government does **NOT** charge any fee for filing, tracking, or resolving grievances on JanSamadhan.\n\nAll money being paid to any third party for filing grievances goes only to **unauthorized agents**.\n\n🚨 **Report scams** to:\n📞 1800-11-0031\n📧 grievance@jansamadhan.gov.in',
    hindi: '**शिकायत दर्ज करने का कोई शुल्क नहीं!**\n\n⚠️ सरकार शिकायत दर्ज करने, ट्रैक करने या हल करने के लिए **कोई शुल्क नहीं** लेती।\n\nकिसी तीसरे पक्ष को दिया गया पैसा **अनधिकृत एजेंटों** को जाता है।\n\n🚨 **धोखाधड़ी की रिपोर्ट करें:**\n📞 1800-11-0031\n📧 grievance@jansamadhan.gov.in',
    hinglish: '**Koi fees nahi lagti!**\n\n⚠️ Government complaint file karne, track karne, ya resolve karne ke liye **koi paisa NAHI leti**.\n\nAgar koi paisa maang raha hai toh woh **fraud** hai.\n\n🚨 **Scam report karein:**\n📞 1800-11-0031\n📧 grievance@jansamadhan.gov.in',
  },
};

// ===== Match user message to a topic =====
function matchTopic(text) {
  const l = text.toLowerCase();
  // Hindi keywords
  const hindiMap = {
    lodge: ['शिकायत दर्ज', 'शिकायत करना', 'complaint करना', 'शिकायत भेज', 'शिकायत लिख', 'grievance दर्ज', 'शिकायत कैसे', 'complaint kaise', 'shikayat', 'darj', 'file', 'lodge', 'submit', 'complaint', 'grievance', 'register', 'भेजना', 'लिखना', 'लिखें', 'दर्ज करें', 'शिकायत फाइल', 'समस्या बताओ', 'problem report'],
    track: ['track', 'status', 'स्थिति', 'ट्रैक', 'ट्रैकिंग', 'pata', 'kaha', 'kahan', 'pahunchi', 'pahunch', 'pahuncha', 'kya hua', 'kab tak', 'kitna', 'kahan tak', 'registration number', 'complaint no', 'stiti', 'sthiti', 'jaanch', 'jaanchen', 'jaan', 'jaano', 'check', 'dekhna', 'dekho', 'dekhen', 'pata lagao', 'kya ho raha'],
    appeal: ['appeal', 'अपील', 'unsatisfied', 'not happy', 'satisfied nahi', 'santusht nahi', 'संतुष्ट नहीं', 'khush nahi', 'theek nahi', 'complain again', 'dobara', 'fir se', 'escalate', 'badha', 'aage', 'upar', 'ऊपर भेजो', 'आगे भेजो', 'poor rating'],
    departments: ['department', 'vibhag', 'विभाग', 'ministry', 'mantralaya', 'मंत्रालय', 'konsa', 'which', 'kaunsa', 'कौनसा', 'list', 'suchi', 'सूची', 'railway', 'education', 'health', 'finance', 'defence', 'agriculture', 'home', 'sabhi vibhag', 'saare department', 'connected', 'jude'],
    timeline: ['kitne din', 'kab tak', 'time', 'samay', 'समय', 'दिन', 'कब', 'kitna', 'how long', 'deadline', 'sla', '30 din', '15 din', '7 din', 'kitna waqt', 'waqt', 'expected', 'jaldi'],
    documents: ['document', 'दस्तावेज़', 'kagaz', 'कागज', 'upload', 'attach', 'photo', 'aadhaar', 'pan', 'id proof', 'pehchaan', 'पहचान', 'jaroori', 'zaruri', 'ज़रूरी', 'papers', 'format', 'size', 'kb', 'mb', 'file type', 'kaun se', 'konse', 'kya chahiye', 'kya lagega'],
    security: ['safe', 'secure', 'suraksha', 'सुरक्षा', 'security', 'data', 'privacy', 'गोपनीय', 'gopniya', 'hack', 'attack', 'ssl', 'encrypt', 'protected', 'kya mera data', 'information safe', 'safe hai', 'leakage', 'leak'],
    anonymous: ['anonymous', 'गुमनाम', 'bina naam', 'without name', 'bina identity', 'pehchaan chhupake', 'chhupaake', 'gumnaam', 'bin bataye', 'confidential', 'secretly'],
    nodal: ['nodal', 'officer', 'अधिकारी', 'adhikari', 'pg officer', 'kaun dekhega', 'kaun handle', 'kaun sunega', 'kisko', 'complaint kaun', 'kisse milein', 'officer kaun', 'officer kahan', 'officer list', 'directory'],
    contact: ['contact', 'call', 'phone', 'number', 'helpline', 'email', 'mail', 'पता', 'address', 'sampark', 'संपर्क', 'baat karni', 'phone karo', 'call karo', 'toll free', '1800', 'kahan milein', 'kaha se'],
    website: ['website', 'portal', 'ye kya hai', 'kya hai', 'about', 'konsa portal', 'yeh website', 'is portal', 'इस वेबसाइट', 'jansamadhan kya', 'baare mein', 'features', 'page', 'section', 'kya kya hai', 'poora batao', 'sab batao', 'poori jaankari'],
    fee: ['fee', 'paisa', 'money', 'charge', 'cost', 'kitna lagta', 'free', 'muft', 'मुफ्त', 'शुल्क', 'paise', 'rupees', 'rs', 'amount', 'bhugtan', 'payment', 'lagat', 'kharcha', 'खर्चा', 'scam', 'fraud', 'dhoka', 'dhokha', 'धोखा'],
    help: ['help', 'madad', 'मदद', 'sahayata', 'सहायता', 'kya kar sakte', 'options', 'menu', 'list', 'sab batao', 'topics', 'btao kya kya', 'kya kya', 'sab topics'],
    thanks: ['thank', 'dhanyavad', 'धन्यवाद', 'shukriya', 'शुक्रिया', 'thanks', 'thnx', 'thx', 'bahut accha', 'great', 'nice', 'good', 'perfect', 'awesome', 'theek hai', 'ok', 'okay', 'sahi'],
    greeting: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'नमस्ते', 'नमस्कार', 'aadaab', 'pranam', 'assalam', 'ram ram', 'jai hind', 'hola', 'good morning', 'good evening', 'good afternoon', 'shubh', 'शुभ'],
  };

  for (const [topic, keywords] of Object.entries(hindiMap)) {
    for (const kw of keywords) {
      if (l.includes(kw)) return topic;
    }
  }
  return 'help';
}

function getResponse(message) {
  const lang = detectLanguage(message);
  const topic = matchTopic(message);
  const entry = KB[topic];
  if (entry) return entry[lang] || entry.english;
  return KB.help[lang] || KB.help.english;
}

// ===== COMPONENT =====
export default function PradarshakAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const lang = 'hinglish';
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Namaste! 🙏 Main **Pradarshak** hoon — aapka JanSamadhan AI assistant.\n\nMain aapki madad kar sakta hoon:\n• Shikayat file karna\n• Status track karna\n• Appeal process\n• Department jaankari\n• Nodal officers\n\n*🇮🇳\n\nApna sawal puchiye!', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const quickQuestions = [
    { label: '📝 Shikayat kaise karein?', msg: 'shikayat kaise darj karein' },
    { label: '🔍 Status kaise check karein?', msg: 'complaint ka status kaise check karein' },
    { label: '📄 Kaunse documents chahiye?', msg: 'kaunse documents chahiye filing ke liye' },
    { label: '📞 Helpline number kya hai?', msg: 'helpline number batao' },
    { label: '🏛️ कौन से विभाग जुड़े हैं?', msg: 'कौन कौन से विभाग जुड़े हैं इस पोर्टल में' },
    { label: '⚖️ Appeal कैसे करें?', msg: 'अपील कैसे दायर करें' },
  ];

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date() }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const response = getResponse(msg);
      setMessages(prev => [...prev, { role: 'assistant', text: response, time: new Date() }]);
      setIsTyping(false);
    }, 500 + Math.random() * 700);
  };

  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      let f = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <span key={i} dangerouslySetInnerHTML={{ __html: f }} style={{ display: 'block', marginBottom: line === '' ? 6 : 1 }} />;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileHover={{ scale: 1.1 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed', bottom: 28, right: 28, width: 64, height: 64,
              borderRadius: '50%', background: 'linear-gradient(135deg, #FF9933, #E8860D)',
              color: '#fff', border: 'none', cursor: 'pointer', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(255,153,51,0.4)', fontSize: 28,
            }}
          >
            <RiRobot2Line />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      {!isOpen && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}
          style={{ position: 'fixed', bottom: 100, right: 28, background: '#fff', padding: '10px 16px', borderRadius: '12px 12px 0 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 9998, fontSize: 13, fontWeight: 600, color: '#000080', maxWidth: 200 }}
        >
          👋 Madad chahiye? <strong>Pradarshak</strong> se puchiye!
        </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: 28, right: 28, width: 400, maxWidth: 'calc(100vw - 40px)',
              height: isMinimized ? 'auto' : 580, maxHeight: 'calc(100vh - 60px)',
              background: '#fff', borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', zIndex: 9999,
              display: 'flex', flexDirection: 'column', border: '1px solid #dee2e6',
            }}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #000080, #00005C)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,153,51,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9933', fontSize: 20 }}>
                  <RiRobot2Line />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Pradarshak (प्रदर्शक)</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                    {isTyping ? '● टाइप कर रहा है...' : '● Online'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}>
                  {isMinimized ? <FiMaximize2 size={15} /> : <FiMinimize2 size={15} />}
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}>
                  <FiX size={17} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8f9fa' }}>
                  {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                      {msg.role === 'assistant' && (
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#000080', color: '#FF9933', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                          <RiRobot2Line />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '82%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: msg.role === 'user' ? '#000080' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#343a40',
                        fontSize: 12.5, lineHeight: 1.55, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                        border: msg.role === 'user' ? 'none' : '1px solid #e9ecef',
                      }}>
                        {formatMessage(msg.text)}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#000080', color: '#FF9933', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><RiRobot2Line /></div>
                      <div style={{ padding: '10px 18px', background: '#fff', borderRadius: '14px 14px 14px 4px', border: '1px solid #e9ecef' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#adb5bd', animation: `pulse 1s infinite ${i * 0.2}s` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 2 && (
                  <div style={{ padding: '6px 14px 8px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid #e9ecef', background: '#fff' }}>
                    {quickQuestions.map((q, i) => (
                      <button key={i} onClick={() => handleSend(q.msg)} style={{
                        padding: '5px 10px', borderRadius: '100px', border: '1px solid #dee2e6',
                        background: '#fff', color: '#000080', fontSize: 10.5, fontWeight: 600,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>{q.label}</button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div style={{ padding: '10px 14px', borderTop: '1px solid #e9ecef', display: 'flex', gap: 8, alignItems: 'center', background: '#fff' }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask your query..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #dee2e6', fontSize: 13, outline: 'none', background: '#f8f9fa', color: '#212529' }}
                  />
                  <button onClick={() => handleSend()} style={{
                    width: 38, height: 38, borderRadius: '10px', background: '#FF9933', color: '#fff',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><FiSend size={16} /></button>
                </div>

                <div style={{ padding: '5px 14px 8px', textAlign: 'center', fontSize: 9, color: '#adb5bd', background: '#fff' }}>
                  🇮🇳 Pradarshak AI · JanSamadhan, Govt. of India
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
