/* Languages: English, Hindi (हिंदी) and Odia (ଓଡ଼ିଆ).
   MB.t("English text") returns the text in the chosen language (English if no translation exists).
   Also: language detection for questions, and a small word list that turns Hindi/Odia health words
   into English so the English encyclopedia can be searched even without internet. */
(function () {
  "use strict";
  var MB = (window.MB = window.MB || {});
  MB.LANGS = [["en", "English", "English"], ["hi", "हिंदी", "Hindi"], ["or", "ଓଡ଼ିଆ", "Odia"]];

  // [English, Hindi, Odia]
  var ROWS = [
    ["Home", "होम", "ମୂଳ ପୃଷ୍ଠା"], ["Ask", "पूछें", "ପଚାରନ୍ତୁ"], ["Library", "लाइब्रेरी", "ଲାଇବ୍ରେରୀ"], ["Emergency", "आपातकाल", "ଜରୁରୀକାଳୀନ"], ["Profile", "प्रोफ़ाइल", "ପ୍ରୋଫାଇଲ୍"],
    ["SOS", "SOS", "SOS"], ["Online", "ऑनलाइन", "ଅନଲାଇନ୍"], ["Offline", "ऑफ़लाइन", "ଅଫଲାଇନ୍"],
    ["Online AI answers", "ऑनलाइन AI उत्तर", "ଅନଲାଇନ୍ AI ଉତ୍ତର"], ["Answers from the encyclopedia on this phone", "इस फ़ोन में रखे विश्वकोश से उत्तर", "ଏହି ଫୋନରେ ଥିବା ବିଶ୍ୱକୋଷରୁ ଉତ୍ତର"],
    ["Medibot gives general information from The Gale Encyclopedia of Medicine. It is not medical advice or a diagnosis. In an emergency, call 108.",
      "मेडिबॉट The Gale Encyclopedia of Medicine से सामान्य जानकारी देता है। यह डॉक्टर की सलाह या जाँच नहीं है। आपातकाल में 108 पर कॉल करें।",
      "ମେଡିବଟ୍ The Gale Encyclopedia of Medicine ରୁ ସାଧାରଣ ତଥ୍ୟ ଦିଏ। ଏହା ଡାକ୍ତରୀ ପରାମର୍ଶ କିମ୍ବା ରୋଗ ନିର୍ଣ୍ଣୟ ନୁହେଁ। ଜରୁରୀ ସ୍ଥିତିରେ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    ["Disclaimer:", "अस्वीकरण:", "ସୂଚନା:"],
    ["These results are based on sources (The Gale Encyclopedia of Medicine). For better diagnosis, consult a doctor. Do not start or stop any medicine without medical advice.",
      "ये परिणाम स्रोतों (The Gale Encyclopedia of Medicine) पर आधारित हैं। बेहतर जाँच के लिए डॉक्टर से मिलें। डॉक्टर की सलाह के बिना कोई दवा शुरू या बंद न करें।",
      "ଏହି ଫଳାଫଳ ଉତ୍ସ (The Gale Encyclopedia of Medicine) ଉପରେ ଆଧାରିତ। ଭଲ ରୋଗ ନିର୍ଣ୍ଣୟ ପାଇଁ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ। ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ବିନା କୌଣସି ଔଷଧ ଆରମ୍ଭ କିମ୍ବା ବନ୍ଦ କରନ୍ତୁ ନାହିଁ।"],
    ["Show password", "पासवर्ड दिखाएँ", "ପାସୱାର୍ଡ ଦେଖାନ୍ତୁ"], ["Hide password", "पासवर्ड छिपाएँ", "ପାସୱାର୍ଡ ଲୁଚାନ୍ତୁ"],
    ["Don't know", "पता नहीं", "ଜଣା ନାହିଁ"], ["Date of birth", "जन्म तिथि", "ଜନ୍ମ ତାରିଖ"], ["Day", "दिन", "ଦିନ"], ["Month", "महीना", "ମାସ"], ["Year", "वर्ष", "ବର୍ଷ"],
    ["Please choose a real date.", "कृपया सही तारीख चुनें।", "ଦୟାକରି ଠିକ୍ ତାରିଖ ବାଛନ୍ତୁ।"], ["Age: {n} years", "उम्र: {n} वर्ष", "ବୟସ: {n} ବର୍ଷ"],
    ["Profile photo", "प्रोफ़ाइल फ़ोटो", "ପ୍ରୋଫାଇଲ୍ ଫଟୋ"], ["optional", "वैकल्पिक", "ଇଚ୍ଛାଧୀନ"], ["Take photo", "फ़ोटो लें", "ଫଟୋ ନିଅନ୍ତୁ"], ["Gallery", "गैलरी", "ଗ୍ୟାଲେରୀ"],
    ["Remove", "हटाएँ", "ହଟାନ୍ତୁ"], ["That file is not a picture.", "यह फ़ाइल फ़ोटो नहीं है।", "ଏହି ଫାଇଲ୍ ଫଟୋ ନୁହେଁ।"], ["Cancel", "रद्द करें", "ବାତିଲ୍"],
    ["Call {name} ({num})?", "{name} ({num}) को कॉल करें?", "{name} ({num}) କୁ କଲ୍ କରିବେ?"],
    ["Tell the operator the patient's condition and your exact location.", "ऑपरेटर को मरीज़ की हालत और अपनी सही जगह बताएँ।", "ଅପରେଟରଙ୍କୁ ରୋଗୀଙ୍କ ଅବସ୍ଥା ଓ ଆପଣଙ୍କ ସଠିକ୍ ସ୍ଥାନ କୁହନ୍ତୁ।"],
    ["Call {num} now", "अभी {num} पर कॉल करें", "ଏବେ {num} କୁ କଲ୍ କରନ୍ତୁ"], ["Call {num}", "{num} पर कॉल करें", "{num} କୁ କଲ୍ କରନ୍ତୁ"],
    ["Use the emergency call only in a real emergency. Any false or misleading call may lead to severe punishment.",
      "आपातकालीन कॉल का उपयोग केवल असली आपातकाल में करें। झूठी या भ्रामक कॉल पर कड़ी सज़ा हो सकती है।",
      "ଜରୁରୀକାଳୀନ କଲ୍ କେବଳ ପ୍ରକୃତ ଜରୁରୀ ସ୍ଥିତିରେ କରନ୍ତୁ। ମିଛ କିମ୍ବା ଭ୍ରାମକ କଲ୍ ପାଇଁ କଠୋର ଦଣ୍ଡ ହୋଇପାରେ।"],
    // welcome
    ["Health answers you can trust, in your language. Online or offline.", "भरोसेमंद स्वास्थ्य जानकारी, आपकी भाषा में। इंटरनेट के साथ या बिना।", "ଭରସାଯୋଗ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ, ଆପଣଙ୍କ ଭାଷାରେ। ଇଣ୍ଟରନେଟ୍ ସହ କିମ୍ବା ବିନା।"],
    ["Ask health questions", "स्वास्थ्य के सवाल पूछें", "ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ"], ["Clear, point-by-point answers with sources", "स्रोत के साथ साफ़, बिंदुवार उत्तर", "ଉତ୍ସ ସହ ସ୍ପଷ୍ଟ, ବିନ୍ଦୁ ଅନୁସାରେ ଉତ୍ତର"],
    ["Works without internet", "बिना इंटरनेट के चलता है", "ଇଣ୍ଟରନେଟ୍ ବିନା ଚାଲେ"], ["The encyclopedia and 203 diseases are stored on your phone", "विश्वकोश और 203 बीमारियाँ आपके फ़ोन में रखी हैं", "ବିଶ୍ୱକୋଷ ଓ 203 ରୋଗ ଆପଣଙ୍କ ଫୋନରେ ଅଛି"],
    ["Emergency help", "आपातकालीन मदद", "ଜରୁରୀକାଳୀନ ସାହାଯ୍ୟ"], ["One tap to call 108, plus first-aid guides", "एक टैप में 108, साथ में प्राथमिक उपचार गाइड", "ଗୋଟିଏ ଟ୍ୟାପରେ 108, ସହ ପ୍ରାଥମିକ ଚିକିତ୍ସା ଗାଇଡ୍"],
    ["Private", "निजी", "ଗୋପନୀୟ"], ["Your details and chats stay on this phone", "आपकी जानकारी और चैट इसी फ़ोन में रहती हैं", "ଆପଣଙ୍କ ତଥ୍ୟ ଓ ଚାଟ୍ ଏହି ଫୋନରେ ରହେ"],
    ["Create free account", "मुफ़्त खाता बनाएँ", "ମାଗଣା ଖାତା ଖୋଲନ୍ତୁ"], ["I already have an account", "मेरा खाता पहले से है", "ମୋର ଖାତା ଅଛି"],
    ["For education only. Not a substitute for a doctor.", "केवल जानकारी के लिए। डॉक्टर का विकल्प नहीं।", "କେବଳ ଶିକ୍ଷା ପାଇଁ। ଡାକ୍ତରଙ୍କ ବିକଳ୍ପ ନୁହେଁ।"],
    // register
    ["Create your account", "अपना खाता बनाएँ", "ଆପଣଙ୍କ ଖାତା ଖୋଲନ୍ତୁ"], ["It takes a minute. You can sign up with your mobile number or your email.", "एक मिनट लगेगा। आप मोबाइल नंबर या ईमेल से खाता बना सकते हैं।", "ଏକ ମିନିଟ୍ ଲାଗିବ। ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲ୍ ଦ୍ୱାରା ଖାତା ଖୋଲିପାରିବେ।"],
    ["Sign up with", "किससे खाता बनाएँ", "କେଉଁଥିରେ ଖାତା ଖୋଲିବେ"], ["Mobile number", "मोबाइल नंबर", "ମୋବାଇଲ୍ ନମ୍ବର"], ["Email", "ईमेल", "ଇମେଲ୍"],
    ["Mobile number (optional)", "मोबाइल नंबर (वैकल्पिक)", "ମୋବାଇଲ୍ ନମ୍ବର (ଇଚ୍ଛାଧୀନ)"], ["Full name", "पूरा नाम", "ପୂରା ନାମ"], ["Email address", "ईमेल पता", "ଇମେଲ୍ ଠିକଣା"],
    ["We email you a link to confirm it.", "पुष्टि के लिए हम आपको एक लिंक ईमेल करेंगे।", "ନିଶ୍ଚିତ କରିବା ପାଇଁ ଆମେ ଏକ ଲିଙ୍କ୍ ଇମେଲ୍ କରିବୁ।"],
    ["Password", "पासवर्ड", "ପାସୱାର୍ଡ"], ["At least 8 characters, with a letter and a number.", "कम से कम 8 अक्षर, जिसमें एक अक्षर और एक अंक हो।", "ଅତି କମରେ 8 ଅକ୍ଷର, ଗୋଟିଏ ଅକ୍ଷର ଓ ଗୋଟିଏ ସଂଖ୍ୟା ସହ।"],
    ["Confirm password", "पासवर्ड दोबारा लिखें", "ପାସୱାର୍ଡ ପୁଣି ଲେଖନ୍ତୁ"], ["Your health details", "आपकी स्वास्थ्य जानकारी", "ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ"],
    ["Gender", "लिंग", "ଲିଙ୍ଗ"], ["Male", "पुरुष", "ପୁରୁଷ"], ["Female", "महिला", "ମହିଳା"], ["Other", "अन्य", "ଅନ୍ୟ"],
    ["Blood group", "ब्लड ग्रुप", "ରକ୍ତ ଗ୍ରୁପ୍"], ["Helps in an emergency if you need blood.", "आपातकाल में खून की ज़रूरत पड़ने पर काम आता है।", "ଜରୁରୀ ସମୟରେ ରକ୍ତ ଦରକାର ହେଲେ କାମରେ ଆସେ।"],
    ["Address", "पता", "ଠିକଣା"], ["House, street, village or city, PIN", "मकान, गली, गाँव या शहर, पिन", "ଘର, ରାସ୍ତା, ଗାଁ କିମ୍ବା ସହର, ପିନ୍"],
    ["I understand Medibot gives general information and is not a doctor.", "मैं समझता/समझती हूँ कि मेडिबॉट सामान्य जानकारी देता है, डॉक्टर नहीं है।", "ମୁଁ ବୁଝୁଛି ଯେ ମେଡିବଟ୍ ସାଧାରଣ ତଥ୍ୟ ଦିଏ, ଏହା ଡାକ୍ତର ନୁହେଁ।"],
    ["Create account", "खाता बनाएँ", "ଖାତା ଖୋଲନ୍ତୁ"], ["Already registered?", "पहले से खाता है?", "ପୂର୍ବରୁ ଖାତା ଅଛି?"], ["Log in", "लॉग इन", "ଲଗ୍ ଇନ୍"],
    ["Please enter your full name.", "कृपया अपना पूरा नाम लिखें।", "ଦୟାକରି ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ।"], ["Please enter a valid email address.", "कृपया सही ईमेल पता लिखें।", "ଦୟାକରି ଠିକ୍ ଇମେଲ୍ ଠିକଣା ଲେଖନ୍ତୁ।"],
    ["Password needs {list}.", "पासवर्ड में {list} होना चाहिए।", "ପାସୱାର୍ଡରେ {list} ଦରକାର।"], ["at least 8 characters", "कम से कम 8 अक्षर", "ଅତି କମରେ 8 ଅକ୍ଷର"], ["a letter", "एक अक्षर", "ଗୋଟିଏ ଅକ୍ଷର"], ["a number", "एक अंक", "ଗୋଟିଏ ସଂଖ୍ୟା"],
    ["Passwords do not match.", "दोनों पासवर्ड एक जैसे नहीं हैं।", "ଦୁଇଟି ପାସୱାର୍ଡ ମେଳ ଖାଉନାହିଁ।"], ["Please choose your date of birth.", "कृपया अपनी जन्म तिथि चुनें।", "ଦୟାକରି ଆପଣଙ୍କ ଜନ୍ମ ତାରିଖ ବାଛନ୍ତୁ।"],
    ["Please choose a gender.", "कृपया लिंग चुनें।", "ଦୟାକରି ଲିଙ୍ଗ ବାଛନ୍ତୁ।"], ["Please tick the box to confirm you understand Medibot is not a doctor.", "कृपया बॉक्स पर टिक करें कि आप समझते हैं मेडिबॉट डॉक्टर नहीं है।", "ମେଡିବଟ୍ ଡାକ୍ତର ନୁହେଁ ବୋଲି ବୁଝିଥିବା ନିଶ୍ଚିତ କରିବାକୁ ବାକ୍ସରେ ଟିକ୍ ଦିଅନ୍ତୁ।"],
    ["This account is already on this phone. Please log in.", "यह खाता इस फ़ोन में पहले से है। कृपया लॉग इन करें।", "ଏହି ଖାତା ଏହି ଫୋନରେ ପୂର୍ବରୁ ଅଛି। ଦୟାକରି ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    ["Creating account…", "खाता बन रहा है…", "ଖାତା ଖୋଲୁଛି…"], ["Your account is ready.", "आपका खाता तैयार है।", "ଆପଣଙ୍କ ଖାତା ପ୍ରସ୍ତୁତ।"], ["Your account is ready. Please log in.", "आपका खाता तैयार है। कृपया लॉग इन करें।", "ଆପଣଙ୍କ ଖାତା ପ୍ରସ୍ତୁତ। ଦୟାକରି ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    ["Please enter your mobile number.", "कृपया अपना मोबाइल नंबर लिखें।", "ଦୟାକରି ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ଲେଖନ୍ତୁ।"], ["Please enter a valid mobile number, e.g. 9876543210.", "कृपया सही मोबाइल नंबर लिखें, जैसे 9876543210।", "ଦୟାକରି ଠିକ୍ ମୋବାଇଲ୍ ନମ୍ବର ଲେଖନ୍ତୁ, ଯେପରି 9876543210।"],
    ["This mobile number already has a Medibot account. Please log in.", "इस मोबाइल नंबर का मेडिबॉट खाता पहले से है। कृपया लॉग इन करें।", "ଏହି ମୋବାଇଲ୍ ନମ୍ବରରେ ପୂର୍ବରୁ ମେଡିବଟ୍ ଖାତା ଅଛି। ଦୟାକରି ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    ["This email already has a Medibot account. Please log in (or use Forgot password).", "इस ईमेल का मेडिबॉट खाता पहले से है। कृपया लॉग इन करें (या पासवर्ड भूल गए का उपयोग करें)।", "ଏହି ଇମେଲରେ ପୂର୍ବରୁ ମେଡିବଟ୍ ଖାତା ଅଛି। ଦୟାକରି ଲଗ୍ ଇନ୍ କରନ୍ତୁ (କିମ୍ବା ପାସୱାର୍ଡ ଭୁଲିଗଲେ ବ୍ୟବହାର କରନ୍ତୁ)।"],
    // demo code / email check
    ["Confirm your email", "अपना ईमेल पक्का करें", "ଆପଣଙ୍କ ଇମେଲ୍ ନିଶ୍ଚିତ କରନ୍ତୁ"], ["Enter the 6-digit code.", "6 अंकों का कोड लिखें।", "6 ଅଙ୍କର କୋଡ୍ ଲେଖନ୍ତୁ।"], ["DEMO MODE", "डेमो मोड", "ଡେମୋ ମୋଡ୍"],
    ["One-time code", "एक बार का कोड", "ଏକଥର କୋଡ୍"], ["Verify and create account", "पक्का करें और खाता बनाएँ", "ନିଶ୍ଚିତ କରି ଖାତା ଖୋଲନ୍ତୁ"],
    ["You are offline, so no email could be sent. Use this code:", "आप ऑफ़लाइन हैं, इसलिए ईमेल नहीं भेजा जा सका। यह कोड डालें:", "ଆପଣ ଅଫଲାଇନ୍ ଅଛନ୍ତି, ତେଣୁ ଇମେଲ୍ ପଠାଯାଇପାରିଲା ନାହିଁ। ଏହି କୋଡ୍ ବ୍ୟବହାର କରନ୍ତୁ:"],
    ["Firebase is not set up in this app yet. Use this code:", "इस ऐप में अभी Firebase सेट नहीं है। यह कोड डालें:", "ଏହି ଆପରେ ଏପର୍ଯ୍ୟନ୍ତ Firebase ସେଟ୍ ହୋଇନାହିଁ। ଏହି କୋଡ୍ ବ୍ୟବହାର କରନ୍ତୁ:"],
    ["Check your email", "अपना ईमेल देखें", "ଆପଣଙ୍କ ଇମେଲ୍ ଦେଖନ୍ତୁ"], ["We sent a link to {email}", "हमने {email} पर एक लिंक भेजा है", "ଆମେ {email} କୁ ଏକ ଲିଙ୍କ୍ ପଠାଇଛୁ"],
    ["Open the email from Medibot (noreply@…firebaseapp.com). Not there? Look in Spam or Promotions.", "मेडिबॉट (noreply@…firebaseapp.com) का ईमेल खोलें। नहीं दिखा? Spam या Promotions में देखें।", "ମେଡିବଟ୍ (noreply@…firebaseapp.com) ର ଇମେଲ୍ ଖୋଲନ୍ତୁ। ନାହିଁ କି? Spam କିମ୍ବା Promotions ରେ ଦେଖନ୍ତୁ।"],
    ["Tap the link in the email. A page says your email is verified.", "ईमेल में दिए लिंक पर टैप करें। एक पेज बताएगा कि ईमेल पक्का हो गया।", "ଇମେଲରେ ଥିବା ଲିଙ୍କରେ ଟ୍ୟାପ୍ କରନ୍ତୁ। ଏକ ପୃଷ୍ଠା କହିବ ଯେ ଇମେଲ୍ ନିଶ୍ଚିତ ହେଲା।"],
    ["Come back here and tap the button below.", "यहाँ वापस आकर नीचे का बटन दबाएँ।", "ଏଠାକୁ ଫେରି ତଳ ବଟନ୍ ଦବାନ୍ତୁ।"], ["I've verified my email", "मैंने ईमेल पक्का कर दिया", "ମୁଁ ଇମେଲ୍ ନିଶ୍ଚିତ କରିଦେଲି"],
    ["Use a different email", "दूसरा ईमेल इस्तेमाल करें", "ଅନ୍ୟ ଇମେଲ୍ ବ୍ୟବହାର କରନ୍ତୁ"], ["Resend link in {n}s", "{n} सेकंड में लिंक फिर भेजें", "{n} ସେକେଣ୍ଡରେ ପୁଣି ଲିଙ୍କ୍ ପଠାନ୍ତୁ"], ["Resend link", "लिंक फिर भेजें", "ପୁଣି ଲିଙ୍କ୍ ପଠାନ୍ତୁ"],
    ["A new link was sent to {email}.", "{email} पर नया लिंक भेजा गया।", "{email} କୁ ନୂଆ ଲିଙ୍କ୍ ପଠାଗଲା।"], ["Checking…", "जाँच हो रही है…", "ଯାଞ୍ଚ ଚାଲିଛି…"],
    ["Not verified yet. Open the email and tap the link first (check Spam too).", "अभी पक्का नहीं हुआ। पहले ईमेल खोलकर लिंक पर टैप करें (Spam भी देखें)।", "ଏପର୍ଯ୍ୟନ୍ତ ନିଶ୍ଚିତ ହୋଇନାହିଁ। ପ୍ରଥମେ ଇମେଲ୍ ଖୋଲି ଲିଙ୍କରେ ଟ୍ୟାପ୍ କରନ୍ତୁ (Spam ମଧ୍ୟ ଦେଖନ୍ତୁ)।"],
    ["Email verified! Now log in.", "ईमेल पक्का हो गया! अब लॉग इन करें।", "ଇମେଲ୍ ନିଶ୍ଚିତ ହେଲା! ଏବେ ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"], ["Your email is verified.", "आपका ईमेल पक्का हो गया।", "ଆପଣଙ୍କ ଇମେଲ୍ ନିଶ୍ଚିତ ହେଲା।"],
    ["One last step", "बस एक कदम और", "ଆଉ ଗୋଟିଏ ପଦକ୍ଷେପ"], ["First time on this phone. Add your details once.", "इस फ़ोन पर पहली बार। एक बार अपनी जानकारी भरें।", "ଏହି ଫୋନରେ ପ୍ରଥମ ଥର। ଥରେ ଆପଣଙ୍କ ତଥ୍ୟ ଦିଅନ୍ତୁ।"],
    ["Continue", "आगे बढ़ें", "ଆଗକୁ ଯାଆନ୍ତୁ"],
    // login
    ["Welcome back", "फिर से स्वागत है", "ପୁଣି ସ୍ୱାଗତ"], ["Log in with your mobile number or email.", "अपने मोबाइल नंबर या ईमेल से लॉग इन करें।", "ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲ୍ ଦ୍ୱାରା ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    ["Saved on this phone", "इस फ़ोन में सेव", "ଏହି ଫୋନରେ ସେଭ୍"], ["or", "या", "କିମ୍ବା"], ["Mobile number or email", "मोबाइल नंबर या ईमेल", "ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲ୍"],
    ["Keep me logged in", "मुझे लॉग इन रखें", "ମୋତେ ଲଗ୍ ଇନ୍ ରଖନ୍ତୁ"], ["Save password on this phone", "इस फ़ोन में पासवर्ड सेव करें", "ଏହି ଫୋନରେ ପାସୱାର୍ଡ ସେଭ୍ କରନ୍ତୁ"],
    ["Forgot password?", "पासवर्ड भूल गए?", "ପାସୱାର୍ଡ ଭୁଲିଗଲେ?"], ["New here?", "नए हैं?", "ନୂଆ କି?"], ["Create an account", "खाता बनाएँ", "ଖାତା ଖୋଲନ୍ତୁ"], ["Settings", "सेटिंग्स", "ସେଟିଂସ୍"],
    ["Logging in…", "लॉग इन हो रहा है…", "ଲଗ୍ ଇନ୍ ହେଉଛି…"], ["The saved password could not be read. Please type it once.", "सेव पासवर्ड पढ़ा नहीं जा सका। कृपया एक बार लिखें।", "ସେଭ୍ ପାସୱାର୍ଡ ପଢ଼ିହେଲା ନାହିଁ। ଦୟାକରି ଥରେ ଲେଖନ୍ତୁ।"],
    ["Please enter your mobile number or email.", "कृपया मोबाइल नंबर या ईमेल लिखें।", "ଦୟାକରି ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲ୍ ଲେଖନ୍ତୁ।"],
    ["Wrong email/mobile or password. Tap the eye to check what you typed, or use \"Forgot password\".", "ईमेल/मोबाइल या पासवर्ड गलत है। आँख वाले बटन से देखें कि क्या लिखा, या \"पासवर्ड भूल गए\" दबाएँ।", "ଇମେଲ୍/ମୋବାଇଲ୍ କିମ୍ବା ପାସୱାର୍ଡ ଭୁଲ୍। ଆଖି ବଟନ୍ ଦବାଇ ଦେଖନ୍ତୁ, କିମ୍ବା \"ପାସୱାର୍ଡ ଭୁଲିଗଲେ\" ଦବାନ୍ତୁ।"],
    ["Wrong mobile number or password. Tap the eye to check what you typed, or use \"Forgot password\".", "मोबाइल नंबर या पासवर्ड गलत है। आँख वाले बटन से देखें कि क्या लिखा, या \"पासवर्ड भूल गए\" दबाएँ।", "ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ପାସୱାର୍ଡ ଭୁଲ୍। ଆଖି ବଟନ୍ ଦବାଇ ଦେଖନ୍ତୁ, କିମ୍ବା \"ପାସୱାର୍ଡ ଭୁଲିଗଲେ\" ଦବାନ୍ତୁ।"],
    ["Incorrect password. Check Caps Lock, or tap the eye to see what you typed. Forgot it? Use \"Forgot password\".", "पासवर्ड गलत है। आँख वाले बटन से देखें कि क्या लिखा। भूल गए? \"पासवर्ड भूल गए\" दबाएँ।", "ପାସୱାର୍ଡ ଭୁଲ୍। ଆଖି ବଟନ୍ ଦବାଇ ଦେଖନ୍ତୁ। ଭୁଲିଗଲେ? \"ପାସୱାର୍ଡ ଭୁଲିଗଲେ\" ଦବାନ୍ତୁ।"],
    ["No account with this mobile number or email on this phone. Please create an account first.", "इस फ़ोन में इस मोबाइल नंबर या ईमेल का कोई खाता नहीं है। पहले खाता बनाएँ।", "ଏହି ଫୋନରେ ଏହି ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲର କୌଣସି ଖାତା ନାହିଁ। ପ୍ରଥମେ ଖାତା ଖୋଲନ୍ତୁ।"],
    ["No account with this mobile number on this phone. Please create an account first.", "इस फ़ोन में इस मोबाइल नंबर का कोई खाता नहीं है। पहले खाता बनाएँ।", "ଏହି ଫୋନରେ ଏହି ମୋବାଇଲ୍ ନମ୍ବରର କୌଣସି ଖାତା ନାହିଁ। ପ୍ରଥମେ ଖାତା ଖୋଲନ୍ତୁ।"],
    ["You are offline. The first log in on this phone needs internet.", "आप ऑफ़लाइन हैं। इस फ़ोन पर पहली बार लॉग इन के लिए इंटरनेट चाहिए।", "ଆପଣ ଅଫଲାଇନ୍ ଅଛନ୍ତି। ଏହି ଫୋନରେ ପ୍ରଥମ ଥର ଲଗ୍ ଇନ୍ ପାଇଁ ଇଣ୍ଟରନେଟ୍ ଦରକାର।"],
    ["Too many attempts. Please wait a few minutes and try again.", "बहुत ज़्यादा कोशिशें हुईं। कुछ मिनट रुककर फिर कोशिश करें।", "ବହୁତ ଥର ଚେଷ୍ଟା ହେଲା। କିଛି ମିନିଟ୍ ଅପେକ୍ଷା କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।"],
    ["No internet connection. Firebase needs internet.", "इंटरनेट नहीं है। Firebase के लिए इंटरनेट चाहिए।", "ଇଣ୍ଟରନେଟ୍ ନାହିଁ। Firebase ପାଇଁ ଇଣ୍ଟରନେଟ୍ ଦରକାର।"],
    ["Your sign-in expired. Please log in again.", "आपका लॉग इन खत्म हो गया। कृपया फिर से लॉग इन करें।", "ଆପଣଙ୍କ ଲଗ୍ ଇନ୍ ସମୟ ସରିଲା। ଦୟାକରି ପୁଣି ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    // forgot / reset
    ["Reset password", "पासवर्ड बदलें", "ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ"], ["Type the mobile number or email you registered with.", "वह मोबाइल नंबर या ईमेल लिखें जिससे खाता बनाया था।", "ଯେଉଁ ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲରେ ଖାତା ଖୋଲିଥିଲେ ତାହା ଲେଖନ୍ତୁ।"],
    ["Back to log in", "लॉग इन पर वापस", "ଲଗ୍ ଇନ୍ କୁ ଫେରନ୍ତୁ"], ["Sending…", "भेजा जा रहा है…", "ପଠାଯାଉଛି…"],
    ["If {email} has an account, a reset link is on its way. Open it, choose a new password, then log in here.", "अगर {email} का खाता है, तो पासवर्ड बदलने का लिंक भेजा गया है। उसे खोलें, नया पासवर्ड चुनें, फिर यहाँ लॉग इन करें।", "{email} ର ଖାତା ଥିଲେ, ପାସୱାର୍ଡ ବଦଳାଇବା ଲିଙ୍କ୍ ପଠାଗଲା। ଏହାକୁ ଖୋଲି ନୂଆ ପାସୱାର୍ଡ ବାଛନ୍ତୁ, ତାପରେ ଏଠାରେ ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    ["This mobile number is not on this phone. Without SMS (not free), a mobile-only account can reset its password only on the phone where it was used. Log in there, or create a new account.",
      "यह मोबाइल नंबर इस फ़ोन में नहीं है। SMS (मुफ़्त नहीं) के बिना, केवल-मोबाइल खाते का पासवर्ड उसी फ़ोन पर बदला जा सकता है जहाँ उसका उपयोग हुआ था। वहाँ लॉग इन करें या नया खाता बनाएँ।",
      "ଏହି ମୋବାଇଲ୍ ନମ୍ବର ଏହି ଫୋନରେ ନାହିଁ। SMS (ମାଗଣା ନୁହେଁ) ବିନା, କେବଳ-ମୋବାଇଲ୍ ଖାତାର ପାସୱାର୍ଡ ସେହି ଫୋନରେ ହିଁ ବଦଳାଯାଇପାରିବ ଯେଉଁଠି ତାହା ବ୍ୟବହାର ହୋଇଥିଲା। ସେଠାରେ ଲଗ୍ ଇନ୍ କରନ୍ତୁ କିମ୍ବା ନୂଆ ଖାତା ଖୋଲନ୍ତୁ।"],
    ["No account with this mobile number or email on this phone.", "इस फ़ोन में इस मोबाइल नंबर या ईमेल का कोई खाता नहीं है।", "ଏହି ଫୋନରେ ଏହି ମୋବାଇଲ୍ ନମ୍ବର କିମ୍ବା ଇମେଲର କୌଣସି ଖାତା ନାହିଁ।"],
    ["Choose a new password", "नया पासवर्ड चुनें", "ନୂଆ ପାସୱାର୍ଡ ବାଛନ୍ତୁ"], ["For your safety, confirm your date of birth.", "आपकी सुरक्षा के लिए अपनी जन्म तिथि बताएँ।", "ଆପଣଙ୍କ ସୁରକ୍ଷା ପାଇଁ ଜନ୍ମ ତାରିଖ ନିଶ୍ଚିତ କରନ୍ତୁ।"],
    ["New password", "नया पासवर्ड", "ନୂଆ ପାସୱାର୍ଡ"], ["Confirm new password", "नया पासवर्ड दोबारा लिखें", "ନୂଆ ପାସୱାର୍ଡ ପୁଣି ଲେଖନ୍ତୁ"], ["Update password", "पासवर्ड बदलें", "ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ"],
    ["This account has no date of birth saved, so it cannot be reset on the phone. Please create a new account.", "इस खाते में जन्म तिथि सेव नहीं है, इसलिए फ़ोन पर पासवर्ड नहीं बदला जा सकता। कृपया नया खाता बनाएँ।", "ଏହି ଖାତାରେ ଜନ୍ମ ତାରିଖ ସେଭ୍ ନାହିଁ, ତେଣୁ ଫୋନରେ ପାସୱାର୍ଡ ବଦଳାଯାଇପାରିବ ନାହିଁ। ଦୟାକରି ନୂଆ ଖାତା ଖୋଲନ୍ତୁ।"],
    ["The date of birth does not match.", "जन्म तिथि मेल नहीं खाती।", "ଜନ୍ମ ତାରିଖ ମେଳ ଖାଉନାହିଁ।"], ["Please connect to the internet to change the password.", "पासवर्ड बदलने के लिए इंटरनेट चालू करें।", "ପାସୱାର୍ଡ ବଦଳାଇବାକୁ ଇଣ୍ଟରନେଟ୍ ଚାଲୁ କରନ୍ତୁ।"],
    ["Saving…", "सेव हो रहा है…", "ସେଭ୍ ହେଉଛି…"], ["Password updated. Please log in.", "पासवर्ड बदल गया। कृपया लॉग इन करें।", "ପାସୱାର୍ଡ ବଦଳିଗଲା। ଦୟାକରି ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"],
    // patient picker / home
    ["Who is this for?", "यह किसके लिए है?", "ଏହା କାହା ପାଇଁ?"], ["Add family member", "परिवार का सदस्य जोड़ें", "ପରିବାର ସଦସ୍ୟ ଯୋଡ଼ନ୍ତୁ"], ["Close", "बंद करें", "ବନ୍ଦ କରନ୍ତୁ"],
    ["Self", "स्वयं", "ନିଜେ"], ["Mother", "माँ", "ମା"], ["Father", "पिता", "ବାପା"], ["Spouse", "पति/पत्नी", "ସ୍ୱାମୀ/ସ୍ତ୍ରୀ"], ["Son", "बेटा", "ପୁଅ"], ["Daughter", "बेटी", "ଝିଅ"],
    ["Brother", "भाई", "ଭାଇ"], ["Sister", "बहन", "ଭଉଣୀ"], ["Grandparent", "दादा/दादी/नाना/नानी", "ଜେଜେ/ଅଜା/ଆଈ"],
    ["Good morning", "सुप्रभात", "ସୁପ୍ରଭାତ"], ["Good afternoon", "नमस्कार", "ନମସ୍କାର"], ["Good evening", "शुभ संध्या", "ଶୁଭ ସନ୍ଧ୍ୟା"],
    ["Hello, {name}", "नमस्ते, {name}", "ନମସ୍କାର, {name}"], ["Asking for", "किसके लिए पूछ रहे हैं", "କାହା ପାଇଁ ପଚାରୁଛନ୍ତି"],
    ["Ask about symptoms, diseases, treatment…", "लक्षण, बीमारी, इलाज के बारे में पूछें…", "ଲକ୍ଷଣ, ରୋଗ, ଚିକିତ୍ସା ବିଷୟରେ ପଚାରନ୍ତୁ…"],
    ["Emergency? Call an ambulance", "आपातकाल? एम्बुलेंस बुलाएँ", "ଜରୁରୀ? ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ"], ["Free, 24x7 across India", "मुफ़्त, पूरे भारत में 24x7", "ମାଗଣା, ସାରା ଭାରତରେ 24x7"],
    ["Ask Medibot", "मेडिबॉट से पूछें", "ମେଡିବଟ୍ କୁ ପଚାରନ୍ତୁ"], ["Type or speak your question", "अपना सवाल लिखें या बोलें", "ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ କିମ୍ବା କୁହନ୍ତୁ"],
    ["Symptom checker", "लक्षण जाँच", "ଲକ୍ଷଣ ଯାଞ୍ଚ"], ["Find matching conditions", "मिलती-जुलती बीमारियाँ देखें", "ମେଳ ଖାଉଥିବା ରୋଗ ଖୋଜନ୍ତୁ"],
    ["Disease library", "बीमारियों की लाइब्रेरी", "ରୋଗ ଲାଇବ୍ରେରୀ"], ["203 diseases", "203 बीमारियाँ", "203 ରୋଗ"], ["First aid", "प्राथमिक उपचार", "ପ୍ରାଥମିକ ଚିକିତ୍ସା"],
    ["Step-by-step guides", "कदम-दर-कदम गाइड", "ପଦକ୍ଷେପ ଅନୁସାରେ ଗାଇଡ୍"], ["BMI check", "BMI जाँच", "BMI ଯାଞ୍ଚ"], ["Weight and height", "वज़न और लंबाई", "ଓଜନ ଓ ଉଚ୍ଚତା"],
    ["Chat history", "चैट इतिहास", "ଚାଟ୍ ଇତିହାସ"], ["Your past questions", "आपके पिछले सवाल", "ଆପଣଙ୍କ ପୂର୍ବ ପ୍ରଶ୍ନ"],
    ["Health tip of the day", "आज की सेहत सलाह", "ଆଜିର ସ୍ୱାସ୍ଥ୍ୟ ପରାମର୍ଶ"], ["Prevention", "बचाव", "ପ୍ରତିରୋଧ"], ["Read more", "और पढ़ें", "ଅଧିକ ପଢ଼ନ୍ତୁ"], ["Recent questions", "हाल के सवाल", "ସାମ୍ପ୍ରତିକ ପ୍ରଶ୍ନ"],
    // chat
    ["Namaste {name} 🙏", "नमस्ते {name} 🙏", "ନମସ୍କାର {name} 🙏"],
    ["Welcome to Medibot, your very own health assistant. How may I help you today?", "मेडिबॉट में आपका स्वागत है, आपका अपना स्वास्थ्य सहायक। आज मैं आपकी क्या मदद करूँ?", "ମେଡିବଟ୍ ରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ, ଆପଣଙ୍କ ନିଜର ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?"],
    ["You are asking for {name}. Their chats are kept separately.", "आप {name} के लिए पूछ रहे हैं। उनकी चैट अलग रखी जाती हैं।", "ଆପଣ {name} ପାଇଁ ପଚାରୁଛନ୍ତି। ତାଙ୍କ ଚାଟ୍ ଅଲଗା ରଖାଯାଏ।"],
    ["You can write in English, हिंदी or ଓଡ଼ିଆ.", "आप English, हिंदी या ଓଡ଼ିଆ में लिख सकते हैं।", "ଆପଣ English, हिंदी କିମ୍ବା ଓଡ଼ିଆରେ ଲେଖିପାରିବେ।"],
    ["You matter. Help is available.", "आप महत्वपूर्ण हैं। मदद उपलब्ध है।", "ଆପଣ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ। ସାହାଯ୍ୟ ମିଳିପାରିବ।"], ["Possible emergency", "संभावित आपातकाल", "ସମ୍ଭାବ୍ୟ ଜରୁରୀ ସ୍ଥିତି"],
    ["If you are thinking about harming yourself, please talk to someone right now. Call Tele-MANAS 14416 (free, 24x7) or 112. You are not alone.",
      "अगर आप खुद को नुकसान पहुँचाने की सोच रहे हैं, तो अभी किसी से बात करें। Tele-MANAS 14416 (मुफ़्त, 24x7) या 112 पर कॉल करें। आप अकेले नहीं हैं।",
      "ଯଦି ଆପଣ ନିଜକୁ କ୍ଷତି କରିବା କଥା ଭାବୁଛନ୍ତି, ଦୟାକରି ଏବେ କାହା ସହ କଥା ହୁଅନ୍ତୁ। Tele-MANAS 14416 (ମାଗଣା, 24x7) କିମ୍ବା 112 କୁ କଲ୍ କରନ୍ତୁ। ଆପଣ ଏକା ନୁହଁନ୍ତି।"],
    ["This sounds like it could be a medical emergency. Call 108 for an ambulance now, or go to the nearest hospital.",
      "यह आपातकालीन स्थिति हो सकती है। अभी 108 पर एम्बुलेंस बुलाएँ या नज़दीकी अस्पताल जाएँ।",
      "ଏହା ଜରୁରୀ ସ୍ଥିତି ହୋଇପାରେ। ଏବେ 108 କୁ କଲ୍ କରି ଆମ୍ବୁଲାନ୍ସ ଡାକନ୍ତୁ, କିମ୍ବା ନିକଟତମ ଡାକ୍ତରଖାନାକୁ ଯାଆନ୍ତୁ।"],
    ["Call 108 Ambulance", "108 एम्बुलेंस को कॉल करें", "108 ଆମ୍ବୁଲାନ୍ସକୁ କଲ୍ କରନ୍ତୁ"], ["Ambulance", "एम्बुलेंस", "ଆମ୍ବୁଲାନ୍ସ"],
    ["Sources ({n})", "स्रोत ({n})", "ଉତ୍ସ ({n})"], ["Page {n}", "पृष्ठ {n}", "ପୃଷ୍ଠା {n}"], ["Copy", "कॉपी", "କପି"], ["Listen", "सुनें", "ଶୁଣନ୍ତୁ"], ["Copied", "कॉपी हो गया", "କପି ହେଲା"], ["Copy failed", "कॉपी नहीं हुआ", "କପି ହେଲା ନାହିଁ"],
    ["History", "इतिहास", "ଇତିହାସ"], ["New chat", "नई चैट", "ନୂଆ ଚାଟ୍"], ["Type your health question…", "अपना स्वास्थ्य सवाल लिखें…", "ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ…"],
    ["Speak", "बोलें", "କୁହନ୍ତୁ"], ["Send", "भेजें", "ପଠାନ୍ତୁ"], ["Looking it up…", "जानकारी खोज रहे हैं…", "ତଥ୍ୟ ଖୋଜୁଛି…"], ["Sorry", "माफ़ कीजिए", "କ୍ଷମା କରିବେ"], ["Something went wrong:", "कुछ गड़बड़ हुई:", "କିଛି ଭୁଲ୍ ହେଲା:"],
    ["Offline · on-device encyclopedia", "ऑफ़लाइन · फ़ोन का विश्वकोश", "ଅଫଲାଇନ୍ · ଫୋନର ବିଶ୍ୱକୋଷ"],
    ["Voice typing is not available here.", "यहाँ बोलकर लिखना उपलब्ध नहीं है।", "ଏଠାରେ କହି ଲେଖିବା ଉପଲବ୍ଧ ନାହିଁ।"], ["Could not hear you. Please try again.", "आवाज़ सुनाई नहीं दी। फिर कोशिश करें।", "ସ୍ୱର ଶୁଣାଗଲା ନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।"],
    // answers (offline headings)
    ["Common symptoms", "आम लक्षण", "ସାଧାରଣ ଲକ୍ଷଣ"], ["Causes", "कारण", "କାରଣ"], ["Standard treatment", "सामान्य इलाज", "ସାଧାରଣ ଚିକିତ୍ସା"],
    ["Remedies / alternative treatment", "घरेलू / वैकल्पिक उपचार", "ଘରୋଇ / ବିକଳ୍ପ ଚିକିତ୍ସା"], ["Diagnosis", "जाँच", "ରୋଗ ନିର୍ଣ୍ଣୟ"], ["Outlook", "आगे क्या होगा", "ଭବିଷ୍ୟତ ଅବସ୍ଥା"],
    ["Symptoms", "लक्षण", "ଲକ୍ଷଣ"], ["Treatment", "इलाज", "ଚିକିତ୍ସା"], ["From the encyclopedia", "विश्वकोश से", "ବିଶ୍ୱକୋଷରୁ"], ["Not found", "नहीं मिला", "ମିଳିଲା ନାହିଁ"],
    ["I could not find this in the encyclopedia on this device (it covers diseases from C to F). Try other words, or browse the Disease Library.",
      "यह जानकारी इस फ़ोन के विश्वकोश में नहीं मिली (इसमें C से F तक की बीमारियाँ हैं)। दूसरे शब्दों में पूछें या बीमारियों की लाइब्रेरी देखें।",
      "ଏହି ତଥ୍ୟ ଏହି ଫୋନର ବିଶ୍ୱକୋଷରେ ମିଳିଲା ନାହିଁ (ଏଥିରେ C ରୁ F ପର୍ଯ୍ୟନ୍ତ ରୋଗ ଅଛି)। ଅନ୍ୟ ଶବ୍ଦରେ ପଚାରନ୍ତୁ କିମ୍ବା ରୋଗ ଲାଇବ୍ରେରୀ ଦେଖନ୍ତୁ।"],
    ["Without internet, the details are shown in English from the encyclopedia. Turn on internet for a full answer in your language.",
      "इंटरनेट के बिना, विवरण विश्वकोश से अंग्रेज़ी में दिखाए जाते हैं। पूरा उत्तर हिंदी में पाने के लिए इंटरनेट चालू करें।",
      "ଇଣ୍ଟରନେଟ୍ ବିନା, ବିଶ୍ୱକୋଷରୁ ବିବରଣୀ ଇଂରାଜୀରେ ଦେଖାଯାଏ। ଓଡ଼ିଆରେ ପୂରା ଉତ୍ତର ପାଇଁ ଇଣ୍ଟରନେଟ୍ ଚାଲୁ କରନ୍ତୁ।"],
    // history
    ["Kept only on this phone. Each family member has their own history.", "सिर्फ़ इसी फ़ोन में रखा जाता है। परिवार के हर सदस्य का अपना इतिहास है।", "କେବଳ ଏହି ଫୋନରେ ରଖାଯାଏ। ପରିବାରର ପ୍ରତ୍ୟେକ ସଦସ୍ୟଙ୍କର ନିଜସ୍ୱ ଇତିହାସ ଅଛି।"],
    ["Today", "आज", "ଆଜି"], ["Yesterday", "कल", "ଗତକାଲି"], ["Earlier this week", "इस हफ़्ते पहले", "ଏହି ସପ୍ତାହର ପୂର୍ବରୁ"], ["This month", "इस महीने", "ଏହି ମାସ"], ["Older", "पुराने", "ପୁରୁଣା"],
    ["{n} question", "{n} सवाल", "{n} ପ୍ରଶ୍ନ"], ["{n} questions", "{n} सवाल", "{n} ପ୍ରଶ୍ନ"], ["Delete", "मिटाएँ", "ଲିଭାନ୍ତୁ"], ["No chats yet.", "अभी कोई चैट नहीं।", "ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଚାଟ୍ ନାହିଁ।"],
    ["Ask a question", "सवाल पूछें", "ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ"], ["Clear history", "इतिहास मिटाएँ", "ଇତିହାସ ଲିଭାନ୍ତୁ"], ["Only for {name}. This cannot be undone.", "सिर्फ़ {name} के लिए। यह वापस नहीं होगा।", "କେବଳ {name} ପାଇଁ। ଏହା ଫେରାଯାଇପାରିବ ନାହିଁ।"],
    ["Clear today's chats", "आज की चैट मिटाएँ", "ଆଜିର ଚାଟ୍ ଲିଭାନ୍ତୁ"], ["Clear last month's chats", "पिछले महीने की चैट मिटाएँ", "ଗତ ମାସର ଚାଟ୍ ଲିଭାନ୍ତୁ"], ["Clear all chats", "सारी चैट मिटाएँ", "ସବୁ ଚାଟ୍ ଲିଭାନ୍ତୁ"],
    ["Delete this chat?", "यह चैट मिटाएँ?", "ଏହି ଚାଟ୍ ଲିଭାଇବେ?"], ["Clear", "मिटाएँ", "ଲିଭାନ୍ତୁ"], ["Done.", "हो गया।", "ହୋଇଗଲା।"],
    // library / disease
    ["{n} diseases with symptoms, standard treatment, remedies and prevention. Works offline.", "{n} बीमारियाँ: लक्षण, इलाज, घरेलू उपाय और बचाव। बिना इंटरनेट के चलता है।", "{n} ରୋଗ: ଲକ୍ଷଣ, ଚିକିତ୍ସା, ଘରୋଇ ଉପାୟ ଓ ପ୍ରତିରୋଧ। ଇଣ୍ଟରନେଟ୍ ବିନା ଚାଲେ।"],
    ["Search disease or symptom", "बीमारी या लक्षण खोजें", "ରୋଗ କିମ୍ବା ଲକ୍ଷଣ ଖୋଜନ୍ତୁ"], ["Search", "खोजें", "ଖୋଜନ୍ତୁ"], ["All", "सभी", "ସବୁ"],
    ["{n} result(s) for “{q}”", "“{q}” के लिए {n} परिणाम", "“{q}” ପାଇଁ {n} ଫଳାଫଳ"], ["No diseases found.", "कोई बीमारी नहीं मिली।", "କୌଣସି ରୋଗ ମିଳିଲା ନାହିଁ।"],
    ["Not found.", "नहीं मिला।", "ମିଳିଲା ନାହିଁ।"], ["Back to the library", "लाइब्रेरी पर वापस", "ଲାଇବ୍ରେରୀକୁ ଫେରନ୍ତୁ"], ["Read full text", "पूरा पढ़ें", "ପୂରା ପଢ଼ନ୍ତୁ"],
    ["Disease details are in English, as written in the encyclopedia.", "बीमारी का विवरण अंग्रेज़ी में है, जैसा विश्वकोश में लिखा है।", "ରୋଗର ବିବରଣୀ ଇଂରାଜୀରେ ଅଛି, ଯେପରି ବିଶ୍ୱକୋଷରେ ଲେଖାଅଛି।"],
    ["Standard treatment (cure)", "सामान्य इलाज (उपचार)", "ସାଧାରଣ ଚିକିତ୍ସା (ଉପଚାର)"], ["Remedies and alternative treatment", "घरेलू उपाय और वैकल्पिक उपचार", "ଘରୋଇ ଉପାୟ ଓ ବିକଳ୍ପ ଚିକିତ୍ସା"],
    ["Causes and symptoms", "कारण और लक्षण", "କାରଣ ଓ ଲକ୍ଷଣ"], ["Outlook (prognosis)", "आगे क्या होगा", "ଭବିଷ୍ୟତ ଅବସ୍ଥା"],
    ["Source: The Gale Encyclopedia of Medicine, PDF page {n}. Information may be dated; consult a doctor.", "स्रोत: The Gale Encyclopedia of Medicine, PDF पृष्ठ {n}। जानकारी पुरानी हो सकती है; डॉक्टर से सलाह लें।", "ଉତ୍ସ: The Gale Encyclopedia of Medicine, PDF ପୃଷ୍ଠା {n}। ତଥ୍ୟ ପୁରୁଣା ହୋଇପାରେ; ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।"],
    ["Tell me about {name}", "{name} के बारे में बताइए", "{name} ବିଷୟରେ କୁହନ୍ତୁ"], ["Saved", "सेव है", "ସେଭ୍ ହୋଇଛି"], ["Save", "सेव करें", "ସେଭ୍ କରନ୍ତୁ"],
    ["Saved diseases", "सेव की गई बीमारियाँ", "ସେଭ୍ ହୋଇଥିବା ରୋଗ"], ["Nothing saved yet.", "अभी कुछ सेव नहीं है।", "ଏପର୍ଯ୍ୟନ୍ତ କିଛି ସେଭ୍ ହୋଇନାହିଁ।"],
    ["Tap “Save” on any disease to keep it here.", "किसी भी बीमारी पर “सेव करें” दबाएँ, वह यहाँ दिखेगी।", "ଯେକୌଣସି ରୋଗରେ “ସେଭ୍ କରନ୍ତୁ” ଦବାନ୍ତୁ, ତାହା ଏଠାରେ ରହିବ।"], ["Browse the library", "लाइब्रेरी देखें", "ଲାଇବ୍ରେରୀ ଦେଖନ୍ତୁ"],
    // symptom checker
    ["Tap your symptoms or type them, separated by commas.", "अपने लक्षण चुनें या कॉमा लगाकर लिखें।", "ଆପଣଙ୍କ ଲକ୍ଷଣ ବାଛନ୍ତୁ କିମ୍ବା କମା ଦେଇ ଲେଖନ୍ତୁ।"], ["e.g. fever, headache, rash", "जैसे बुखार, सिरदर्द, दाने", "ଯେପରି ଜ୍ୱର, ମୁଣ୍ଡବିନ୍ଧା, ଚର୍ମରେ ଫୋଟକା"],
    ["Check", "जाँचें", "ଯାଞ୍ଚ କରନ୍ତୁ"], ["For learning only, it cannot diagnose you. If you feel unwell, see a doctor. In an emergency call 108.", "केवल जानकारी के लिए, यह बीमारी तय नहीं कर सकता। तबीयत ठीक न हो तो डॉक्टर को दिखाएँ। आपातकाल में 108 पर कॉल करें।", "କେବଳ ଶିକ୍ଷା ପାଇଁ, ଏହା ରୋଗ ନିର୍ଣ୍ଣୟ କରିପାରିବ ନାହିଁ। ଅସୁସ୍ଥ ଲାଗିଲେ ଡାକ୍ତର ଦେଖାନ୍ତୁ। ଜରୁରୀ ସ୍ଥିତିରେ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    ["{a} of {b} match", "{b} में से {a} मेल", "{b} ରୁ {a} ମେଳ"], ["Matches:", "मेल:", "ମେଳ:"], ["No matching conditions found. Try simpler words like “fever” or “cough”.", "कोई मिलती बीमारी नहीं मिली। “बुखार” या “खांसी” जैसे आसान शब्द आज़माएँ।", "କୌଣସି ମେଳ ଖାଉଥିବା ରୋଗ ମିଳିଲା ନାହିଁ। “ଜ୍ୱର” କିମ୍ବା “କାଶ” ପରି ସହଜ ଶବ୍ଦ ଚେଷ୍ଟା କରନ୍ତୁ।"],
    ["fever", "बुखार", "ଜ୍ୱର"], ["headache", "सिरदर्द", "ମୁଣ୍ଡବିନ୍ଧା"], ["cough", "खांसी", "କାଶ"], ["sore throat", "गले में खराश", "ଗଳା ଘା"], ["runny nose", "नाक बहना", "ନାକରୁ ପାଣି ବୋହିବା"],
    ["rash", "दाने", "ଚର୍ମରେ ଫୋଟକା"], ["itching", "खुजली", "କୁଣ୍ଡେଇ"], ["vomiting", "उल्टी", "ବାନ୍ତି"], ["nausea", "जी मिचलाना", "ବାନ୍ତି ଲାଗିବା"], ["diarrhea", "दस्त", "ଝାଡ଼ା"],
    ["abdominal pain", "पेट दर्द", "ପେଟ ବିନ୍ଧା"], ["fatigue", "थकान", "କ୍ଲାନ୍ତି"], ["dizziness", "चक्कर", "ମୁଣ୍ଡ ବୁଲାଇବା"], ["chest pain", "सीने में दर्द", "ଛାତି ଯନ୍ତ୍ରଣା"],
    ["shortness of breath", "सांस फूलना", "ନିଶ୍ୱାସ କଷ୍ଟ"], ["joint pain", "जोड़ों में दर्द", "ଗଣ୍ଠି ବିନ୍ଧା"], ["back pain", "कमर दर्द", "ପିଠି ବିନ୍ଧା"], ["swelling", "सूजन", "ଫୁଲା"],
    ["weight loss", "वज़न कम होना", "ଓଜନ କମିବା"], ["blurred vision", "धुंधला दिखना", "ଝାପସା ଦେଖାଯିବା"],
    // emergency
    ["Tap to call an ambulance", "एम्बुलेंस बुलाने के लिए दबाएँ", "ଆମ୍ବୁଲାନ୍ସ ଡାକିବାକୁ ଦବାନ୍ତୁ"], ["AMBULANCE", "एम्बुलेंस", "ଆମ୍ବୁଲାନ୍ସ"], ["Tell the operator", "ऑपरेटर को बताएँ", "ଅପରେଟରଙ୍କୁ କୁହନ୍ତୁ"],
    ["Show my GPS location", "मेरी GPS लोकेशन दिखाएँ", "ମୋର GPS ସ୍ଥାନ ଦେଖାନ୍ତୁ"], ["Need blood?", "खून चाहिए?", "ରକ୍ତ ଦରକାର?"],
    ["Your blood group is {g}. You can usually receive red cells from: {list}.", "आपका ब्लड ग्रुप {g} है। आप आम तौर पर इनसे खून ले सकते हैं: {list}।", "ଆପଣଙ୍କ ରକ୍ତ ଗ୍ରୁପ୍ {g}। ଆପଣ ସାଧାରଣତଃ ଏମାନଙ୍କ ଠାରୁ ରକ୍ତ ନେଇପାରିବେ: {list}।"],
    ["Family members with a matching blood group:", "मिलते ब्लड ग्रुप वाले परिवार के सदस्य:", "ମେଳ ଖାଉଥିବା ରକ୍ତ ଗ୍ରୁପ୍ ଥିବା ପରିବାର ସଦସ୍ୟ:"],
    ["Add your blood group in Profile so it is ready in an emergency.", "प्रोफ़ाइल में अपना ब्लड ग्रुप जोड़ें ताकि आपातकाल में काम आए।", "ପ୍ରୋଫାଇଲରେ ଆପଣଙ୍କ ରକ୍ତ ଗ୍ରୁପ୍ ଯୋଡ଼ନ୍ତୁ, ଜରୁରୀ ସମୟରେ କାମରେ ଆସିବ।"], ["Add now", "अभी जोड़ें", "ଏବେ ଯୋଡ଼ନ୍ତୁ"],
    ["The hospital always tests blood before giving it.", "अस्पताल खून चढ़ाने से पहले हमेशा जाँच करता है।", "ଡାକ୍ତରଖାନା ରକ୍ତ ଦେବା ପୂର୍ବରୁ ସବୁବେଳେ ଯାଞ୍ଚ କରେ।"],
    ["Find blood banks near me (needs internet)", "पास के ब्लड बैंक खोजें (इंटरनेट चाहिए)", "ନିକଟସ୍ଥ ବ୍ଲଡ୍ ବ୍ୟାଙ୍କ ଖୋଜନ୍ତୁ (ଇଣ୍ଟରନେଟ୍ ଦରକାର)"],
    ["Helplines", "हेल्पलाइन", "ହେଲ୍ପଲାଇନ୍"], ["Find nearby hospitals (needs internet)", "पास के अस्पताल खोजें (इंटरनेट चाहिए)", "ନିକଟସ୍ଥ ଡାକ୍ତରଖାନା ଖୋଜନ୍ତୁ (ଇଣ୍ଟରନେଟ୍ ଦରକାର)"],
    ["First aid guides", "प्राथमिक उपचार गाइड", "ପ୍ରାଥମିକ ଚିକିତ୍ସା ଗାଇଡ୍"],
    ["First-aid steps are general guidance. Always call 108 for serious situations and follow the operator's instructions.", "प्राथमिक उपचार के कदम सामान्य सलाह हैं। गंभीर स्थिति में हमेशा 108 पर कॉल करें और ऑपरेटर की बात मानें।", "ପ୍ରାଥମିକ ଚିକିତ୍ସା ପଦକ୍ଷେପ ସାଧାରଣ ପରାମର୍ଶ। ଗୁରୁତର ସ୍ଥିତିରେ ସବୁବେଳେ 108 କୁ କଲ୍ କରନ୍ତୁ ଓ ଅପରେଟରଙ୍କ କଥା ମାନନ୍ତୁ।"],
    ["Location is not available on this device.", "इस फ़ोन में लोकेशन उपलब्ध नहीं है।", "ଏହି ଫୋନରେ ସ୍ଥାନ ଉପଲବ୍ଧ ନାହିଁ।"], ["Finding your location…", "आपकी लोकेशन खोज रहे हैं…", "ଆପଣଙ୍କ ସ୍ଥାନ ଖୋଜୁଛି…"],
    ["Latitude {a}, Longitude {b} (±{m} m). Read this to the operator.", "अक्षांश {a}, देशांतर {b} (±{m} मी)। यह ऑपरेटर को पढ़कर सुनाएँ।", "ଅକ୍ଷାଂଶ {a}, ଦ୍ରାଘିମା {b} (±{m} ମି)। ଏହା ଅପରେଟରଙ୍କୁ ପଢ଼ି ଶୁଣାନ୍ତୁ।"],
    ["Open in Maps", "मैप में खोलें", "ମ୍ୟାପରେ ଖୋଲନ୍ତୁ"], ["Could not get location. Turn on GPS and allow location for Medibot.", "लोकेशन नहीं मिली। GPS चालू करें और मेडिबॉट को लोकेशन की अनुमति दें।", "ସ୍ଥାନ ମିଳିଲା ନାହିଁ। GPS ଚାଲୁ କରି ମେଡିବଟ୍ କୁ ସ୍ଥାନ ଅନୁମତି ଦିଅନ୍ତୁ।"],
    ["Ambulance (emergency medical)", "एम्बुलेंस (आपातकालीन चिकित्सा)", "ଆମ୍ବୁଲାନ୍ସ (ଜରୁରୀ ଚିକିତ୍ସା)"], ["Free, 24x7, all over India", "मुफ़्त, 24x7, पूरे भारत में", "ମାଗଣା, 24x7, ସାରା ଭାରତରେ"],
    ["National emergency number", "राष्ट्रीय आपातकालीन नंबर", "ଜାତୀୟ ଜରୁରୀକାଳୀନ ନମ୍ବର"], ["Police, fire and ambulance", "पुलिस, फ़ायर और एम्बुलेंस", "ପୋଲିସ୍, ଅଗ୍ନିଶମ ଓ ଆମ୍ବୁଲାନ୍ସ"],
    ["Mother and child ambulance", "माँ और बच्चे की एम्बुलेंस", "ମା ଓ ଶିଶୁ ଆମ୍ବୁଲାନ୍ସ"], ["Pregnancy and newborn transport", "गर्भावस्था और नवजात के लिए", "ଗର୍ଭାବସ୍ଥା ଓ ନବଜାତ ଶିଶୁ ପାଇଁ"],
    ["Tele-MANAS mental health", "टेली-मानस मानसिक स्वास्थ्य", "ଟେଲି-ମାନସ ମାନସିକ ସ୍ୱାସ୍ଥ୍ୟ"], ["Free counselling, 24x7", "मुफ़्त परामर्श, 24x7", "ମାଗଣା ପରାମର୍ଶ, 24x7"],
    ["Poison information (AIIMS)", "ज़हर की जानकारी (AIIMS)", "ବିଷ ସମ୍ବନ୍ଧୀୟ ତଥ୍ୟ (AIIMS)"], ["Advice on poisoning", "ज़हर से जुड़ी सलाह", "ବିଷ ସମ୍ବନ୍ଧୀୟ ପରାମର୍ଶ"],
    // first aid guides
    ["Not breathing / no pulse (CPR)", "सांस नहीं / नब्ज़ नहीं (CPR)", "ନିଶ୍ୱାସ ନାହିଁ / ନାଡ଼ି ନାହିଁ (CPR)"],
    ["Call 108 (or ask someone to call) and get an AED if available.", "108 पर कॉल करें (या किसी से करवाएँ) और AED मिले तो मँगवाएँ।", "108 କୁ କଲ୍ କରନ୍ତୁ (କିମ୍ବା କାହାକୁ କରିବାକୁ କୁହନ୍ତୁ) ଓ AED ମିଳିଲେ ଆଣନ୍ତୁ।"],
    ["Lay the person on their back on a firm surface.", "व्यक्ति को सख़्त जगह पर पीठ के बल लिटाएँ।", "ବ୍ୟକ୍ତିଙ୍କୁ ଟାଣ ଜାଗାରେ ଚିତ୍ କରି ଶୁଆନ୍ତୁ।"],
    ["Push hard and fast in the centre of the chest: 100-120 pushes a minute, about 5 cm deep.", "छाती के बीच में ज़ोर से और तेज़ी से दबाएँ: एक मिनट में 100-120 बार, लगभग 5 सेमी गहरा।", "ଛାତିର ମଝିରେ ଜୋରରେ ଓ ଶୀଘ୍ର ଚାପନ୍ତୁ: ମିନିଟ୍ ପ୍ରତି 100-120 ଥର, ପ୍ରାୟ 5 ସେମି ଗଭୀର।"],
    ["If trained, give 2 rescue breaths after every 30 pushes; if not, keep doing chest pushes only.", "अगर प्रशिक्षित हैं तो हर 30 बार दबाने के बाद 2 बार मुँह से सांस दें; नहीं तो सिर्फ़ छाती दबाते रहें।", "ପ୍ରଶିକ୍ଷିତ ଥିଲେ ପ୍ରତି 30 ଚାପ ପରେ 2 ଥର ମୁହଁରୁ ନିଶ୍ୱାସ ଦିଅନ୍ତୁ; ନ ହେଲେ କେବଳ ଛାତି ଚାପିବା ଜାରି ରଖନ୍ତୁ।"],
    ["Do not stop until help arrives or the person starts breathing.", "मदद आने या सांस शुरू होने तक न रुकें।", "ସାହାଯ୍ୟ ଆସିବା କିମ୍ବା ନିଶ୍ୱାସ ଆରମ୍ଭ ହେବା ପର୍ଯ୍ୟନ୍ତ ବନ୍ଦ କରନ୍ତୁ ନାହିଁ।"],
    ["Choking (adult)", "गले में कुछ फँसना (वयस्क)", "ଗଳାରେ କିଛି ଅଟକିବା (ବୟସ୍କ)"],
    ["Ask 'Are you choking?' If they can cough, encourage them to keep coughing.", "पूछें 'क्या गले में कुछ फँसा है?' अगर खांस पा रहे हैं तो खांसते रहने को कहें।", "ପଚାରନ୍ତୁ 'ଗଳାରେ କିଛି ଅଟକିଛି କି?' କାଶିପାରୁଥିଲେ କାଶିବା ଜାରି ରଖିବାକୁ କୁହନ୍ତୁ।"],
    ["If they cannot breathe or speak: give up to 5 firm back blows between the shoulder blades.", "अगर सांस नहीं ले पा रहे या बोल नहीं पा रहे: कंधों के बीच पीठ पर 5 बार ज़ोर से थपकी दें।", "ନିଶ୍ୱାସ ନେଇ କିମ୍ବା କଥା କହିପାରୁନଥିଲେ: କାନ୍ଧ ମଝିରେ ପିଠିରେ 5 ଥର ଜୋରରେ ଥାପୁଡ଼ା ଦିଅନ୍ତୁ।"],
    ["Then give up to 5 abdominal thrusts (stand behind, fist above the navel, pull in and up).", "फिर 5 बार पेट पर झटका दें (पीछे खड़े होकर, नाभि के ऊपर मुट्ठी रखकर अंदर और ऊपर खींचें)।", "ତାପରେ 5 ଥର ପେଟରେ ଚାପ ଦିଅନ୍ତୁ (ପଛରେ ଠିଆ ହୋଇ, ନାଭି ଉପରେ ମୁଠା ରଖି ଭିତରକୁ ଓ ଉପରକୁ ଟାଣନ୍ତୁ)।"],
    ["Repeat back blows and thrusts. If they become unconscious, call 108 and start CPR.", "थपकी और झटके दोहराएँ। बेहोश हो जाएँ तो 108 पर कॉल करें और CPR शुरू करें।", "ଥାପୁଡ଼ା ଓ ଚାପ ପୁଣି ଦିଅନ୍ତୁ। ବେହୋଶ ହେଲେ 108 କୁ କଲ୍ କରି CPR ଆରମ୍ଭ କରନ୍ତୁ।"],
    ["Heavy bleeding", "ज़्यादा खून बहना", "ଅଧିକ ରକ୍ତସ୍ରାବ"], ["Call 108 if bleeding is severe.", "खून ज़्यादा बह रहा हो तो 108 पर कॉल करें।", "ଅଧିକ ରକ୍ତ ବାହାରୁଥିଲେ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    ["Press firmly on the wound with a clean cloth and keep pressing.", "साफ़ कपड़े से घाव पर ज़ोर से दबाएँ और दबाए रखें।", "ସଫା କପଡ଼ାରେ କ୍ଷତ ଉପରେ ଜୋରରେ ଚାପି ଧରି ରଖନ୍ତୁ।"],
    ["If blood soaks through, add more cloth on top; do not remove the first one.", "खून कपड़े से बाहर आए तो ऊपर और कपड़ा रखें; पहला कपड़ा न हटाएँ।", "ରକ୍ତ କପଡ଼ା ଭିଜାଇଲେ ଉପରେ ଆଉ କପଡ଼ା ରଖନ୍ତୁ; ପ୍ରଥମଟି ହଟାନ୍ତୁ ନାହିଁ।"],
    ["Raise the injured part above heart level if possible. Keep the person warm and lying down.", "हो सके तो चोट वाले हिस्से को दिल से ऊपर रखें। व्यक्ति को गर्म रखें और लिटाए रखें।", "ସମ୍ଭବ ହେଲେ ଆଘାତ ସ୍ଥାନକୁ ହୃଦୟ ଠାରୁ ଉପରେ ରଖନ୍ତୁ। ବ୍ୟକ୍ତିଙ୍କୁ ଗରମ ରଖି ଶୁଆଇ ରଖନ୍ତୁ।"],
    ["Burns", "जलना", "ପୋଡ଼ା"], ["Cool the burn under cool running water for 20 minutes. Do not use ice, butter or toothpaste.", "जले हिस्से को 20 मिनट ठंडे बहते पानी में रखें। बर्फ़, मक्खन या टूथपेस्ट न लगाएँ।", "ପୋଡ଼ା ସ୍ଥାନକୁ 20 ମିନିଟ୍ ଥଣ୍ଡା ବହୁଥିବା ପାଣିରେ ରଖନ୍ତୁ। ବରଫ, ଲହୁଣୀ କିମ୍ବା ଟୁଥପେଷ୍ଟ ଲଗାନ୍ତୁ ନାହିଁ।"],
    ["Remove rings or tight items near the burn before it swells.", "सूजन से पहले जले हिस्से के पास की अंगूठी या कसी चीज़ें उतार दें।", "ଫୁଲିବା ପୂର୍ବରୁ ପୋଡ଼ା ପାଖରେ ଥିବା ମୁଦି କିମ୍ବା ଟାଣ ଜିନିଷ କାଢ଼ନ୍ତୁ।"],
    ["Cover loosely with clean cling film or a clean cloth.", "साफ़ प्लास्टिक फ़िल्म या साफ़ कपड़े से हल्के से ढकें।", "ସଫା ପ୍ଲାଷ୍ଟିକ୍ ଫିଲ୍ମ କିମ୍ବା ସଫା କପଡ଼ାରେ ହାଲୁକା ଭାବେ ଘୋଡ଼ାନ୍ତୁ।"],
    ["Call 108 for large, deep, facial or electrical burns, or burns in children.", "बड़े, गहरे, चेहरे के या बिजली से जलने पर, या बच्चों के जलने पर 108 पर कॉल करें।", "ବଡ଼, ଗଭୀର, ମୁହଁର କିମ୍ବା ବିଜୁଳି ପୋଡ଼ା, କିମ୍ବା ପିଲାଙ୍କ ପୋଡ଼ା ପାଇଁ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    ["Heat stroke", "लू लगना", "ଅଂଶୁଘାତ"], ["Move the person to a cool, shaded place and call 108 if they are confused or unconscious.", "व्यक्ति को ठंडी, छायादार जगह ले जाएँ; भ्रम या बेहोशी हो तो 108 पर कॉल करें।", "ବ୍ୟକ୍ତିଙ୍କୁ ଥଣ୍ଡା, ଛାଇ ଜାଗାକୁ ନିଅନ୍ତୁ; ଦ୍ୱନ୍ଦ୍ୱ କିମ୍ବା ବେହୋଶ ହେଲେ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    ["Remove extra clothing; cool them with water, wet cloths and fanning.", "ज़्यादा कपड़े उतारें; पानी, गीले कपड़े और पंखे से ठंडा करें।", "ଅଧିକ ପୋଷାକ କାଢ଼ନ୍ତୁ; ପାଣି, ଓଦା କପଡ଼ା ଓ ପଙ୍ଖାରେ ଥଣ୍ଡା କରନ୍ତୁ।"],
    ["If awake and able to swallow, give small sips of water.", "होश में हों और निगल सकें तो थोड़ा-थोड़ा पानी दें।", "ଚେତା ଥିଲେ ଓ ଗିଳିପାରୁଥିଲେ ଅଳ୍ପ ଅଳ୍ପ ପାଣି ଦିଅନ୍ତୁ।"],
    ["Do not give medicines for fever.", "बुखार की दवा न दें।", "ଜ୍ୱର ଔଷଧ ଦିଅନ୍ତୁ ନାହିଁ।"],
    ["Snake bite", "सांप का काटना", "ସାପ କାମୁଡ଼ା"], ["Keep the person calm and still; call 108 and go to the nearest hospital quickly.", "व्यक्ति को शांत और स्थिर रखें; 108 पर कॉल करें और जल्दी नज़दीकी अस्पताल जाएँ।", "ବ୍ୟକ୍ତିଙ୍କୁ ଶାନ୍ତ ଓ ସ୍ଥିର ରଖନ୍ତୁ; 108 କୁ କଲ୍ କରି ଶୀଘ୍ର ନିକଟ ଡାକ୍ତରଖାନାକୁ ଯାଆନ୍ତୁ।"],
    ["Keep the bitten limb still and at heart level; remove rings and tight clothing.", "काटे हुए हाथ-पैर को स्थिर और दिल की ऊँचाई पर रखें; अंगूठी और कसे कपड़े उतारें।", "କାମୁଡ଼ା ଅଙ୍ଗକୁ ସ୍ଥିର ଓ ହୃଦୟ ଉଚ୍ଚତାରେ ରଖନ୍ତୁ; ମୁଦି ଓ ଟାଣ ପୋଷାକ କାଢ଼ନ୍ତୁ।"],
    ["Do NOT cut, suck the wound, apply ice or tie a tight tourniquet.", "घाव को न काटें, न चूसें, बर्फ़ न लगाएँ और कसकर पट्टी न बाँधें।", "କ୍ଷତ କାଟନ୍ତୁ ନାହିଁ, ଚୋଷନ୍ତୁ ନାହିଁ, ବରଫ ଲଗାନ୍ତୁ ନାହିଁ କି ଟାଣି ବାନ୍ଧନ୍ତୁ ନାହିଁ।"],
    ["Note the time of the bite; anti-venom is given only at a hospital.", "काटने का समय याद रखें; ज़हर की दवा (एंटी-वेनम) सिर्फ़ अस्पताल में मिलती है।", "କାମୁଡ଼ିବା ସମୟ ମନେ ରଖନ୍ତୁ; ବିଷ ପ୍ରତିଷେଧକ କେବଳ ଡାକ୍ତରଖାନାରେ ମିଳେ।"],
    ["Fainting", "बेहोश होना", "ବେହୋଶ ହେବା"], ["Lay the person flat and raise their legs about 30 cm.", "व्यक्ति को सीधा लिटाएँ और पैर लगभग 30 सेमी ऊपर उठाएँ।", "ବ୍ୟକ୍ତିଙ୍କୁ ସିଧା ଶୁଆଇ ଗୋଡ଼ ପ୍ରାୟ 30 ସେମି ଉପରକୁ ଉଠାନ୍ତୁ।"],
    ["Loosen tight clothing and make sure they have fresh air.", "कसे कपड़े ढीले करें और ताज़ी हवा आने दें।", "ଟାଣ ପୋଷାକ ଢିଲା କରନ୍ତୁ ଓ ସତେଜ ପବନ ଆସିବାକୁ ଦିଅନ୍ତୁ।"],
    ["If they do not wake within a minute, or are not breathing normally, call 108.", "एक मिनट में होश न आए या सांस ठीक न हो तो 108 पर कॉल करें।", "ଏକ ମିନିଟ୍ ଭିତରେ ଚେତା ନ ଫେରିଲେ କିମ୍ବା ନିଶ୍ୱାସ ସ୍ୱାଭାବିକ ନ ଥିଲେ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    ["Seizure (fits)", "दौरा (मिर्गी)", "ମୂର୍ଚ୍ଛା (ଫିଟ୍)"], ["Stay calm, move hard objects away, cushion the head.", "शांत रहें, सख़्त चीज़ें हटा दें, सिर के नीचे कुछ नरम रखें।", "ଶାନ୍ତ ରୁହନ୍ତୁ, ଟାଣ ଜିନିଷ ହଟାନ୍ତୁ, ମୁଣ୍ଡ ତଳେ ନରମ କିଛି ରଖନ୍ତୁ।"],
    ["Do not hold them down and do not put anything in their mouth.", "उन्हें ज़बरदस्ती न पकड़ें और मुँह में कुछ न डालें।", "ତାଙ୍କୁ ଜୋରରେ ଧରନ୍ତୁ ନାହିଁ ଓ ପାଟିରେ କିଛି ଦିଅନ୍ତୁ ନାହିଁ।"],
    ["After the shaking stops, turn them on their side.", "झटके रुकने के बाद उन्हें करवट दिला दें।", "କମ୍ପନ ବନ୍ଦ ହେବା ପରେ ତାଙ୍କୁ କଡ଼ ଲେଉଟାଇ ଦିଅନ୍ତୁ।"],
    ["Call 108 if it lasts more than 5 minutes, repeats, or it is their first seizure.", "5 मिनट से ज़्यादा चले, बार-बार हो, या पहली बार हो तो 108 पर कॉल करें।", "5 ମିନିଟରୁ ଅଧିକ ରହିଲେ, ବାରମ୍ବାର ହେଲେ, କିମ୍ବା ପ୍ରଥମ ଥର ହେଲେ 108 କୁ କଲ୍ କରନ୍ତୁ।"],
    // BMI
    ["Body Mass Index, using the cut-offs recommended for Indian adults.", "बॉडी मास इंडेक्स, भारतीय वयस्कों के लिए सुझाई गई सीमाओं के अनुसार।", "ବଡି ମାସ୍ ଇଣ୍ଡେକ୍ସ, ଭାରତୀୟ ବୟସ୍କଙ୍କ ପାଇଁ ସୁପାରିଶ ସୀମା ଅନୁସାରେ।"],
    ["Weight (kg)", "वज़न (किलो)", "ଓଜନ (କିଲୋ)"], ["Height", "लंबाई", "ଉଚ୍ଚତା"], ["Centimetres", "सेंटीमीटर", "ସେଣ୍ଟିମିଟର"], ["Feet + inches", "फ़ुट + इंच", "ଫୁଟ୍ + ଇଞ୍ଚ"],
    ["Height (cm)", "लंबाई (सेमी)", "ଉଚ୍ଚତା (ସେମି)"], ["Feet", "फ़ुट", "ଫୁଟ୍"], ["Inches", "इंच", "ଇଞ୍ଚ"], ["Calculate", "गणना करें", "ହିସାବ କରନ୍ତୁ"],
    ["BMI is a screening number, not a diagnosis. It is not meant for children, pregnant women or athletes.", "BMI सिर्फ़ एक अनुमान है, बीमारी की जाँच नहीं। यह बच्चों, गर्भवती महिलाओं या खिलाड़ियों के लिए नहीं है।", "BMI କେବଳ ଏକ ଅନୁମାନ, ରୋଗ ନିର୍ଣ୍ଣୟ ନୁହେଁ। ଏହା ପିଲା, ଗର୍ଭବତୀ ମହିଳା କିମ୍ବା ଖେଳାଳିଙ୍କ ପାଇଁ ନୁହେଁ।"],
    ["Please enter your weight and height.", "कृपया वज़न और लंबाई लिखें।", "ଦୟାକରି ଓଜନ ଓ ଉଚ୍ଚତା ଲେଖନ୍ତୁ।"], ["Height used: {cm} cm", "ली गई लंबाई: {cm} सेमी", "ବ୍ୟବହୃତ ଉଚ୍ଚତା: {cm} ସେମି"],
    ["Underweight", "कम वज़न", "କମ୍ ଓଜନ"], ["Normal", "सामान्य", "ସାଧାରଣ"], ["Overweight", "ज़्यादा वज़न", "ଅଧିକ ଓଜନ"], ["Obese", "मोटापा", "ମେଦବହୁଳତା"],
    ["Eat regular balanced meals with enough protein; see a doctor if you are losing weight without trying.", "नियमित संतुलित भोजन और पर्याप्त प्रोटीन लें; बिना कोशिश वज़न घट रहा हो तो डॉक्टर को दिखाएँ।", "ନିୟମିତ ସନ୍ତୁଳିତ ଖାଦ୍ୟ ଓ ଯଥେଷ୍ଟ ପ୍ରୋଟିନ୍ ଖାଆନ୍ତୁ; ବିନା ଚେଷ୍ଟାରେ ଓଜନ କମୁଥିଲେ ଡାକ୍ତର ଦେଖାନ୍ତୁ।"],
    ["Good. Keep up a balanced diet and at least 30 minutes of activity most days.", "बढ़िया। संतुलित भोजन और ज़्यादातर दिनों में कम से कम 30 मिनट व्यायाम जारी रखें।", "ଭଲ। ସନ୍ତୁଳିତ ଖାଦ୍ୟ ଓ ଅଧିକାଂଶ ଦିନ ଅତି କମରେ 30 ମିନିଟ୍ ବ୍ୟାୟାମ ଜାରି ରଖନ୍ତୁ।"],
    ["Small changes help: more vegetables, fewer sugary drinks, and daily walking.", "छोटे बदलाव मदद करते हैं: ज़्यादा सब्ज़ियाँ, कम मीठे पेय और रोज़ टहलना।", "ଛୋଟ ପରିବର୍ତ୍ତନ ସାହାଯ୍ୟ କରେ: ଅଧିକ ପନିପରିବା, କମ୍ ମିଠା ପାନୀୟ ଓ ପ୍ରତିଦିନ ଚାଲିବା।"],
    ["Talk to a doctor about a safe plan; this raises the risk of diabetes and heart disease.", "सुरक्षित योजना के लिए डॉक्टर से बात करें; इससे डायबिटीज़ और दिल की बीमारी का ख़तरा बढ़ता है।", "ସୁରକ୍ଷିତ ଯୋଜନା ପାଇଁ ଡାକ୍ତରଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ; ଏହା ମଧୁମେହ ଓ ହୃଦରୋଗର ଆଶଙ୍କା ବଢ଼ାଏ।"],
    // profile
    ["email verified", "ईमेल पक्का", "ଇମେଲ୍ ନିଶ୍ଚିତ"], ["My details", "मेरी जानकारी", "ମୋର ତଥ୍ୟ"], ["Save my details", "मेरी जानकारी सेव करें", "ମୋ ତଥ୍ୟ ସେଭ୍ କରନ୍ତୁ"],
    ["Saved age: {n}. Choose your date of birth to keep it up to date.", "सेव उम्र: {n}। उम्र अपने-आप सही रहे, इसके लिए जन्म तिथि चुनें।", "ସେଭ୍ ବୟସ: {n}। ବୟସ ଠିକ୍ ରହିବା ପାଇଁ ଜନ୍ମ ତାରିଖ ବାଛନ୍ତୁ।"],
    ["Family members", "परिवार के सदस्य", "ପରିବାର ସଦସ୍ୟ"], ["Ask questions for family members. Each one has their own photo and chat history.", "परिवार के सदस्यों के लिए सवाल पूछें। हर सदस्य की अपनी फ़ोटो और चैट इतिहास है।", "ପରିବାର ସଦସ୍ୟଙ୍କ ପାଇଁ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ। ପ୍ରତ୍ୟେକଙ୍କର ନିଜ ଫଟୋ ଓ ଚାଟ୍ ଇତିହାସ ଅଛି।"],
    ["Name", "नाम", "ନାମ"], ["Relation", "रिश्ता", "ସମ୍ପର୍କ"], ["Settings, language and storage", "सेटिंग्स, भाषा और स्टोरेज", "ସେଟିଂସ୍, ଭାଷା ଓ ଷ୍ଟୋରେଜ୍"], ["Log out", "लॉग आउट", "ଲଗ୍ ଆଉଟ୍"],
    ["Your details were saved.", "आपकी जानकारी सेव हो गई।", "ଆପଣଙ୍କ ତଥ୍ୟ ସେଭ୍ ହେଲା।"], ["Please enter the family member's name.", "कृपया परिवार के सदस्य का नाम लिखें।", "ଦୟାକରି ପରିବାର ସଦସ୍ୟଙ୍କ ନାମ ଲେଖନ୍ତୁ।"],
    ["Please choose a gender for the family member.", "कृपया परिवार के सदस्य का लिंग चुनें।", "ଦୟାକରି ପରିବାର ସଦସ୍ୟଙ୍କ ଲିଙ୍ଗ ବାଛନ୍ତୁ।"],
    ["{name} was added. Choose them with the “Asking for” button.", "{name} जोड़ दिए गए। “किसके लिए पूछ रहे हैं” बटन से उन्हें चुनें।", "{name} ଯୋଡ଼ାଗଲେ। “କାହା ପାଇଁ ପଚାରୁଛନ୍ତି” ବଟନରେ ତାଙ୍କୁ ବାଛନ୍ତୁ।"],
    ["Remove this family member?", "इस सदस्य को हटाएँ?", "ଏହି ସଦସ୍ୟଙ୍କୁ ହଟାଇବେ?"], ["Their chat history on this phone is deleted too.", "इस फ़ोन से उनका चैट इतिहास भी मिट जाएगा।", "ଏହି ଫୋନରୁ ତାଙ୍କ ଚାଟ୍ ଇତିହାସ ମଧ୍ୟ ଲିଭିଯିବ।"],
    ["You have been logged out.", "आप लॉग आउट हो गए।", "ଆପଣ ଲଗ୍ ଆଉଟ୍ ହେଲେ।"],
    // settings
    ["Language", "भाषा", "ଭାଷା"], ["The app and the assistant use this language. You can also just write your question in English, हिंदी or ଓଡ଼ିଆ.", "ऐप और सहायक इसी भाषा में चलेंगे। आप सवाल English, हिंदी या ଓଡ଼ିଆ में भी लिख सकते हैं।", "ଆପ୍ ଓ ସହାୟକ ଏହି ଭାଷାରେ ଚାଲିବ। ଆପଣ English, हिंदी କିମ୍ବା ଓଡ଼ିଆରେ ମଧ୍ୟ ପ୍ରଶ୍ନ ଲେଖିପାରିବେ।"],
    ["Accounts with Firebase (free)", "Firebase से खाते (मुफ़्त)", "Firebase ସହ ଖାତା (ମାଗଣା)"], ["Online AI (Groq)", "ऑनलाइन AI (Groq)", "ଅନଲାଇନ୍ AI (Groq)"],
    ["Free key at console.groq.com/keys. Stored only on this phone. Needed for full answers in Hindi and Odia.", "मुफ़्त key console.groq.com/keys पर। सिर्फ़ इस फ़ोन में रहती है। हिंदी और ओड़िया में पूरे उत्तर के लिए ज़रूरी।", "ମାଗଣା key console.groq.com/keys ରେ। କେବଳ ଏହି ଫୋନରେ ରହେ। ହିନ୍ଦୀ ଓ ଓଡ଼ିଆରେ ପୂରା ଉତ୍ତର ପାଇଁ ଦରକାର।"],
    ["Mode and appearance", "मोड और रूप", "ମୋଡ୍ ଓ ରୂପ"], ["Online when available", "इंटरनेट हो तो ऑनलाइन", "ଇଣ୍ଟରନେଟ୍ ଥିଲେ ଅନଲାଇନ୍"], ["Always offline (everything stays on this phone)", "हमेशा ऑफ़लाइन (सब कुछ इसी फ़ोन में)", "ସବୁବେଳେ ଅଫଲାଇନ୍ (ସବୁକିଛି ଏହି ଫୋନରେ)"],
    ["Theme", "थीम", "ଥିମ୍"], ["Auto", "अपने-आप", "ସ୍ୱୟଂଚାଳିତ"], ["Light", "हल्की", "ହାଲୁକା"], ["Dark", "गहरी", "ଗାଢ଼"], ["Save settings", "सेटिंग्स सेव करें", "ସେଟିଂସ୍ ସେଭ୍ କରନ୍ତୁ"],
    ["Storage on this phone", "इस फ़ोन में स्टोरेज", "ଏହି ଫୋନରେ ଷ୍ଟୋରେଜ୍"], ["Medibot's saved data uses about {n} KB. The encyclopedia itself is part of the app.", "मेडिबॉट का सेव डेटा लगभग {n} KB है। विश्वकोश ऐप के अंदर ही है।", "ମେଡିବଟ୍ ର ସେଭ୍ ଡାଟା ପ୍ରାୟ {n} KB। ବିଶ୍ୱକୋଷ ଆପ୍ ଭିତରେ ଅଛି।"],
    ["Clear cache", "कैश साफ़ करें", "କ୍ୟାଶ୍ ସଫା କରନ୍ତୁ"], ["Clear chat history…", "चैट इतिहास मिटाएँ…", "ଚାଟ୍ ଇତିହାସ ଲିଭାନ୍ତୁ…"], ["Forget saved passwords", "सेव पासवर्ड भूल जाएँ", "ସେଭ୍ ପାସୱାର୍ଡ ଭୁଲିଯାଆନ୍ତୁ"],
    ["Clear cache removes temporary files only. Your account, family and chats stay.", "कैश साफ़ करने से सिर्फ़ अस्थायी फ़ाइलें हटती हैं। खाता, परिवार और चैट बने रहते हैं।", "କ୍ୟାଶ୍ ସଫା କଲେ କେବଳ ଅସ୍ଥାୟୀ ଫାଇଲ୍ ହଟେ। ଖାତା, ପରିବାର ଓ ଚାଟ୍ ରହେ।"],
    ["About Medibot", "मेडिबॉट के बारे में", "ମେଡିବଟ୍ ବିଷୟରେ"], ["Version {v}", "संस्करण {v}", "ସଂସ୍କରଣ {v}"], ["Settings saved.", "सेटिंग्स सेव हो गईं।", "ସେଟିଂସ୍ ସେଭ୍ ହେଲା।"],
    ["Answers come from The Gale Encyclopedia of Medicine (Volume C–F) stored on this phone, with {n} diseases in the library.", "उत्तर इस फ़ोन में रखे The Gale Encyclopedia of Medicine (खंड C–F) से आते हैं; लाइब्रेरी में {n} बीमारियाँ हैं।", "ଉତ୍ତର ଏହି ଫୋନରେ ଥିବା The Gale Encyclopedia of Medicine (ଖଣ୍ଡ C–F) ରୁ ଆସେ; ଲାଇବ୍ରେରୀରେ {n} ରୋଗ ଅଛି।"],
    ["Cache cleared.", "कैश साफ़ हो गया।", "କ୍ୟାଶ୍ ସଫା ହେଲା।"], ["Forget saved passwords?", "सेव पासवर्ड भूल जाएँ?", "ସେଭ୍ ପାସୱାର୍ଡ ଭୁଲିଯିବେ?"],
    ["You will need to type your password next time.", "अगली बार पासवर्ड लिखना होगा।", "ପରଥର ପାସୱାର୍ଡ ଲେଖିବାକୁ ପଡ଼ିବ।"], ["Forget", "भूल जाएँ", "ଭୁଲିଯାଆନ୍ତୁ"], ["Saved passwords removed.", "सेव पासवर्ड हटा दिए गए।", "ସେଭ୍ ପାସୱାର୍ଡ ହଟାଗଲା।"],
    ["Firebase is set up. Accounts work on any phone, and email sign-ups get a free verification link.", "Firebase सेट है। खाते किसी भी फ़ोन पर चलते हैं, और ईमेल से बने खातों को मुफ़्त लिंक मिलता है।", "Firebase ସେଟ୍ ହୋଇଛି। ଖାତା ଯେକୌଣସି ଫୋନରେ ଚାଲେ, ଓ ଇମେଲ୍ ଖାତାକୁ ମାଗଣା ଲିଙ୍କ୍ ମିଳେ।"],
    ["Firebase is not set up, so accounts stay on this phone. Follow the steps below once (free, about 10 minutes).", "Firebase सेट नहीं है, इसलिए खाते सिर्फ़ इसी फ़ोन में हैं। नीचे के कदम एक बार करें (मुफ़्त, लगभग 10 मिनट)।", "Firebase ସେଟ୍ ହୋଇନାହିଁ, ତେଣୁ ଖାତା କେବଳ ଏହି ଫୋନରେ। ତଳ ପଦକ୍ଷେପ ଥରେ କରନ୍ତୁ (ମାଗଣା, ପ୍ରାୟ 10 ମିନିଟ୍)।"],
    ["Confirm your mobile number", "अपना मोबाइल नंबर पक्का करें", "ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବର ନିଶ୍ଚିତ କରନ୍ତୁ"],
    ["Enter the code", "कोड डालें", "କୋଡ୍ ଦିଅନ୍ତୁ"],
    ["We sent a 6-digit code by SMS to {to}. It can take up to a minute.", "हमने {to} पर SMS से 6 अंकों का कोड भेजा है। इसमें एक मिनट तक लग सकता है।", "ଆମେ {to} କୁ SMS ରେ 6 ଅଙ୍କର କୋଡ୍ ପଠାଇଛୁ। ଏକ ମିନିଟ୍ ପର୍ଯ୍ୟନ୍ତ ଲାଗିପାରେ।"],
    ["SMS code", "SMS कोड", "SMS କୋଡ୍"],
    ["Verify", "पक्का करें", "ଯାଞ୍ଚ କରନ୍ତୁ"],
    ["Change mobile number", "मोबाइल नंबर बदलें", "ମୋବାଇଲ୍ ନମ୍ବର ବଦଳାନ୍ତୁ"],
    ["Go back", "वापस जाएँ", "ପଛକୁ ଯାଆନ୍ତୁ"],
    ["Resend code in {n}s", "{n} सेकंड में फिर से भेजें", "{n} ସେକେଣ୍ଡରେ ପୁଣି ପଠାନ୍ତୁ"],
    ["Resend code", "कोड फिर से भेजें", "କୋଡ୍ ପୁଣି ପଠାନ୍ତୁ"],
    ["A new code is on its way.", "नया कोड भेजा जा रहा है।", "ନୂଆ କୋଡ୍ ପଠାଯାଉଛି।"],
    ["Please fill in the form again.", "कृपया फ़ॉर्म फिर से भरें।", "ଦୟାକରି ଫର୍ମ ପୁଣି ପୂରଣ କରନ୍ତୁ।"],
    ["Send a code by SMS to {to}", "{to} पर SMS से कोड भेजें", "{to} କୁ SMS ରେ କୋଡ୍ ପଠାନ୍ତୁ"],
    ["Confirm my date of birth", "मेरी जन्मतिथि से पक्का करें", "ମୋ ଜନ୍ମ ତାରିଖରେ ନିଶ୍ଚିତ କରନ୍ତୁ"],
    ["How should we check it's you?", "हम कैसे पक्का करें कि यह आप ही हैं?", "ଏହା ଆପଣ ବୋଲି ଆମେ କିପରି ନିଶ୍ଚିତ କରିବୁ?"],
    ["Account: {name}", "खाता: {name}", "ଖାତା: {name}"],
    ["Change password", "पासवर्ड बदलें", "ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ"],
    ["Confirm it's you first.", "पहले पक्का करें कि यह आप ही हैं।", "ପ୍ରଥମେ ନିଶ୍ଚିତ କରନ୍ତୁ ଯେ ଏହା ଆପଣ।"],
    ["Current password", "मौजूदा पासवर्ड", "ବର୍ତ୍ତମାନର ପାସୱାର୍ଡ"],
    ["That is not your current password.", "यह आपका मौजूदा पासवर्ड नहीं है।", "ଏହା ଆପଣଙ୍କ ବର୍ତ୍ତମାନର ପାସୱାର୍ଡ ନୁହେଁ।"],
    ["Thanks, it's you. Now choose a new password.", "धन्यवाद, यह आप ही हैं। अब नया पासवर्ड चुनें।", "ଧନ୍ୟବାଦ, ଏହା ଆପଣ। ଏବେ ନୂଆ ପାସୱାର୍ଡ ବାଛନ୍ତୁ।"],
    ["Password changed.", "पासवर्ड बदल गया।", "ପାସୱାର୍ଡ ବଦଳିଗଲା।"],
    ["This mobile number is not saved on this phone. A mobile account can reset its password only on the phone where it was used. Log in there, or create a new account.", "यह मोबाइल नंबर इस फ़ोन में सेव नहीं है। मोबाइल खाते का पासवर्ड उसी फ़ोन पर बदला जा सकता है जहाँ उसका इस्तेमाल हुआ था। वहाँ लॉग इन करें, या नया खाता बनाएँ।", "ଏହି ମୋବାଇଲ୍ ନମ୍ବର ଏହି ଫୋନରେ ସେଭ୍ ନାହିଁ। ମୋବାଇଲ୍ ଖାତାର ପାସୱାର୍ଡ କେବଳ ସେହି ଫୋନରେ ବଦଳାଯାଇପାରିବ ଯେଉଁଠି ତାହା ବ୍ୟବହାର ହୋଇଥିଲା। ସେଠାରେ ଲଗ୍ ଇନ୍ କରନ୍ତୁ, କିମ୍ବା ନୂଆ ଖାତା ଖୋଲନ୍ତୁ।"],
    ["SMS codes (Fast2SMS)", "SMS कोड (Fast2SMS)", "SMS କୋଡ୍ (Fast2SMS)"],
    ["How to set it up", "कैसे सेट करें", "କିପରି ସେଟ୍ କରିବେ"],
    ["Test SMS key", "SMS की जाँचें", "SMS କି ଯାଞ୍ଚ କରନ୍ତୁ"],
    ["Email a reset link to {to}", "{to} पर पासवर्ड बदलने का लिंक भेजें", "{to} କୁ ପାସୱାର୍ଡ ବଦଳାଇବା ଲିଙ୍କ୍ ପଠାନ୍ତୁ"],
    ["Reset link sent to {email}. Open it, choose a new password, then log in here with the new password.", "{email} पर लिंक भेज दिया गया है। उसे खोलें, नया पासवर्ड चुनें, फिर यहाँ नए पासवर्ड से लॉग इन करें।", "{email} କୁ ଲିଙ୍କ୍ ପଠାଗଲା। ତାହା ଖୋଲନ୍ତୁ, ନୂଆ ପାସୱାର୍ଡ ବାଛନ୍ତୁ, ତାପରେ ଏଠାରେ ନୂଆ ପାସୱାର୍ଡରେ ଲଗ୍ ଇନ୍ କରନ୍ତୁ।"]
  ];
  var DICT = { hi: {}, or: {} };
  ROWS.forEach(function (r) { DICT.hi[r[0]] = r[1]; DICT.or[r[0]] = r[2]; });

  MB.lang = function () { var l = (MB.settings ? MB.settings().lang : "") || "en"; return DICT[l] || l === "en" ? l : "en"; };
  MB.setLang = function (l) { var s = MB.settings(); s.lang = l; MB.saveSettings(s); };
  /** Translate an English text (with {placeholders}) into the chosen (or given) language. */
  MB.t = function (text, vars, lang) {
    if (typeof vars !== "object" || vars === null) vars = null;  // allows arr.map(MB.t)
    var l = (typeof lang === "string" && lang) || MB.lang(), s = String(text == null ? "" : text);
    var out = (l !== "en" && DICT[l] && DICT[l][s]) || s;
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return out;
  };
  var MONTHS = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
    or: ["ଜାନୁଆରୀ", "ଫେବୃଆରୀ", "ମାର୍ଚ୍ଚ", "ଅପ୍ରେଲ", "ମେ", "ଜୁନ", "ଜୁଲାଇ", "ଅଗଷ୍ଟ", "ସେପ୍ଟେମ୍ବର", "ଅକ୍ଟୋବର", "ନଭେମ୍ବର", "ଡିସେମ୍ବର"]
  };
  var DAYS = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"], or: ["ରବି", "ସୋମ", "ମଙ୍ଗଳ", "ବୁଧ", "ଗୁରୁ", "ଶୁକ୍ର", "ଶନି"] };
  MB.monthNames = function () { return MONTHS[MB.lang()]; };
  MB.formatDate = function (d) { var l = MB.lang(); return DAYS[l][d.getDay()] + ", " + d.getDate() + " " + MONTHS[l][d.getMonth()]; };
  MB.formatTime = function (t) { if (!t) return ""; var d = new Date(t), h = d.getHours(), m = ("0" + d.getMinutes()).slice(-2); return (h % 12 || 12) + ":" + m + (h < 12 ? " am" : " pm"); };

  /** Language of a piece of text from its script: Odia, Devanagari (Hindi) or Latin (English). */
  MB.detectLang = function (text) {
    var t = String(text || "");
    if (/[଀-୿]/.test(t)) return "or";
    if (/[ऀ-ॿ]/.test(t)) return "hi";
    return "en";
  };
  MB.speechLang = function (l) { return { hi: "hi-IN", or: "or-IN" }[l] || "en-IN"; };

  MB.SUGGESTIONS = {
    en: ["What are the symptoms of dengue fever?", "How is diabetes treated?", "What causes cataracts?", "How can I prevent food poisoning?"],
    hi: ["डेंगू बुखार के लक्षण क्या हैं?", "डायबिटीज़ का इलाज कैसे होता है?", "मोतियाबिंद क्यों होता है?", "फ़ूड पॉइज़निंग से कैसे बचें?"],
    or: ["ଡେଙ୍ଗୁ ଜ୍ୱରର ଲକ୍ଷଣ କ'ଣ?", "ମଧୁମେହର ଚିକିତ୍ସା କିପରି ହୁଏ?", "ମୋତିଆବିନ୍ଦୁ କାହିଁକି ହୁଏ?", "ଖାଦ୍ୟ ବିଷାକ୍ତତାରୁ କିପରି ବଞ୍ଚିବା?"]
  };

  // Hindi / Odia / Hinglish health words -> English words used by the encyclopedia (for offline search).
  var TERMS = [
    ["dengue fever", "डेंगू|डेंगु", "ଡେଙ୍ଗୁ", "dengu"], ["fever", "बुखार|ज्वर|बुख़ार", "ଜ୍ୱର|ଜର", "bukhar|bukhaar"], ["cough", "खांसी|खाँसी", "କାଶ", "khansi|khasi"],
    ["cold", "ज़ुकाम|जुकाम|सर्दी", "ଥଣ୍ଡା|ସର୍ଦ୍ଦି", "jukam|sardi"], ["headache", "सिरदर्द|सिर दर्द|सिर में दर्द", "ମୁଣ୍ଡବିନ୍ଧା|ମୁଣ୍ଡ ବିନ୍ଧା", "sir dard|sirdard"],
    ["diabetes mellitus", "डायबिटीज़|डायबिटीज|मधुमेह|शुगर की बीमारी", "ମଧୁମେହ|ଡାଇବେଟିସ୍|ସୁଗାର", "diabetes|sugar"], ["blood pressure hypertension", "ब्लड प्रेशर|रक्तचाप|बीपी", "ରକ୍ତଚାପ|ବିପି", "bp"],
    ["diarrhea", "दस्त|डायरिया|पतला दस्त", "ଝାଡ଼ା|ତରଳ ଝାଡ଼ା", "dast|loose motion"], ["vomiting", "उल्टी", "ବାନ୍ତି", "ulti"], ["nausea", "जी मिचलाना|मतली", "ବାନ୍ତି ଲାଗିବା", "ji michlana"],
    ["abdominal pain stomach", "पेट दर्द|पेट में दर्द|पेट", "ପେଟ ବିନ୍ଧା|ପେଟ", "pet dard|pet"], ["chest pain", "सीने में दर्द|छाती में दर्द|छाती", "ଛାତି ଯନ୍ତ୍ରଣା|ଛାତି", "seene me dard"],
    ["rash skin", "दाने|चकत्ते|त्वचा", "ଫୋଟକା|ଚର୍ମ", "daane"], ["itching", "खुजली", "କୁଣ୍ଡେଇ", "khujli"], ["sore throat", "गले में खराश|गला खराब|गले में दर्द", "ଗଳା ଘା|ଗଳା ବିନ୍ଧା", "gala kharab"],
    ["runny nose", "नाक बहना", "ନାକରୁ ପାଣି", "naak behna"], ["fatigue tiredness", "थकान|कमज़ोरी|कमजोरी", "କ୍ଲାନ୍ତି|ଦୁର୍ବଳତା", "thakan|kamzori"],
    ["dizziness", "चक्कर", "ମୁଣ୍ଡ ବୁଲାଇବା", "chakkar"], ["shortness of breath", "सांस फूलना|सांस लेने में तकलीफ|साँस", "ନିଶ୍ୱାସ କଷ୍ଟ|ଶ୍ୱାସ", "saans"],
    ["joint pain arthritis", "जोड़ों में दर्द|जोड़ों का दर्द|गठिया", "ଗଣ୍ଠି ବିନ୍ଧା|ବାତ", "jodo me dard"], ["back pain", "कमर दर्द|पीठ दर्द", "ପିଠି ବିନ୍ଧା|ଅଣ୍ଟା ବିନ୍ଧା", "kamar dard"],
    ["swelling", "सूजन", "ଫୁଲା", "sujan"], ["weight loss", "वज़न कम|वजन कम", "ଓଜନ କମିବା", "wajan kam"], ["blurred vision eye", "धुंधला दिखना|आँख|आंख", "ଝାପସା|ଆଖି", "aankh"],
    ["cataract", "मोतियाबिंद", "ମୋତିଆବିନ୍ଦୁ", "motiyabind"], ["food poisoning", "फ़ूड पॉइज़निंग|फूड पॉइजनिंग|खाने से ज़हर", "ଖାଦ୍ୟ ବିଷାକ୍ତତା", "food poisoning"],
    ["cholera", "हैजा", "ହଇଜା|କଲେରା", "haija"], ["chickenpox", "चिकनपॉक्स|छोटी माता|चेचक", "ମାଳିମା|ଚିକେନପକ୍ସ", "chhoti mata"], ["asthma", "दमा|अस्थमा", "ଆଜମା|ଶ୍ୱାସ ରୋଗ", "dama"],
    ["cancer", "कैंसर", "କର୍କଟ|କ୍ୟାନସର", "cancer"], ["heart attack", "दिल का दौरा|हार्ट अटैक", "ହୃଦଘାତ", "heart attack"], ["depression", "डिप्रेशन|अवसाद|उदासी", "ଅବସାଦ|ଡିପ୍ରେସନ୍", "udasi"],
    ["anemia", "खून की कमी|एनीमिया", "ରକ୍ତହୀନତା", "khoon ki kami"], ["constipation", "कब्ज़|कब्ज", "କୋଷ୍ଠକାଠିନ୍ୟ", "kabj"], ["acidity heartburn", "एसिडिटी|जलन", "ଅମ୍ଳତା|ଜଳନ", "acidity"],
    ["burns", "जलना|जल गया", "ପୋଡ଼ା", "jalna"], ["snake bite", "सांप|साँप", "ସାପ", "saanp"], ["dog bite rabies", "कुत्ते ने काटा|रेबीज", "କୁକୁର କାମୁଡ଼ା|ଜଳାତଙ୍କ", "kutta"],
    ["pregnancy", "गर्भावस्था|प्रेगनेंसी|गर्भ", "ଗର୍ଭାବସ୍ଥା|ଗର୍ଭ", "pregnancy"], ["child infant", "बच्चा|बच्चे|शिशु", "ପିଲା|ଶିଶୁ", "bachcha"],
    ["ear", "कान", "କାନ", "kaan"], ["tooth dental", "दांत|दाँत", "ଦାନ୍ତ", "daant"], ["kidney", "गुर्दा|किडनी", "ବୃକକ|କିଡନୀ", "kidney"], ["liver", "लीवर|जिगर", "ଯକୃତ|ଲିଭର", "liver"],
    ["cirrhosis", "सिरोसिस", "ସିରୋସିସ୍", "cirrhosis"], ["colic", "मरोड़", "ପେଟ ମୋଡ଼ା", "marod"], ["conjunctivitis", "आँख आना|आंख आना", "ଆଖି ଉଠିବା", "aankh aana"],
    // question words
    ["symptoms", "लक्षण|निशानी", "ଲକ୍ଷଣ", "lakshan"], ["treatment", "इलाज|उपचार|दवा|दवाई", "ଚିକିତ୍ସା|ଔଷଧ|ଉପଚାର", "ilaj|ilaaj|dawa|dawai"], ["causes", "कारण|क्यों", "କାରଣ|କାହିଁକି", "karan|kyon"],
    ["prevention prevent", "बचाव|बचें|रोकथाम", "ପ୍ରତିରୋଧ|ବଞ୍ଚିବା", "bachav|bachaav"], ["diagnosis test", "जाँच|जांच|टेस्ट", "ଯାଞ୍ଚ|ପରୀକ୍ଷା", "jaanch"],
    ["home remedies natural", "घरेलू उपाय|घरेलू", "ଘରୋଇ ଉପାୟ|ଘରୋଇ", "gharelu"]
  ];
  var TERM_RE = TERMS.map(function (t) { return { en: t[0], re: new RegExp(t.slice(1).filter(Boolean).join("|"), "i") }; });
  /** English words for a Hindi/Odia/Hinglish question (keeps the original English words too).
   *  With list=true returns a comma separated list (for the symptom checker). */
  MB.englishQuery = function (text, list) {
    var t = String(text || "");
    if (list) {
      var rev = {}; ["hi", "or"].forEach(function (l) { for (var k in DICT[l]) rev[DICT[l][k].toLowerCase()] = k; });
      return t.split(/[,،।;\n]+/).map(function (part) {
        var p = part.trim(); if (!p) return "";
        if (rev[p.toLowerCase()]) return rev[p.toLowerCase()];
        var hit = TERM_RE.filter(function (x) { return x.re.test(p); })[0];
        return hit ? hit.en.split(" ").slice(0, hit.en.indexOf(" pain") > 0 || /^(sore|runny|shortness|weight|blurred|dengue|food|snake|heart|chest|back)/.test(hit.en) ? 3 : 1).join(" ").replace(/ (stomach|skin|eye|arthritis|hypertension)$/, "") : p;
      }).filter(Boolean).join(", ");
    }
    var words = [];
    TERM_RE.forEach(function (x) { if (x.re.test(t)) words.push(x.en); });
    var latin = (t.match(/[A-Za-z][A-Za-z'\-]+/g) || []).join(" ");
    return (latin + " " + words.join(" ")).trim() || t;
  };

  // ---------- voice typing (Chrome on PC/Android browser; not available inside every app WebView) ----------
  MB.canListen = function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); };
  MB.listen = function (lang) {
    return new Promise(function (ok, fail) {
      var R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return fail(new Error("Voice typing is not available here."));
      var r = new R(); r.lang = MB.speechLang(lang); r.interimResults = false; r.maxAlternatives = 1;
      r.onresult = function (e) { ok(e.results[0][0].transcript); };
      r.onerror = function () { fail(new Error("Could not hear you. Please try again.")); };
      r.onend = function () { fail(new Error("Could not hear you. Please try again.")); };
      r.start();
    });
  };
})();
