/* Medibot core: storage, settings, password hashing, accounts (Firebase Authentication, or demo mode). */
(function () {
  "use strict";
  var MB = (window.MB = window.MB || {});
  var CFG = window.MB_CONFIG || {};

  // ---------- storage ----------
  // Everything is kept in the phone's own storage. In the Android app every write is ALSO saved to
  // Android's permanent app storage (Capacitor Preferences = SharedPreferences), so accounts survive
  // app restarts, logouts, WebView cache clearing and app updates. On PC / browser localStorage is used.
  function nativeStore() {
    var C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Preferences || null;
  }
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    var text = JSON.stringify(value);
    try { localStorage.setItem(key, text); } catch (e) { console.warn("storage full?", e); }
    var n = nativeStore(); if (n) n.set({ key: key, value: text }).catch(function () {});
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    var n = nativeStore(); if (n) n.remove({ key: key }).catch(function () {});
  }
  MB.load = load; MB.save = save; MB.remove = remove;
  /** Call once at start-up: copies the permanent phone storage back into the app (Android only). */
  MB.restoreStorage = function () {
    var n = nativeStore();
    if (!n) return Promise.resolve();
    var done = n.keys().then(function (r) {
      return Promise.all((r.keys || []).filter(function (k) { return k.indexOf("mb_") === 0; }).map(function (k) {
        return n.get({ key: k }).then(function (g) { if (g && g.value != null) try { localStorage.setItem(k, g.value); } catch (e) {} });
      })).then(function () {
        // First run after updating from an older version: copy what is already in localStorage to permanent storage.
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf("mb_") === 0 && (r.keys || []).indexOf(k) < 0) n.set({ key: k, value: localStorage.getItem(k) }).catch(function () {});
        }
      });
    }).catch(function () {});
    var timeout = new Promise(function (ok) { setTimeout(ok, 2500); });
    return Promise.race([done, timeout]);
  };

  // ---------- settings ----------
  var DEFAULT_SETTINGS = {
    mode: "auto",                       // auto = use internet when available, offline = never
    groqKey: CFG.groqApiKey || "",
    groqModel: CFG.groqModel || "",
    ollamaUrl: CFG.ollamaUrl || "",
    ollamaModel: CFG.ollamaModel || "llama3.2:3b",
    firebaseApiKey: CFG.firebaseApiKey || "",      // Firebase project > Project settings > Web API key
    fast2smsKey: CFG.fast2smsApiKey || "",       // fast2sms.com > Dev API (paid per SMS): real SMS codes for mobile numbers
    fast2smsRoute: CFG.fast2smsRoute || "q",     // q = Quick SMS (works after recharge), otp = OTP route (needs website verification)
    countryCode: CFG.defaultCountryCode || "+91",
    showOtpOnScreen: true,          // demo mode (no Firebase key / offline): show the code on screen
    theme: "auto",
    lang: ""                        // "en", "hi" or "or" (empty = ask on first start)
  };
  MB.settings = function () { return Object.assign({}, DEFAULT_SETTINGS, load("mb_settings", {})); };
  MB.saveSettings = function (s) { save("mb_settings", s); };
  MB.validEmail = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim()); };
  MB.maskEmail = function (e) {
    var m = String(e || "").match(/^(.)(.*)(@.*)$/); return m ? m[1] + "*".repeat(Math.min(m[2].length, 6)) + m[3] : e;
  };
  MB.applyTheme = function () {
    var t = MB.settings().theme;
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  };
  MB.isOnline = function () { return MB.settings().mode !== "offline" && navigator.onLine !== false; };

  // ---------- helpers ----------
  MB.now = function () { return Date.now(); };
  MB.escape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  MB.nl2br = function (s) { return MB.escape(s).replace(/\n/g, "<br>"); };

  MB.normalizePhone = function (raw) {
    var n = String(raw || "").trim().replace(/[\s\-().]/g, "");
    if (!n) throw new Error("Please enter your mobile number.");
    if (n.indexOf("00") === 0) n = "+" + n.slice(2);
    if (n[0] !== "+") n = MB.settings().countryCode + n.replace(/^0+/, "");
    if (!/^\+[1-9]\d{7,14}$/.test(n)) throw new Error("Please enter a valid mobile number, e.g. 9876543210.");
    return n;
  };
  MB.maskPhone = function (p) { return p.length <= 6 ? p : p.slice(0, 3) + "*".repeat(p.length - 7) + p.slice(-4); };

  MB.passwordProblems = function (pw) {
    var out = [];
    if (pw.length < 8) out.push("at least 8 characters");
    if (!/[A-Za-z]/.test(pw)) out.push("a letter");
    if (!/\d/.test(pw)) out.push("a number");
    return out;
  };

  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function randomHex(bytes) {
    var a = new Uint8Array(bytes); crypto.getRandomValues(a); return hex(a.buffer);
  }
  /** Phone keyboards sometimes add a space after a word; ignore spaces at the start or end. */
  MB.cleanPassword = function (pw) { return String(pw || "").replace(/^\s+|\s+$/g, ""); };
  MB.hashPassword = function (password, saltHex) { return derive(MB.cleanPassword(password), saltHex); };
  function derive(password, saltHex) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("Secure storage is not available in this browser."));
    var salt = saltHex || randomHex(16);
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (key) {
        return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 120000 }, key, 256);
      })
      .then(function (bits) { return { salt: salt, hash: hex(bits) }; });
  }
  MB.sha256 = function (text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(hex);
  };

  // ---------- accounts (stored on this device) ----------
  // Each account is saved under its mobile number (+91...) or, for email-only accounts, its email address.
  MB.users = function () { return load("mb_users", {}); };
  MB.saveUsers = function (u) { save("mb_users", u); };
  MB.currentUser = function () {
    var s = load("mb_session", null) || JSON.parse(sessionStorage.getItem("mb_session") || "null");
    if (!s || (s.expires && s.expires < MB.now())) return null;
    var u = MB.users()[s.phone];
    if (!u || !u.verified) return null;
    // "phone" is the account key (kept for older data); "mobile" is the real mobile number, if any.
    return Object.assign({ phone: s.phone, mobile: u.mobile || (s.phone[0] === "+" ? s.phone : "") }, u, { age: MB.userAge(u) });
  };
  MB.startSession = function (phone, remember) {
    var s = { phone: phone, expires: MB.now() + (remember ? 30 : 1) * 86400000 };
    if (remember) save("mb_session", s); else { remove("mb_session"); sessionStorage.setItem("mb_session", JSON.stringify(s)); }
  };
  MB.logout = function () { remove("mb_session"); sessionStorage.removeItem("mb_session"); };
  /** Age in whole years from a date of birth "YYYY-MM-DD" (or "" if unknown). */
  MB.ageFromDob = function (dob) {
    var m = String(dob || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return "";
    var now = new Date(), age = now.getFullYear() - +m[1];
    if (now.getMonth() + 1 < +m[2] || (now.getMonth() + 1 === +m[2] && now.getDate() < +m[3])) age -= 1;
    return age >= 0 && age <= 130 ? age : "";
  };
  MB.userAge = function (u) { var a = MB.ageFromDob(u && u.dob); return a === "" ? (u && u.age) || "" : a; };
  MB.BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  /** Blood groups that can safely give red cells to this group. */
  MB.canReceiveFrom = function (g) {
    var map = { "O-": ["O-"], "O+": ["O+", "O-"], "A-": ["A-", "O-"], "A+": ["A+", "A-", "O+", "O-"], "B-": ["B-", "O-"], "B+": ["B+", "B-", "O+", "O-"],
      "AB-": ["AB-", "A-", "B-", "O-"], "AB+": MB.BLOOD_GROUPS };
    return map[g] || [];
  };

  // ---------- Firebase Authentication (free Spark plan) ----------
  // Uses Firebase's REST API directly (no SDK), so the app stays small. The Web API key is a
  // public id, not a secret. Email/password accounts + Firebase's free email verification link.
  var FB = "https://identitytoolkit.googleapis.com/v1/accounts:";
  function fbErrorText(code) {
    code = String(code || "");
    if (/EMAIL_EXISTS/.test(code)) return "This email already has a Medibot account. Please log in (or use Forgot password).";
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(code)) return "Wrong email/mobile or password. Tap the eye to check what you typed, or use \"Forgot password\".";
    if (/USER_DISABLED/.test(code)) return "This account has been disabled.";
    if (/TOO_MANY_ATTEMPTS/.test(code)) return "Too many attempts. Please wait a few minutes and try again.";
    if (/WEAK_PASSWORD/.test(code)) return "Password is too weak. Use at least 8 characters with a letter and a number.";
    if (/INVALID_EMAIL/.test(code)) return "Please enter a valid email address.";
    if (/OPERATION_NOT_ALLOWED|PASSWORD_LOGIN_DISABLED/.test(code)) return "Email/Password sign-in is turned off. In Firebase console: Authentication > Sign-in method > Email/Password > Enable.";
    if (/API_KEY|API key not valid|CONFIGURATION_NOT_FOUND/.test(code)) return "The Firebase Web API key is wrong, or Authentication is not set up. Check Settings > Firebase (see readme).";
    if (/TOKEN_EXPIRED|INVALID_ID_TOKEN|INVALID_REFRESH_TOKEN|USER_NOT_FOUND/.test(code)) return "Your sign-in expired. Please log in again.";
    if (/QUOTA|LIMIT/.test(code)) return "Firebase daily email limit reached. Please try again tomorrow.";
    return "Firebase error: " + code;
  }
  function fbCall(path, body, base) {
    var key = MB.settings().firebaseApiKey.trim();
    return fetch((base || FB) + path + "?key=" + encodeURIComponent(key), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: withTimeout(20000)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || j.error) { var e = new Error(fbErrorText(j.error && j.error.message || ("HTTP " + r.status))); e.code = j.error && j.error.message; throw e; }
        return j;
      });
    }, function (e) {
      throw new Error(e && e.name === "AbortError" ? "Firebase did not answer. Check the internet connection." : "No internet connection. Firebase needs internet.");
    });
  }
  MB.firebaseConfigured = function () { return !!MB.settings().firebaseApiKey.trim(); };
  /** Use Firebase when a key is set and the phone is online; otherwise the app works in demo/offline mode. */
  MB.useFirebase = function () { return MB.firebaseConfigured() && MB.isOnline(); };
  MB.fbSignUp = function (email, password, name) {
    return fbCall("signUp", { email: email, password: MB.cleanPassword(password), returnSecureToken: true }).then(function (r) {
      return fbCall("update", { idToken: r.idToken, displayName: name, returnSecureToken: false }).catch(function () {})
        .then(function () { return MB.fbSendVerify(r.idToken); })
        .then(function () { return { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken }; });
    });
  };
  MB.fbSendVerify = function (idToken) { return fbCall("sendOobCode", { requestType: "VERIFY_EMAIL", idToken: idToken }); };
  MB.fbSignIn = function (email, password) {
    return fbCall("signInWithPassword", { email: email, password: password, returnSecureToken: true });
  };
  MB.fbRefresh = function (refreshToken) {
    return fbCall("token", { grant_type: "refresh_token", refresh_token: refreshToken }, "https://securetoken.googleapis.com/v1/")
      .then(function (r) { return { idToken: r.id_token, refreshToken: r.refresh_token }; });
  };
  /** Is the email verified yet? (refreshes the sign-in token if needed). Resolves {verified, idToken, refreshToken, name}. */
  MB.fbCheckVerified = function (tokens) {
    return MB.fbRefresh(tokens.refreshToken).then(function (t) {
      return fbCall("lookup", { idToken: t.idToken }).then(function (r) {
        var u = (r.users || [])[0] || {};
        return { verified: !!u.emailVerified, idToken: t.idToken, refreshToken: t.refreshToken, name: u.displayName || "" };
      });
    });
  };
  /** Change the password using the sign-in saved on this phone (no email needed). */
  MB.fbChangePassword = function (refreshToken, password) {
    return MB.fbRefresh(refreshToken).then(function (t) {
      return fbCall("update", { idToken: t.idToken, password: MB.cleanPassword(password), returnSecureToken: true });
    }).then(function (r) { return { refreshToken: r.refreshToken }; });
  };
  // Mobile numbers: Firebase's free plan cannot send SMS, so a mobile account is stored in Firebase under a
  // made-up address (919876543210@phone.medibot.app) that is never emailed. For accounts with an email,
  // the same address holds a small "link" saying which email belongs to the number, so log in with the
  // mobile number works on any phone.
  MB.phoneEmail = function (phone) { return phone.replace(/\D/g, "") + "@phone.medibot.app"; };
  function linkPassword(phone) { return MB.sha256("medibot-link-v1|" + phone).then(function (h) { return "L" + h.slice(0, 30); }); }
  MB.fbSignUpMobile = function (phone, password, name) {
    return fbCall("signUp", { email: MB.phoneEmail(phone), password: MB.cleanPassword(password), returnSecureToken: true }).catch(function (e) {
      if (/EMAIL_EXISTS/.test(e.code || "")) e.message = "This mobile number already has a Medibot account. Please log in.";
      throw e;
    }).then(function (r) {
      return fbCall("update", { idToken: r.idToken, displayName: "user:" + name, returnSecureToken: false }).catch(function () {})
        .then(function () { return { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken }; });
    });
  };
  /** Reserve the mobile number for an email account. Resolves {idToken} so it can be undone. */
  MB.fbLinkPhone = function (phone, email) {
    return linkPassword(phone).then(function (lp) {
      return fbCall("signUp", { email: MB.phoneEmail(phone), password: lp, returnSecureToken: true });
    }).catch(function (e) {
      if (/EMAIL_EXISTS/.test(e.code || "")) e.message = "This mobile number already has a Medibot account. Please log in.";
      throw e;
    }).then(function (r) {
      return fbCall("update", { idToken: r.idToken, displayName: "link:" + email, returnSecureToken: false }).then(function () { return { idToken: r.idToken }; });
    });
  };
  MB.fbDelete = function (idToken) { return fbCall("delete", { idToken: idToken }).catch(function () {}); };
  /** Which email belongs to this mobile number? Resolves the email, or "" if the number is a mobile-only account. */
  function fbEmailForPhone(phone) {
    return linkPassword(phone).then(function (lp) { return MB.fbSignIn(MB.phoneEmail(phone), lp); }).then(function (r) {
      return fbCall("lookup", { idToken: r.idToken }).then(function (lk) {
        var dn = (((lk.users || [])[0] || {}).displayName || "");
        return dn.indexOf("link:") === 0 ? dn.slice(5) : "";
      });
    }, function (e) { if (/INVALID|NOT_FOUND/.test(e.code || "")) return ""; throw e; });
  }
  MB.fbResetPassword = function (email) { return fbCall("sendOobCode", { requestType: "PASSWORD_RESET", email: email }); };
  MB.fbTest = function (key) {
    var s = MB.settings(); s.firebaseApiKey = key; MB.saveSettings(s);
    return fbCall("signInWithPassword", { email: "connection-test@medibot.invalid", password: "test-password-1", returnSecureToken: true })
      .then(function () { return "ok"; }, function (e) {
        if (/EMAIL_NOT_FOUND|INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|INVALID_EMAIL/.test(e.code || "")) return "ok";
        throw e;
      });
  };

  /** Find a saved account on this phone by mobile number or email. Returns [phoneKey, user] or null. */
  MB.findLocalUser = function (identifier) {
    var users = MB.users(), id = String(identifier || "").trim().toLowerCase();
    if (id.indexOf("@") > 0) {
      for (var k in users) if ((users[k].email || "").toLowerCase() === id || k.toLowerCase() === id) return [k, users[k]];
      return null;
    }
    try {
      var phone = MB.normalizePhone(identifier);
      if (users[phone]) return [phone, users[phone]];
      for (var k2 in users) if (users[k2].mobile === phone) return [k2, users[k2]];
    } catch (e) {}
    return null;
  };

  /** Log in with email or mobile number + password.
   *  Online with Firebase: checked by Firebase (works on any phone). Offline: checked against this phone's saved copy.
   *  Resolves {phone, user} or {needsProfile: {...}}; rejects with .code "NOT_VERIFIED". */
  function variants(password) {
    var clean = MB.cleanPassword(password);
    var flip = clean ? (clean[0] === clean[0].toUpperCase() ? clean[0].toLowerCase() : clean[0].toUpperCase()) + clean.slice(1) : clean;
    return [clean, flip, password].filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  }
  /** Sign in trying what was typed, then the common phone-keyboard slips. Resolves {r, used}. */
  function signInTolerant(email, password) {
    var tries = variants(password);
    function attempt(i) {
      return MB.fbSignIn(email, tries[i]).then(function (r) { return { r: r, used: tries[i] }; }, function (e) {
        if (i + 1 < tries.length && /INVALID/.test(e.code || "")) return attempt(i + 1);
        throw e;
      });
    }
    return attempt(0);
  }
  function rememberOnPhone(found, match, fields) {
    return MB.hashPassword(fields.used).then(function (h) {
      var users = MB.users(), key = found ? found[0] : null;
      if (!key) for (var k in users) if (users[k].uid === fields.uid) key = k;
      var common = { uid: fields.uid, salt: h.salt, hash: h.hash, refreshToken: fields.refreshToken, verified: true, fails: 0, lockedUntil: 0, lastLogin: MB.now() };
      if (!key) return { needsProfile: Object.assign({ name: fields.name || "", email: match.email || "", mobile: match.mobile || "", kind: match.kind }, common) };
      Object.assign(users[key], common, match.email ? { email: match.email } : {});
      MB.saveUsers(users);
      var mob = users[key].mobile || (key[0] === "+" ? key : "");
      if (match.kind === "email" && mob && !users[key].linked) {  // accounts made before 4.4: let the mobile number log in on other phones too
        MB.fbLinkPhone(mob, match.email).then(function () { MB.updateUser(key, { linked: true }); }, function (e) {
          if (/EMAIL_EXISTS/.test(e.code || "")) MB.updateUser(key, { linked: true });
        });
      }
      return { phone: key, user: users[key] };
    });
  }
  function emailLogin(email, password, found) {
    return signInTolerant(email, password).then(function (x) {
      return fbCall("lookup", { idToken: x.r.idToken }).then(function (lk) {
        var info = (lk.users || [])[0] || {};
        if (!info.emailVerified) {
          var err = new Error("Please verify your email first: open the Firebase email we sent to " + email + " and tap the link.");
          err.code = "NOT_VERIFIED"; err.tokens = { idToken: x.r.idToken, refreshToken: x.r.refreshToken }; err.email = email; throw err;
        }
        return rememberOnPhone(found, { email: email, kind: "email" }, { uid: x.r.localId, used: x.used, refreshToken: x.r.refreshToken, name: info.displayName || "" });
      });
    });
  }
  MB.login = function (identifier, password) {
    var found = MB.findLocalUser(identifier), id = String(identifier || "").trim();
    if (!MB.useFirebase() || (found && !found[1].uid)) {  // offline, demo mode, or an account made in demo mode
      if (!found) return Promise.reject(new Error(MB.firebaseConfigured() && !MB.isOnline() ?
        "You are offline. The first log in on this phone needs internet." : "No account with this mobile number or email on this phone. Please create an account first."));
      return localLogin(found[0], password).then(function (u) { return { phone: found[0], user: u }; });
    }
    if (id.indexOf("@") > 0) return emailLogin(id, password, found);
    var phone;
    try { phone = MB.normalizePhone(id); } catch (e) { return Promise.reject(e); }
    if (found && found[1].email && found[1].kind !== "mobile") return emailLogin(found[1].email, password, found);
    // Not on this phone yet (or a mobile-only account): ask Firebase which account the number belongs to.
    return fbEmailForPhone(phone).then(function (email) {
      if (email) return emailLogin(email, password, found);
      return signInTolerant(MB.phoneEmail(phone), password).then(function (x) {
        return fbCall("lookup", { idToken: x.r.idToken }).then(function (lk) {
          var dn = (((lk.users || [])[0] || {}).displayName || "").replace(/^user:/, "");
          return rememberOnPhone(found, { mobile: phone, kind: "mobile" }, { uid: x.r.localId, used: x.used, refreshToken: x.r.refreshToken, name: dn });
        });
      }, function (e) {
        if (/INVALID|NOT_FOUND/.test(e.code || "")) e.message = "Wrong mobile number or password. Tap the eye to check what you typed, or use \"Forgot password\".";
        throw e;
      });
    });
  };
  function localLogin(phone, password) {
    var users = MB.users(), u = users[phone];
    if (u && u.lockedUntil > MB.now()) {
      return Promise.reject(new Error("Too many failed attempts. Try again in " +
        Math.ceil((u.lockedUntil - MB.now()) / 60000) + " minute(s) or reset your password."));
    }
    if (!u || !u.verified) return Promise.reject(new Error("No account with this mobile number on this phone. Please create an account first."));
    // Accept what the user typed, plus the common phone-keyboard slips: an automatic capital first
    // letter (or a missing one), and spaces saved by older versions.
    var tries = variants(password);
    function tryNext(i) {
      if (i >= tries.length) return Promise.resolve(false);
      return derive(tries[i], u.salt).then(function (h) { return h.hash === u.hash || tryNext(i + 1); });
    }
    return tryNext(0).then(function (ok) {
      users = MB.users(); u = users[phone];
      if (!ok) {
        u.fails = (u.fails || 0) + 1;
        if (u.fails >= 5) { u.lockedUntil = MB.now() + 15 * 60000; u.fails = 0; }
        MB.saveUsers(users);
        throw new Error("Incorrect password. Check Caps Lock, or tap the eye to see what you typed. Forgot it? Use \"Forgot password\".");
      }
      u.fails = 0; u.lockedUntil = 0; u.lastLogin = MB.now();
      MB.saveUsers(users);
      return u;
    });
  };

  // ---------- OTP ----------
  var OTP_TTL = 5 * 60000, OTP_ATTEMPTS = 5, RESEND_WAIT = 60000;

  MB.pending = function () { return JSON.parse(sessionStorage.getItem("mb_pending") || "null"); };
  MB.setPending = function (p) { if (p) sessionStorage.setItem("mb_pending", JSON.stringify(p)); else sessionStorage.removeItem("mb_pending"); };
  MB.resendWait = function () {
    var p = MB.pending(); return p && p.sentAt ? Math.max(0, Math.ceil((p.sentAt + RESEND_WAIT - MB.now()) / 1000)) : 0;
  };

  function otpMessage(code) {
    return "Your Medibot verification code is " + code + ". It expires in 5 minutes. Do not share it with anyone.";
  }
  function withTimeout(ms) {
    var c = new AbortController(); setTimeout(function () { c.abort(); }, ms); return c.signal;
  }
  // ---------- real SMS codes with Fast2SMS (India, paid per SMS) ----------
  var F2S = "https://www.fast2sms.com/dev/";
  function f2sPost(path, key, data) {
    // On Android, CapacitorHttp sends this natively (no CORS). A PC browser usually blocks it: use the Python server there.
    return fetch(F2S + path, {
      method: "POST", signal: withTimeout(15000),
      headers: { authorization: key, "Content-Type": "application/x-www-form-urlencoded", "cache-control": "no-cache" },
      body: new URLSearchParams(data || {}).toString()
    }).then(function (r) {
      return r.text().then(function (t) {
        var b = {}; try { b = JSON.parse(t); } catch (e) {}
        if (!r.ok || b.return === false) {
          var m = b.message; if (Array.isArray(m)) m = m.join(" ");
          throw new Error("Fast2SMS: " + (m || ("error " + r.status)));
        }
        return b;
      });
    }, function (err) {
      throw new Error(err && err.name === "AbortError" ? "Fast2SMS did not answer in time. Check the internet and try again." :
        "Could not reach Fast2SMS. Check the internet. (On a PC browser SMS is blocked; it works in the Android app.)");
    });
  }
  MB.smsReady = function (phone) {
    var s = MB.settings();
    return !!s.fast2smsKey && MB.isOnline() && (!phone || String(phone).indexOf("+91") === 0);
  };
  MB.sendSms = function (phone, code) {
    var s = MB.settings(), num = String(phone).replace(/^\+91/, "");
    var data = s.fast2smsRoute === "otp" ? { route: "otp", variables_values: code, numbers: num } :
      { route: "q", message: otpMessage(code), language: "english", flash: "0", numbers: num };
    return f2sPost("bulkV2", s.fast2smsKey, data);
  };
  MB.smsBalance = function (key) {
    return f2sPost("wallet", key, {}).then(function (b) { return b.wallet != null ? String(b.wallet) : "?"; });
  };

  // purpose "register" = demo email code shown on screen; "sms-register" / "sms-reset" = real SMS to the mobile number.
  // Email accounts use Firebase's free links instead. Pending codes live in sessionStorage as a hash only.
  MB.sendOtp = function (phone, purpose, extra) {
    var p = MB.pending();
    if (p && p.phone === phone && p.purpose === purpose && MB.resendWait() > 0) {
      return Promise.reject(new Error("Please wait " + MB.resendWait() + " seconds before requesting another code."));
    }
    var a = new Uint32Array(1); crypto.getRandomValues(a);
    var code = String(a[0] % 1000000).padStart(6, "0");
    var s = MB.settings(), email = extra && extra.email, sms = purpose.indexOf("sms-") === 0;
    var send = sms ? MB.sendSms(phone, code) : Promise.resolve();
    return send.then(function () { return MB.sha256(phone + "|" + purpose + "|" + code); }).then(function (h) {
        var pending = Object.assign({}, extra || {}, {
          phone: phone, email: email || null, purpose: purpose, otpHash: h, expires: MB.now() + OTP_TTL, attempts: 0, sentAt: MB.now(),
          mode: sms ? "sms" : "screen", shownCode: !sms && s.showOtpOnScreen ? code : null
        });
        MB.setPending(pending);
        return { mode: pending.mode };
      });
  };

  MB.verifyOtp = function (code) {
    var p = MB.pending();
    if (!p) return Promise.reject(new Error("No active code. Please start again."));
    if (p.expires < MB.now()) return Promise.reject(new Error("This code has expired. Please request a new one."));
    if (p.attempts >= OTP_ATTEMPTS) return Promise.reject(new Error("Too many wrong attempts. Please request a new code."));
    return MB.sha256(p.phone + "|" + p.purpose + "|" + String(code || "").trim()).then(function (h) {
      if (h !== p.otpHash) {
        p.attempts += 1; MB.setPending(p);
        var left = OTP_ATTEMPTS - p.attempts;
        throw new Error(left > 0 ? "Incorrect code. " + left + " attempt(s) left." : "Too many wrong attempts. Please request a new code.");
      }
      return p;
    });
  };

  // ---------- patients (the account holder + family members) ----------
  MB.patients = function (user) {
    var self = { id: "self", name: user.name, age: MB.userAge(user), dob: user.dob || "", gender: user.gender || "", blood: user.blood || "",
      address: user.address || "", photo: user.photo || "", relation: "Self" };
    return [self].concat(load("mb_family_" + user.phone, []).map(function (p) { return Object.assign({}, p, { age: MB.userAge(p) }); }));
  };
  MB.saveFamily = function (user, list) { save("mb_family_" + user.phone, list.filter(function (p) { return p.id !== "self"; })); };
  MB.activePatient = function (user) {
    var id = load("mb_active_" + user.phone, "self"), list = MB.patients(user);
    return list.filter(function (p) { return p.id === id; })[0] || list[0];
  };
  MB.setActivePatient = function (user, id) { save("mb_active_" + user.phone, id); };
  MB.updateUser = function (phone, fields) {
    var users = MB.users(); Object.assign(users[phone], fields); MB.saveUsers(users);
  };
  MB.initials = function (name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  };
  MB.patientLabel = function (p) {
    return [p.age ? p.age + " yrs" : "", p.gender || ""].filter(Boolean).join(", ");
  };

  // ---------- chats (per person, on this device) ----------
  // Every person (the account holder and each family member) has their own list of conversations:
  // [{id, title, at, updated, msgs: [{role, content, at, ...}]}], newest first.
  function chatsKey(acct, pid) { return "mb_chats_" + acct + (pid && pid !== "self" ? "_" + pid : ""); }
  function oldKey(acct, pid) { return "mb_chat_" + acct + (pid && pid !== "self" ? "_" + pid : ""); }
  MB.chats = function (acct, pid) {
    var list = load(chatsKey(acct, pid), null);
    if (!list) {  // move the single conversation kept by older versions into the new list
      var old = load(oldKey(acct, pid), []);
      list = old.length ? [{ id: "c" + (old[0].at || MB.now()).toString(36), title: titleFor(old), at: old[0].at || MB.now(), updated: old[old.length - 1].at || MB.now(), msgs: old }] : [];
      if (old.length) { save(chatsKey(acct, pid), list); remove(oldKey(acct, pid)); }
    }
    return list;
  };
  function titleFor(msgs) {
    var q = msgs.filter(function (m) { return m.role === "user"; })[0];
    var t = q ? q.content.replace(/\s+/g, " ").trim() : "New chat";
    return t.length > 60 ? t.slice(0, 57) + "…" : t;
  }
  MB.saveChats = function (acct, pid, list) {
    list = list.filter(function (c) { return c.msgs && c.msgs.length; }).sort(function (a, b) { return b.updated - a.updated; }).slice(0, 100);
    save(chatsKey(acct, pid), list);
  };
  MB.getChat = function (acct, pid, id) { return MB.chats(acct, pid).filter(function (c) { return c.id === id; })[0] || null; };
  MB.newChatId = function () { return "c" + MB.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); };
  MB.saveChat = function (acct, pid, chat) {
    chat.title = titleFor(chat.msgs); chat.updated = MB.now(); chat.at = chat.at || MB.now();
    MB.saveChats(acct, pid, [chat].concat(MB.chats(acct, pid).filter(function (c) { return c.id !== chat.id; })));
  };
  MB.deleteChat = function (acct, pid, id) { MB.saveChats(acct, pid, MB.chats(acct, pid).filter(function (c) { return c.id !== id; })); };
  /** Remove messages in a time range from every chat of this person: "today", "lastmonth" (the previous calendar month) or "all". */
  MB.clearChats = function (acct, pid, range) {
    if (range === "all") { remove(chatsKey(acct, pid)); remove(oldKey(acct, pid)); return; }
    var now = new Date(), from, to;
    if (range === "today") { from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); to = Infinity; }
    else { from = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(); to = new Date(now.getFullYear(), now.getMonth(), 1).getTime(); }
    MB.saveChats(acct, pid, MB.chats(acct, pid).map(function (c) {
      c.msgs = c.msgs.filter(function (m) { var t = m.at || c.at; return !(t >= from && t < to); });
      if (c.msgs.length) c.updated = c.msgs[c.msgs.length - 1].at || c.updated;
      return c;
    }));
  };
  /** All questions this person asked recently (for the home screen). */
  MB.recentQuestions = function (acct, pid, n) {
    var out = [];
    MB.chats(acct, pid).forEach(function (c) { c.msgs.forEach(function (m) { if (m.role === "user") out.push({ chat: c.id, q: m.content, at: m.at || c.updated }); }); });
    return out.sort(function (a, b) { return b.at - a.at; }).slice(0, n || 3);
  };
  // Kept for older screens: the newest conversation's messages.
  MB.history = function (acct, pid) { var c = MB.chats(acct, pid)[0]; return c ? c.msgs : []; };
  MB.saveHistory = function (acct, msgs, pid) { if (!msgs.length) MB.clearChats(acct, pid, "all"); };

  // ---------- saved passwords (opt-in, this phone only) ----------
  // The password is encrypted with a random key that never leaves this phone. Anyone holding the
  // unlocked phone can still use it to log in, which is the point of the feature.
  function deviceKey() {
    var raw = load("mb_device_key", null);
    if (!raw) { raw = randomHex(32); save("mb_device_key", raw); }
    var bytes = new Uint8Array(raw.match(/../g).map(function (h) { return parseInt(h, 16); }));
    return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  MB.savedLogins = function () { return load("mb_saved_logins", []); };
  MB.rememberLogin = function (id, password, key) {
    var iv = new Uint8Array(12); crypto.getRandomValues(iv);
    return deviceKey().then(function (k) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(password)); })
      .then(function (ct) {
        var list = MB.savedLogins().filter(function (x) { return x.key !== key; });
        list.unshift({ id: id, key: key, iv: hex(iv.buffer), ct: hex(ct), at: MB.now() });
        save("mb_saved_logins", list.slice(0, 6));
      }).catch(function () {});
  };
  MB.forgetLogin = function (key) { save("mb_saved_logins", MB.savedLogins().filter(function (x) { return x.key !== key; })); };
  MB.savedPassword = function (entry) {
    function bytes(h) { return new Uint8Array(h.match(/../g).map(function (x) { return parseInt(x, 16); })); }
    return deviceKey().then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(entry.iv) }, k, bytes(entry.ct)); })
      .then(function (pt) { return new TextDecoder().decode(pt); });
  };

  // ---------- storage used / clear cache ----------
  MB.storageUsed = function () {
    var n = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("mb_") === 0) n += k.length + (localStorage.getItem(k) || "").length; } } catch (e) {}
    return n * 2;  // bytes (text is stored as UTF-16)
  };
  /** Clears temporary files only (offline web cache, drafts, half-finished sign-ups). Accounts and chats stay. */
  MB.clearCache = function () {
    ["mb_reg_draft", "mb_pending", "mb_complete", "mb_prefill", "mb_last_phone"].forEach(function (k) { sessionStorage.removeItem(k); });
    var s = MB.settings(); s.groqModel = ""; MB.saveSettings(s);  // choose the AI model again next time
    var jobs = [];
    if (window.caches && caches.keys) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
    return Promise.all(jobs).catch(function () {});
  };

  // ---------- saved diseases ----------
  MB.saved = function (phone) { return load("mb_saved_" + phone, []); };
  MB.toggleSaved = function (phone, slug) {
    var list = MB.saved(phone), i = list.indexOf(slug);
    if (i >= 0) list.splice(i, 1); else list.unshift(slug);
    save("mb_saved_" + phone, list); return i < 0;
  };
})();
