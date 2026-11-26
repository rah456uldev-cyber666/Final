/* Medibot app: screens and navigation. Every visible text goes through T() so it can be shown in
   English, Hindi or Odia (see js/i18n.js). */
(function () {
  "use strict";
  var MB = window.MB, E = MB.escape, I = MB.icon, T = MB.t;
  var view = document.getElementById("view"), tabbar = document.getElementById("tabbar"), topbar = document.getElementById("topbar");
  var flashMsg = null;

  MB.applyTheme();

  // ---------- small helpers ----------
  function flash(text, kind) { flashMsg = { text: text, kind: kind || "info" }; }
  function takeFlash() {
    if (!flashMsg) return "";
    var h = '<div class="flash ' + flashMsg.kind + '" role="status">' + E(flashMsg.text) + "</div>"; flashMsg = null; return h;
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function $(sel) { return view.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(view.querySelectorAll(sel)); }
  function on(sel, ev, fn) { var el = $(sel); if (el) el.addEventListener(ev, fn); }
  function busy(btn, yes, label) { if (!btn) return; btn.disabled = yes; if (label) btn.textContent = label; }
  function first(name) { return String(name || "").trim().split(/\s+/)[0] || ""; }
  function chrome(showTabs, showTop) {
    tabbar.hidden = !showTabs; topbar.hidden = showTop === false;
    document.body.classList.toggle("no-tabs", !showTabs);
  }
  function disclaimer() {
    return '<p class="disclaimer">' + T("Medibot gives general information from The Gale Encyclopedia of Medicine. It is not medical advice or a diagnosis. In an emergency, call 108.") + "</p>";
  }
  function warningTag() { return '<div class="warning-tag">' + I("sos") + "<span>" + E(T(MB.WARNING_TAG)) + "</span></div>"; }
  function treatmentDisclaimer() {
    return '<div class="med-disclaimer"><strong>' + T("Disclaimer:") + "</strong> " +
      T("These results are based on sources (The Gale Encyclopedia of Medicine). For better diagnosis, consult a doctor. Do not start or stop any medicine without medical advice.") + "</div>";
  }
  function pwField(name, label, auto) {
    return '<label class="field">' + E(label) + '<div class="pw-wrap"><input type="password" name="' + name + '" required minlength="' + (auto === "current-password" ? 1 : 8) +
      '" autocomplete="' + auto + '" autocapitalize="none" autocorrect="off" spellcheck="false"><button type="button" class="pw-toggle" aria-label="' + T("Show password") + '">' + I("eye") + "</button></div></label>";
  }
  function wirePwToggles() {
    $$(".pw-toggle").forEach(function (b) {
      b.addEventListener("click", function () {
        var input = b.parentNode.querySelector("input"), show = input.type === "password";
        input.type = show ? "text" : "password";
        b.innerHTML = I(show ? "eyeOff" : "eye");
        b.setAttribute("aria-label", T(show ? "Hide password" : "Show password"));
      });
    });
  }
  function seg(name, items, value) {
    return '<div class="seg">' + items.map(function (g) {
      var v = Array.isArray(g) ? g[0] : g, l = Array.isArray(g) ? g[1] : T(g);
      return '<label><input type="radio" name="' + name + '" value="' + E(v) + '"' + (value === v ? " checked" : "") + "><span>" + E(l) + "</span></label>";
    }).join("") + "</div>";
  }
  function genderSeg(name, value) { return seg(name, ["Male", "Female", "Other"], value); }
  function bloodSelect(name, value) {
    return '<select name="' + name + '"><option value="">' + T("Don't know") + "</option>" + MB.BLOOD_GROUPS.map(function (g) {
      return '<option value="' + g + '"' + (value === g ? " selected" : "") + ">" + g + "</option>"; }).join("") + "</select>";
  }

  // ----- date of birth (day / month / year) -> age -----
  function dobFields(prefix, dob) {
    var m = String(dob || "").match(/^(\d{4})-(\d{2})-(\d{2})$/) || [], y = new Date().getFullYear(), opts = function (from, to, sel, labels) {
      var h = ""; for (var i = from; from <= to ? i <= to : i >= to; from <= to ? i++ : i--) h += '<option value="' + i + '"' + (+sel === i ? " selected" : "") + ">" + (labels ? labels[i - 1] : i) + "</option>"; return h;
    };
    return '<div class="field"><span class="flabel">' + T("Date of birth") + '</span><div class="dob" data-dob="' + prefix + '">' +
      '<select name="' + prefix + 'D" aria-label="' + T("Day") + '"><option value="">' + T("Day") + "</option>" + opts(1, 31, m[3]) + "</select>" +
      '<select name="' + prefix + 'M" aria-label="' + T("Month") + '"><option value="">' + T("Month") + "</option>" + opts(1, 12, m[2], MB.monthNames()) + "</select>" +
      '<select name="' + prefix + 'Y" aria-label="' + T("Year") + '"><option value="">' + T("Year") + "</option>" + opts(y, y - 110, m[1]) + "</select></div>" +
      '<small class="hint age-out" data-age="' + prefix + '"></small></div>';
  }
  function readDob(f, prefix) {
    var d = f[prefix + "D"].value, mo = f[prefix + "M"].value, y = f[prefix + "Y"].value;
    if (!d || !mo || !y) return "";
    var date = new Date(+y, +mo - 1, +d);
    if (date.getMonth() !== +mo - 1 || date > new Date()) return "invalid";
    return y + "-" + ("0" + mo).slice(-2) + "-" + ("0" + d).slice(-2);
  }
  function wireDob(f) {
    Array.prototype.forEach.call(f.querySelectorAll(".dob"), function (box) {
      var prefix = box.dataset.dob, out = f.querySelector('[data-age="' + prefix + '"]');
      function show() {
        var dob = readDob(f, prefix), age = dob && dob !== "invalid" ? MB.ageFromDob(dob) : "";
        out.textContent = dob === "invalid" ? T("Please choose a real date.") : age !== "" ? T("Age: {n} years", { n: age }) : "";
      }
      box.addEventListener("change", show); show();
    });
  }

  // ----- profile photo: camera or gallery, shrunk to a small JPEG kept on the phone -----
  function avatar(p, cls) {
    p = p || {};
    if (p.photo) return '<img class="avatar ' + (cls || "") + '" src="' + E(p.photo) + '" alt="">';
    var n = 0, s = String(p.name || "?"); for (var i = 0; i < s.length; i++) n = (n + s.charCodeAt(i)) % 6;
    return '<span class="avatar t' + n + " " + (cls || "") + '">' + E(MB.initials(p.name)) + "</span>";
  }
  function photoPicker(photo, name) {
    return '<div class="photo-pick"><span class="photo-prev">' + avatar({ photo: photo, name: name || "?" }, "xl") + "</span><div>" +
      '<span class="flabel">' + T("Profile photo") + ' <small class="muted">(' + T("optional") + ")</small></span>" +
      '<div class="row wrap"><label class="button mini">' + I("camera") + " " + T("Take photo") + '<input type="file" accept="image/*" capture="user" hidden data-photo></label>' +
      '<label class="button mini">' + I("image") + " " + T("Gallery") + '<input type="file" accept="image/*" hidden data-photo></label>' +
      '<button type="button" class="link small" data-photo-clear' + (photo ? "" : " hidden") + ">" + T("Remove") + "</button></div></div>" +
      '<input type="hidden" name="photo" value="' + E(photo || "") + '"></div>';
  }
  function shrinkImage(file) {
    return new Promise(function (ok, fail) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var S = 192, c = document.createElement("canvas"), side = Math.min(img.width, img.height);
        c.width = c.height = S;
        c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
        URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); fail(new Error(T("That file is not a picture."))); };
      img.src = url;
    });
  }
  function wirePhoto(root) {
    root = root || view;
    var hidden = root.querySelector('input[name="photo"]'); if (!hidden) return;
    var prev = root.querySelector(".photo-prev"), clear = root.querySelector("[data-photo-clear]");
    Array.prototype.forEach.call(root.querySelectorAll("[data-photo]"), function (inp) {
      inp.addEventListener("change", function () {
        if (!inp.files || !inp.files[0]) return;
        shrinkImage(inp.files[0]).then(function (data) {
          hidden.value = data; prev.innerHTML = avatar({ photo: data }, "xl"); clear.hidden = false;
        }, function (e) { prev.insertAdjacentHTML("afterend", '<small class="hint">' + E(e.message) + "</small>"); });
        inp.value = "";
      });
    });
    clear.addEventListener("click", function () { hidden.value = ""; prev.innerHTML = avatar({ name: "?" }, "xl"); clear.hidden = true; });
  }

  // ----- confirmation sheet (instead of the browser's confirm box) -----
  function confirmSheet(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      var m = document.createElement("div");
      m.className = "modal";
      m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><h2>' + E(title) + "</h2>" + (text ? '<p class="muted">' + E(text) + "</p>" : "") +
        '<div class="row"><button type="button" class="grow" data-no>' + T("Cancel") + '</button><button type="button" class="grow ' + (danger ? "danger" : "primary") + '" data-yes>' + E(okLabel) + "</button></div></div>";
      document.body.appendChild(m);
      function done(v) { m.remove(); resolve(v); }
      m.addEventListener("click", function (e) {
        if (e.target === m || e.target.closest("[data-no]")) done(false);
        else if (e.target.closest("[data-yes]")) done(true);
      });
    });
  }

  // ---------- emergency call (the misuse warning is shown only inside the app) ----------
  function callSheet(number, name) {
    var m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><h2>' + T("Call {name} ({num})?", { name: T(name), num: number }) + "</h2>" +
      '<p class="muted">' + T("Tell the operator the patient's condition and your exact location.") + "</p>" + warningTag() +
      '<div class="row"><button type="button" id="cancelCall" class="grow">' + T("Cancel") + '</button>' +
      '<a class="button danger grow" href="tel:' + E(number) + '" id="callNow">' + I("phone") + " " + T("Call {num} now", { num: number }) + "</a></div></div>";
    document.body.appendChild(m);
    function close() { m.remove(); }
    m.addEventListener("click", function (e) { if (e.target === m) close(); });
    m.querySelector("#cancelCall").addEventListener("click", close);
    m.querySelector("#callNow").addEventListener("click", function () { setTimeout(close, 300); });
  }
  MB.callSheet = callSheet;
  document.getElementById("sosTop").addEventListener("click", function () { callSheet("108", "Ambulance"); });

  // ---------- top bar status + tab bar ----------
  function updateStatus() {
    var s = MB.settings(), el = document.getElementById("status"), online = MB.isOnline();
    el.className = "status " + (online ? "on" : "off");
    el.innerHTML = '<span class="dot"></span>' + T(online ? "Online" : "Offline");
    el.title = online && s.groqKey ? T("Online AI answers") : T("Answers from the encyclopedia on this phone");
  }
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  document.getElementById("status").addEventListener("click", function () { go("#/settings"); });
  function buildTabs() {
    var tabs = [["home", "home", "Home"], ["chat", "chat", "Ask"], ["library", "book", "Library"], ["emergency", "sos", "Emergency"], ["profile", "user", "Profile"]];
    tabbar.innerHTML = tabs.map(function (t) {
      return '<a href="#/' + t[0] + '" data-tab="' + t[0] + '"' + (t[0] === "emergency" ? ' class="sos"' : "") + ">" + I(t[1]) + "<span>" + T(t[2]) + "</span></a>";
    }).join("");
    document.getElementById("sosTop").textContent = T("SOS");
    document.documentElement.lang = MB.lang();
  }
  function langSwitch() {
    var cur = MB.lang();
    return '<div class="lang-switch" role="group" aria-label="Language">' + MB.LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l[0] + '" class="' + (l[0] === cur ? "on" : "") + '">' + l[1] + "</button>"; }).join("") + "</div>";
  }
  function wireLang(again) {
    $$("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { MB.setLang(b.dataset.lang); buildTabs(); updateStatus(); again(); });
    });
  }

  // ======================= WELCOME =======================
  function welcomeView() {
    chrome(false, false);
    view.className = "";
    var feats = [["chat", "Ask health questions", "Clear, point-by-point answers with sources"],
      ["wifiOff", "Works without internet", "The encyclopedia and 203 diseases are stored on your phone"],
      ["sos", "Emergency help", "One tap to call 108, plus first-aid guides"],
      ["lock", "Private", "Your details and chats stay on this phone"]];
    view.innerHTML = '<div class="welcome">' + langSwitch() +
      '<img class="logo-full" src="icons/logo-full.png" alt="MediBot">' +
      '<p class="lead">' + T("Health answers you can trust, in your language. Online or offline.") + "</p>" +
      '<ul class="feature-list">' + feats.map(function (f) {
        return '<li><span class="fi">' + I(f[0]) + "</span><span><b>" + T(f[1]) + "</b><small>" + T(f[2]) + "</small></span></li>"; }).join("") + "</ul>" +
      '<div class="welcome-actions"><a class="button primary block" href="#/register">' + T("Create free account") + "</a>" +
      '<a class="button block" href="#/login">' + T("I already have an account") + "</a>" +
      '<p class="fine">' + T("For education only. Not a substitute for a doctor.") + "</p></div></div>";
    wireLang(welcomeView);
  }

  // ======================= AUTH =======================
  function authShell(title, sub, body, opts) {
    chrome(false, true);
    view.className = "container";
    return '<div class="narrow"><div class="auth-head">' + (opts && opts.lang ? langSwitch() : "") + "<h1>" + E(title) + "</h1>" + (sub ? '<p class="muted">' + sub + "</p>" : "") + "</div>" +
      takeFlash() + '<div class="card">' + body + "</div></div>";
  }
  function newUserRecord(d, extra) {
    return Object.assign({ name: d.name, email: d.email || "", mobile: d.mobile || "", kind: d.kind, dob: d.dob || "", gender: d.gender, blood: d.blood || "",
      address: d.address, photo: d.photo || "", salt: d.salt, hash: d.hash, verified: true, fails: 0, lockedUntil: 0, createdAt: MB.now() }, extra || {});
  }
  function accountKey(d) { return d.mobile || String(d.email || "").toLowerCase(); }
  function finishLogin(key, id, password, remember, savePw) {
    MB.startSession(key, remember);
    sessionStorage.setItem("mb_last_phone", id);
    if (savePw && password) MB.rememberLogin(id, password, key); else if (!savePw) MB.forgetLogin(key);
  }

  function registerView() {
    var d = JSON.parse(sessionStorage.getItem("mb_reg_draft") || "{}"), how = d.how || "mobile";
    view.innerHTML = authShell(T("Create your account"), T("It takes a minute. You can sign up with your mobile number or your email."),
      '<form id="f" autocomplete="on" novalidate>' +
      '<div class="field"><span class="flabel">' + T("Sign up with") + "</span>" + seg("how", [["mobile", T("Mobile number")], ["email", T("Email")]], how) + "</div>" +
      '<label class="field">' + T("Full name") + '<input name="name" required maxlength="80" autocomplete="name" value="' + E(d.name || "") + '"></label>' +
      '<label class="field" id="mobileF"><span data-mlabel>' + T(how === "email" ? "Mobile number (optional)" : "Mobile number") + "</span>" +
      '<input name="phone" inputmode="tel" autocomplete="tel" placeholder="98765 43210" value="' + E(d.phone || "") + '"></label>' +
      '<label class="field" id="emailF"' + (how === "email" ? "" : " hidden") + ">" + T("Email address") +
      '<input name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="you@gmail.com" value="' + E(d.email || "") + '">' +
      '<small class="hint">' + T("We email you a link to confirm it.") + "</small></label>" +
      pwField("pw", T("Password"), "new-password") + '<small class="hint" style="margin-top:-.6rem">' + T("At least 8 characters, with a letter and a number.") + "</small>" +
      pwField("pw2", T("Confirm password"), "new-password") +
      '<h3 class="form-sec">' + T("Your health details") + "</h3>" + photoPicker(d.photo, d.name) +
      dobFields("dob", d.dob) +
      '<div class="field"><span class="flabel">' + T("Gender") + "</span>" + genderSeg("gender", d.gender) + "</div>" +
      '<label class="field">' + T("Blood group") + bloodSelect("blood", d.blood) + '<small class="hint">' + T("Helps in an emergency if you need blood.") + "</small></label>" +
      '<label class="field">' + T("Address") + '<textarea name="address" rows="2" maxlength="200" placeholder="' + T("House, street, village or city, PIN") + '">' + E(d.address || "") + "</textarea></label>" +
      '<label class="check"><input type="checkbox" name="agree"><span>' + T("I understand Medibot gives general information and is not a doctor.") + "</span></label>" +
      '<button class="primary block" id="go">' + T("Create account") + "</button></form>" +
      '<p class="center muted" style="margin:1rem 0 0">' + T("Already registered?") + ' <a href="#/login">' + T("Log in") + "</a></p>", { lang: true });
    wirePwToggles(); wirePhoto(); wireLang(registerView);
    var f = $("#f"); wireDob(f);
    function draft() {
      return { how: f.how.value, name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), dob: readDob(f, "dob"),
        gender: f.gender.value || "", blood: f.blood.value, address: f.address.value.trim(), photo: f.photo.value };
    }
    $$('input[name="how"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var em = f.how.value === "email";
        $("#emailF").hidden = !em; $("[data-mlabel]").textContent = T(em ? "Mobile number (optional)" : "Mobile number");
      });
    });
    on("#f", "submit", function (e) {
      e.preventDefault();
      var dr = draft(), errors = [], phone = "", byEmail = dr.how === "email";
      var keep = Object.assign({}, dr); if ((keep.photo || "").length > 60000) keep.photo = "";
      sessionStorage.setItem("mb_reg_draft", JSON.stringify(keep));
      if (dr.name.length < 2) errors.push(T("Please enter your full name."));
      if (!byEmail || dr.phone) { try { phone = MB.normalizePhone(dr.phone); } catch (err) { errors.push(T(err.message)); } }
      if (byEmail && !MB.validEmail(dr.email)) errors.push(T("Please enter a valid email address."));
      var probs = MB.passwordProblems(f.pw.value);
      if (probs.length) errors.push(T("Password needs {list}.", { list: probs.map(T).join(", ") }));
      if (f.pw.value !== f.pw2.value) errors.push(T("Passwords do not match."));
      if (!dr.dob || dr.dob === "invalid") errors.push(T("Please choose your date of birth."));
      if (!dr.gender) errors.push(T("Please choose a gender."));
      if (!f.agree.checked) errors.push(T("Please tick the box to confirm you understand Medibot is not a doctor."));
      var key = phone || dr.email.toLowerCase();
      if (MB.users()[key] && MB.users()[key].verified) errors.push(T("This account is already on this phone. Please log in."));
      if (errors.length) { flash(errors.join(" "), "error"); return registerView(); }
      busy($("#go"), true, T("Creating account…"));
      var pw = f.pw.value;
      MB.hashPassword(pw).then(function (h) {
        var details = { name: dr.name, email: byEmail ? dr.email : "", mobile: phone, kind: byEmail ? "email" : "mobile", dob: dr.dob, gender: dr.gender,
          blood: dr.blood, address: dr.address, photo: dr.photo, salt: h.salt, hash: h.hash };
        if (!byEmail) {
          // Mobile number: with a Fast2SMS key a real 6-digit SMS code confirms the number first.
          if (MB.smsReady(phone)) {
            return MB.sendOtp(phone, "sms-register", details).then(function () {
              sessionStorage.setItem("mb_reg_pw", pw); go("#/verify");
            });
          }
          return createMobileAccount(details, pw, "device");
        }
        if (MB.useFirebase()) {
          // Email: Firebase creates the account and emails a verification link (free). A given mobile number is reserved too.
          var link = phone ? MB.fbLinkPhone(phone, dr.email) : Promise.resolve(null);
          return link.then(function (lk) {
            return MB.fbSignUp(dr.email, pw, dr.name).catch(function (err) { if (lk) MB.fbDelete(lk.idToken); throw err; });
          }).then(function (t) {
            MB.setPending(Object.assign(details, { purpose: "firebase", uid: t.uid, refreshToken: t.refreshToken, sentAt: MB.now(), linked: !!phone }));
            sessionStorage.setItem("mb_reg_pw", pw);
            go("#/checkemail");
          });
        }
        return MB.sendOtp(key, "register", details).then(function () { go("#/verify"); });
      }).catch(function (err) { flash(T(err.message), "error"); registerView(); });
    });
  }

  // Creates a mobile-number account (on Firebase too when it is set up) and logs in.
  function createMobileAccount(details, pw, how) {
    var phone = details.mobile;
    var made = MB.useFirebase() ? MB.fbSignUpMobile(phone, pw, details.name) : Promise.resolve({});
    return made.then(function (t) {
      var users = MB.users();
      users[phone] = newUserRecord(details, { uid: t.uid || "", refreshToken: t.refreshToken || "", verifiedBy: how === "sms" ? "sms" : t.uid ? "mobile" : "device" });
      MB.saveUsers(users); sessionStorage.removeItem("mb_reg_draft"); sessionStorage.removeItem("mb_reg_pw");
      finishLogin(phone, phone, pw, true, true);
      flash(T("Your account is ready."), "success"); go("#/home");
    });
  }

  // A real code sent by SMS (Fast2SMS): mobile sign-up, forgot password, change password.
  function codeVerifyView() {
    var p = MB.pending(), reg = p.purpose === "sms-register", to = MB.maskPhone(p.phone);
    view.innerHTML = authShell(T(reg ? "Confirm your mobile number" : "Enter the code"),
      T("We sent a 6-digit code by SMS to {to}. It can take up to a minute.", { to: to }),
      '<form id="f"><label class="field">' + T("SMS code") + '<input name="otp" class="otp" required inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}"></label>' +
      '<button class="primary block" id="go">' + T(reg ? "Verify and create account" : "Verify") + "</button></form>" +
      '<p class="center" style="margin:.9rem 0 0"><button type="button" class="link" id="resend"></button></p>' +
      '<p class="center small" style="margin:.4rem 0 0"><a href="' + (reg ? "#/register" : p.back || "#/forgot") + '">' + T(reg ? "Change mobile number" : "Go back") + "</a></p>");
    var rb = $("#resend"), timer;
    function tick() {
      if (!document.body.contains(rb)) return;
      var w = MB.resendWait();
      rb.disabled = w > 0; rb.textContent = w > 0 ? T("Resend code in {n}s", { n: w }) : T("Resend code");
      if (w > 0) timer = setTimeout(tick, 1000);
    }
    tick();
    rb.addEventListener("click", function () {
      var cur = MB.pending(); if (!cur) return;
      rb.disabled = true; rb.textContent = T("Sending…");
      var extra = Object.assign({}, cur); ["otpHash", "expires", "attempts", "sentAt", "mode", "shownCode", "purpose", "phone"].forEach(function (k) { delete extra[k]; });
      MB.setPending(Object.assign(cur, { sentAt: 0 }));
      MB.sendOtp(cur.phone, cur.purpose, extra).then(function () { flash(T("A new code is on its way."), "success"); codeVerifyView(); },
        function (err) { MB.setPending(cur); flash(T(err.message), "error"); codeVerifyView(); });
    });
    on("#f", "submit", function (e) {
      e.preventDefault(); clearTimeout(timer);
      busy($("#go"), true, T("Checking…"));
      MB.verifyOtp(e.target.otp.value).then(function (p) {
        MB.setPending(null);
        if (p.purpose !== "sms-register") {  // forgot or change password: the code proves it is the owner
          sessionStorage.setItem("mb_reset_key", p.key); sessionStorage.setItem("mb_reset_ok", p.key); return go("#/reset");
        }
        var pw = sessionStorage.getItem("mb_reg_pw");
        if (!pw) { flash(T("Please fill in the form again."), "error"); return go("#/register"); }
        var d = Object.assign({}, p); ["otpHash", "expires", "attempts", "sentAt", "mode", "shownCode", "purpose", "phone"].forEach(function (k) { delete d[k]; });
        return createMobileAccount(d, pw, "sms");
      }).catch(function (err) { flash(T(err.message), "error"); if (MB.pending()) codeVerifyView(); else go(reg ? "#/register" : "#/forgot"); });
    });
  }

  // Demo mode only (no Firebase key, or offline): the email code is shown on screen.
  function verifyView() {
    var p = MB.pending();
    if (p && p.mode === "sms") return codeVerifyView();
    if (!p || p.purpose !== "register") return go("#/register");
    view.innerHTML = authShell(T("Confirm your email"), T("Enter the 6-digit code."),
      '<div class="demo-box"><span class="demo-badge">' + T("DEMO MODE") + '</span><p class="small">' +
      T(MB.firebaseConfigured() ? "You are offline, so no email could be sent. Use this code:" : "Firebase is not set up in this app yet. Use this code:") + "</p>" +
      (p.shownCode ? '<div class="otp-code">' + E(p.shownCode) + "</div>" : "") + "</div>" +
      '<form id="f"><label class="field">' + T("One-time code") + '<input name="otp" class="otp" required inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}"></label>' +
      '<button class="primary block">' + T("Verify and create account") + "</button></form>");
    on("#f", "submit", function (e) {
      e.preventDefault();
      MB.verifyOtp(e.target.otp.value).then(function (p) {
        var users = MB.users(), key = accountKey(p);
        users[key] = newUserRecord(p, { verifiedBy: "demo" });
        MB.saveUsers(users); MB.setPending(null); sessionStorage.removeItem("mb_reg_draft");
        flash(T("Your account is ready. Please log in."), "success");
        sessionStorage.setItem("mb_last_phone", p.email || key);
        go("#/login");
      }).catch(function (err) { flash(T(err.message), "error"); verifyView(); });
    });
  }

  // Firebase: wait for the user to tap the verification link in their email.
  function checkEmailView() {
    var p = MB.pending();
    if (!p || p.purpose.indexOf("firebase") !== 0) return go("#/login");
    view.innerHTML = authShell(T("Check your email"), T("We sent a link to {email}", { email: "<b>" + E(p.email) + "</b>" }),
      '<ol class="steps-list"><li>' + T("Open the email from Medibot (noreply@…firebaseapp.com). Not there? Look in Spam or Promotions.") + "</li>" +
      "<li>" + T("Tap the link in the email. A page says your email is verified.") + "</li><li>" + T("Come back here and tap the button below.") + "</li></ol>" +
      '<button class="primary block" id="done">' + T("I've verified my email") + "</button>" +
      '<p class="center" style="margin:.9rem 0 0"><button type="button" class="link" id="resend"></button></p>' +
      '<p class="center small" style="margin:.4rem 0 0"><a href="#/register">' + T("Use a different email") + "</a></p>");
    var b = $("#resend");
    (function tick() {
      if (!document.body.contains(b)) return;
      var w = MB.resendWait(); b.disabled = w > 0; b.textContent = w > 0 ? T("Resend link in {n}s", { n: w }) : T("Resend link");
      if (w > 0) setTimeout(tick, 1000);
    })();
    b.addEventListener("click", function () {
      b.disabled = true;
      MB.fbRefresh(p.refreshToken).then(function (t) { return MB.fbSendVerify(t.idToken); }).then(function () {
        p.sentAt = MB.now(); MB.setPending(p); flash(T("A new link was sent to {email}.", { email: p.email }), "success"); checkEmailView();
      }).catch(function (err) { flash(T(err.message), "error"); checkEmailView(); });
    });
    on("#done", "click", function () {
      busy($("#done"), true, T("Checking…"));
      MB.fbCheckVerified(p).then(function (r) {
        if (!r.verified) { flash(T("Not verified yet. Open the email and tap the link first (check Spam too)."), "error"); return checkEmailView(); }
        MB.setPending(null);
        if (p.purpose === "firebase-login") { flash(T("Email verified! Now log in."), "success"); return go("#/login"); }
        var users = MB.users(), key = accountKey(p), pw = sessionStorage.getItem("mb_reg_pw") || "";
        users[key] = newUserRecord(p, { uid: p.uid, refreshToken: r.refreshToken, verifiedBy: "email", linked: !!p.linked });
        MB.saveUsers(users); sessionStorage.removeItem("mb_reg_draft"); sessionStorage.removeItem("mb_reg_pw");
        finishLogin(key, p.email, pw, true, !!pw);
        flash(T("Your email is verified."), "success");
        go("#/home");
      }).catch(function (err) { flash(T(err.message), "error"); checkEmailView(); });
    });
  }

  // First log in on a new phone: Firebase knows the account; this phone needs the health details once.
  function completeView() {
    var c = JSON.parse(sessionStorage.getItem("mb_complete") || "null");
    if (!c) return go("#/login");
    view.innerHTML = authShell(T("One last step"), T("First time on this phone. Add your details once."),
      '<form id="f" novalidate><label class="field">' + T("Full name") + '<input name="name" required maxlength="80" value="' + E(c.name) + '"></label>' +
      (c.kind === "email" ? '<label class="field">' + T("Mobile number (optional)") + '<input name="phone" inputmode="tel" autocomplete="tel" placeholder="98765 43210"></label>' : "") +
      photoPicker("", c.name) + dobFields("dob", "") +
      '<div class="field"><span class="flabel">' + T("Gender") + "</span>" + genderSeg("gender", "") + "</div>" +
      '<label class="field">' + T("Blood group") + bloodSelect("blood", "") + "</label>" +
      '<label class="field">' + T("Address") + '<textarea name="address" rows="2" maxlength="200"></textarea></label>' +
      '<button class="primary block">' + T("Continue") + "</button></form>");
    var f = $("#f"); wireDob(f); wirePhoto();
    on("#f", "submit", function (e) {
      e.preventDefault();
      var mobile = c.mobile || "", dob = readDob(f, "dob");
      if (f.phone && f.phone.value.trim()) { try { mobile = MB.normalizePhone(f.phone.value); } catch (err) { flash(T(err.message), "error"); return completeView(); } }
      if (!dob || dob === "invalid") { flash(T("Please choose your date of birth."), "error"); return completeView(); }
      if (!f.gender.value) { flash(T("Please choose a gender."), "error"); return completeView(); }
      var users = MB.users(), key = c.kind === "mobile" ? c.mobile : (mobile && !users[mobile] ? mobile : c.email.toLowerCase());
      users[key] = Object.assign(users[key] || {}, newUserRecord({ name: f.name.value.trim() || c.name || "Medibot user", email: c.email, mobile: mobile, kind: c.kind,
        dob: dob, gender: f.gender.value, blood: f.blood.value, address: f.address.value.trim(), photo: f.photo.value, salt: c.salt, hash: c.hash },
        { uid: c.uid, refreshToken: c.refreshToken, verifiedBy: c.kind === "mobile" ? "mobile" : "email" }));
      MB.saveUsers(users);
      if (c.kind === "email" && mobile) MB.fbLinkPhone(mobile, c.email).then(function () { MB.updateUser(key, { linked: true }); }, function () {});
      var pw = sessionStorage.getItem("mb_complete_pw") || "";
      sessionStorage.removeItem("mb_complete"); sessionStorage.removeItem("mb_complete_pw");
      finishLogin(key, c.id || key, pw, true, c.savePw);
      go("#/home");
    });
  }

  function loginView() {
    var last = sessionStorage.getItem("mb_last_phone") || "", saved = MB.savedLogins(), users = MB.users();
    var savedHtml = saved.filter(function (x) { return users[x.key]; }).map(function (x) {
      var u = users[x.key];
      return '<button type="button" class="saved-acc" data-key="' + E(x.key) + '">' + avatar(u) + '<span class="grow"><b>' + E(u.name) + '</b><small class="muted">' +
        E(x.id.indexOf("@") > 0 ? MB.maskEmail(x.id) : MB.maskPhone(x.id)) + "</small></span>" + I("chevron") + "</button>";
    }).join("");
    view.innerHTML = authShell(T("Welcome back"), T("Log in with your mobile number or email."),
      (savedHtml ? '<div class="saved-list"><span class="flabel">' + T("Saved on this phone") + "</span>" + savedHtml + '</div><div class="or"><span>' + T("or") + "</span></div>" : "") +
      '<form id="f"><label class="field">' + T("Mobile number or email") + '<input name="phone" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="98765 43210 / you@gmail.com" value="' + E(last.replace(MB.settings().countryCode, "")) + '"></label>' +
      pwField("pw", T("Password"), "current-password") +
      '<label class="check"><input type="checkbox" name="remember" checked><span>' + T("Keep me logged in") + "</span></label>" +
      '<label class="check"><input type="checkbox" name="savepw" checked><span>' + T("Save password on this phone") + "</span></label>" +
      '<button class="primary block" id="go">' + T("Log in") + "</button>" +
      '<p class="center" style="margin:.8rem 0 0"><a href="#/forgot">' + T("Forgot password?") + "</a></p></form>" +
      '<p class="center muted" style="margin:1rem 0 0">' + T("New here?") + ' <a href="#/register">' + T("Create an account") + "</a></p>", { lang: true }) +
      '<p class="center small"><a href="#/settings">' + I("gear") + " " + T("Settings") + "</a></p>" + disclaimer();
    wirePwToggles(); wireLang(loginView);
    function submit(id, pw, remember, savePw) {
      busy($("#go"), true, T("Logging in…"));
      MB.login(id, pw).then(function (r) {
        if (r.needsProfile) {
          sessionStorage.setItem("mb_complete", JSON.stringify(Object.assign(r.needsProfile, { id: id, savePw: savePw })));
          sessionStorage.setItem("mb_complete_pw", pw);
          return go("#/complete");
        }
        finishLogin(r.phone, id, pw, remember, savePw);
        go("#/home");
      }).catch(function (err) {
        if (err.code === "NOT_VERIFIED") {
          MB.setPending({ purpose: "firebase-login", email: err.email, refreshToken: err.tokens.refreshToken, sentAt: 0 });
          flash(T(err.message), "error"); return go("#/checkemail");
        }
        flash(T(err.message), "error"); loginView();
      });
    }
    $$(".saved-acc").forEach(function (b) {
      b.addEventListener("click", function () {
        var entry = MB.savedLogins().filter(function (x) { return x.key === b.dataset.key; })[0]; if (!entry) return;
        MB.savedPassword(entry).then(function (pw) { submit(entry.id, pw, true, true); }, function () {
          MB.forgetLogin(entry.key); flash(T("The saved password could not be read. Please type it once."), "error"); loginView();
        });
      });
    });
    on("#f", "submit", function (e) {
      e.preventDefault();
      var f = e.target, id = f.phone.value.trim();
      if (!id) { flash(T("Please enter your mobile number or email."), "error"); return loginView(); }
      submit(id, f.pw.value, f.remember.checked, f.savepw.checked);
    });
  }

  // Ways to prove it is the owner: SMS code (Fast2SMS) to the mobile number, Firebase reset link to the email, or date of birth.
  function recoveryWays(key, u) {
    var ways = [], mob = u.mobile || (key.charAt(0) === "+" ? key : "");
    if (mob && MB.smsReady(mob)) ways.push({ id: "sms", icon: "phone", label: T("Send a code by SMS to {to}", { to: MB.maskPhone(mob) }), to: mob });
    return ways;
  }
  function sendRecoveryCode(way, key, u, back) {
    return MB.sendOtp(way.to, "sms-reset", { key: key, name: u.name, back: back }).then(function () { go("#/verify"); });
  }
  function linkButton(email) {
    return '<button type="button" class="way" data-way="link">' + I("mail") + "<span>" + E(T("Email a reset link to {to}", { to: MB.maskEmail(email) })) + "</span></button>";
  }
  function sendResetLink(email, key) {
    return MB.fbResetPassword(email).then(function () {
      if (key) MB.forgetLogin(key);
      flash(T("Reset link sent to {email}. Open it, choose a new password, then log in here with the new password.", { email: email }), "success");
      if (MB.currentUser()) MB.logout();
      go("#/login");
    });
  }
  function waysHtml(ways, extra) {
    return '<div class="stack">' + ways.map(function (w) { return '<button type="button" class="way" data-way="' + w.id + '">' + I(w.icon) + "<span>" + E(w.label) + "</span></button>"; }).join("") +
      (extra || "") + "</div>";
  }

  function forgotView() {
    view.innerHTML = authShell(T("Reset password"), T("Type the mobile number or email you registered with."),
      '<form id="f"><label class="field">' + T("Mobile number or email") + '<input name="phone" required autocapitalize="none" autocorrect="off" spellcheck="false"></label>' +
      '<button class="primary block" id="go">' + T("Continue") + "</button></form>" +
      '<p class="center" style="margin:1rem 0 0"><a href="#/login">' + T("Back to log in") + "</a></p>");
    on("#f", "submit", function (e) {
      e.preventDefault();
      var id = e.target.phone.value.trim(), found = MB.findLocalUser(id);
      var email = id.indexOf("@") > 0 ? id : found && found[1].kind !== "mobile" && found[1].email;
      if (!found) {
        if (email && MB.useFirebase()) return sendLink(email);
        flash(T(MB.useFirebase() ? "This mobile number is not saved on this phone. A mobile account can reset its password only on the phone where it was used. Log in there, or create a new account." :
          "No account with this mobile number or email on this phone."), "error");
        return forgotView();
      }
      var key = found[0], u = found[1], ways = recoveryWays(key, u);
      var linkBtn = email && MB.useFirebase() ? linkButton(email) : "";
      var dobBtn = u.dob ? '<button type="button" class="way" data-way="dob">' + I("lock") + "<span>" + E(T("Confirm my date of birth")) + "</span></button>" : "";
      if (!ways.length && !linkBtn && !dobBtn) { flash(T("This account has no date of birth saved, so it cannot be reset on the phone. Please create a new account."), "error"); return forgotView(); }
      view.innerHTML = authShell(T("How should we check it's you?"), T("Account: {name}", { name: E(u.name) }), waysHtml(ways, linkBtn + dobBtn) +
        '<p class="center" style="margin:1rem 0 0"><a href="#/forgot">' + T("Go back") + "</a></p>");
      $$("[data-way]").forEach(function (b) {
        b.addEventListener("click", function () {
          var w = b.dataset.way;
          if (w === "link") { busy(b, true, T("Sending…")); return sendResetLink(email, key).catch(function (err) { flash(T(err.message), "error"); forgotView(); }); }
          if (w === "dob") { sessionStorage.removeItem("mb_reset_ok"); sessionStorage.setItem("mb_reset_key", key); return go("#/reset"); }
          busy(b, true, T("Sending…"));
          sendRecoveryCode(ways.filter(function (x) { return x.id === w; })[0], key, u, "#/forgot").catch(function (err) { flash(T(err.message), "error"); forgotView(); });
        });
      });
    });
    function sendLink(email) {
      busy($("#go"), true, T("Sending…"));
      return sendResetLink(email, null).catch(function (err) { flash(T(err.message), "error"); forgotView(); });
    }
  }

  // Logged in: change the password with the current password, or with a code by SMS or email.
  function changePwView(user) {
    var key = user.phone, u = MB.users()[key], ways = recoveryWays(key, u);
    var link = u.email && u.kind !== "mobile" && u.uid && MB.useFirebase() ? linkButton(u.email) : "";
    view.innerHTML = authShell(T("Change password"), T("Confirm it's you first."),
      '<form id="f" novalidate>' + pwField("cur", T("Current password"), "current-password") + '<button class="primary block" id="go">' + T("Continue") + "</button></form>" +
      (ways.length || link ? '<div class="or"><span>' + T("or") + "</span></div>" + waysHtml(ways, link) : "") +
      '<p class="center" style="margin:1rem 0 0"><a href="#/profile">' + T("Cancel") + "</a></p>");
    wirePwToggles();
    on("#f", "submit", function (e) {
      e.preventDefault();
      var pw = e.target.cur.value;
      MB.hashPassword(pw, u.salt).then(function (h) {
        if (h.hash !== u.hash) { flash(T("That is not your current password."), "error"); return changePwView(user); }
        sessionStorage.setItem("mb_reset_key", key); sessionStorage.setItem("mb_reset_ok", key); go("#/reset");
      });
    });
    $$("[data-way]").forEach(function (b) {
      b.addEventListener("click", function () {
        busy(b, true, T("Sending…"));
        if (b.dataset.way === "link") return sendResetLink(u.email, key).catch(function (err) { flash(T(err.message), "error"); changePwView(user); });
        sendRecoveryCode(ways.filter(function (x) { return x.id === b.dataset.way; })[0], key, u, "#/changepw").catch(function (err) { flash(T(err.message), "error"); changePwView(user); });
      });
    });
  }

  // Reset on this phone: confirm the date of birth, then choose a new password (also updates Firebase).
  function resetView() {
    var key = sessionStorage.getItem("mb_reset_key"), u = key && MB.users()[key];
    if (!u) return go("#/forgot");
    var ok = sessionStorage.getItem("mb_reset_ok") === key, me = MB.currentUser();
    view.innerHTML = authShell(T("Choose a new password"), ok ? T("Thanks, it's you. Now choose a new password.") : T("For your safety, confirm your date of birth."),
      '<form id="f" novalidate>' + (ok ? "" : dobFields("dob", "")) + pwField("pw", T("New password"), "new-password") + pwField("pw2", T("Confirm new password"), "new-password") +
      '<button class="primary block" id="go">' + T("Update password") + "</button></form>");
    var f = $("#f"); wirePwToggles(); if (!ok) wireDob(f);
    on("#f", "submit", function (e) {
      e.preventDefault();
      var probs = MB.passwordProblems(f.pw.value), dob = ok ? u.dob : readDob(f, "dob");
      if (!ok && !u.dob) { flash(T("This account has no date of birth saved, so it cannot be reset on the phone. Please create a new account."), "error"); return resetView(); }
      if (dob !== u.dob) { flash(T("The date of birth does not match."), "error"); return resetView(); }
      if (probs.length) { flash(T("Password needs {list}.", { list: probs.map(T).join(", ") }), "error"); return resetView(); }
      if (f.pw.value !== f.pw2.value) { flash(T("Passwords do not match."), "error"); return resetView(); }
      if (u.uid && !MB.useFirebase()) { flash(T("Please connect to the internet to change the password."), "error"); return resetView(); }
      busy($("#go"), true, T("Saving…"));
      var pw = f.pw.value;
      (u.uid ? MB.fbChangePassword(u.refreshToken, pw) : Promise.resolve({})).then(function (t) {
        return MB.hashPassword(pw).then(function (h) {
          MB.updateUser(key, Object.assign({ salt: h.salt, hash: h.hash, fails: 0, lockedUntil: 0 }, t.refreshToken ? { refreshToken: t.refreshToken } : {}));
          sessionStorage.removeItem("mb_reset_key"); sessionStorage.removeItem("mb_reset_ok");
          var savedBefore = MB.savedLogins().filter(function (x) { return x.key === key; })[0];
          if (me && me.phone === key) {  // changed while logged in: stay logged in, update the saved password
            if (savedBefore) MB.rememberLogin(savedBefore.id, pw, key);
            flash(T("Password changed."), "success"); return go("#/profile");
          }
          MB.forgetLogin(key);
          sessionStorage.setItem("mb_last_phone", u.mobile || u.email || key);
          flash(T("Password updated. Please log in."), "success"); go("#/login");
        });
      }).catch(function (err) { flash(T(err.message), "error"); resetView(); });
    });
  }

  // ======================= WHO IS THIS FOR (patient picker) =======================
  function patientChip(user) {
    var p = MB.activePatient(user);
    return '<button type="button" class="patient-chip" id="pickPatient">' + avatar(p, "sm") + "<span>" + E(first(p.name)) +
      (p.id !== "self" ? ' <small class="muted">· ' + E(T(p.relation)) + "</small>" : "") + "</span>" + I("down") + "</button>";
  }
  function wirePatientChip(user, after) {
    on("#pickPatient", "click", function () {
      var m = document.createElement("div"), active = MB.activePatient(user);
      m.className = "modal";
      m.innerHTML = '<div class="sheet"><h2>' + T("Who is this for?") + '</h2><div class="list">' + MB.patients(user).map(function (p) {
        return '<a href="#" data-id="' + E(p.id) + '">' + avatar(p) + '<span class="grow"><b>' + E(p.name) +
          '</b><small class="muted">' + E([T(p.relation), MB.patientLabel(p)].filter(Boolean).join(" · ")) + "</small></span>" + (p.id === active.id ? I("check") : "") + "</a>";
      }).join("") + '</div><div class="row"><a class="button grow" href="#/profile">' + I("plus") + " " + T("Add family member") + '</a><button type="button" class="grow" id="closeSheet">' + T("Close") + "</button></div></div>";
      document.body.appendChild(m);
      m.addEventListener("click", function (e) {
        var a = e.target.closest("a[data-id]");
        if (a) { e.preventDefault(); MB.setActivePatient(user, a.dataset.id); m.remove(); after(); }
        else if (e.target === m || e.target.id === "closeSheet" || e.target.closest("a[href='#/profile']")) m.remove();
      });
    });
  }

  // ======================= HOME =======================
  function homeView(user) {
    var hour = new Date().getHours(), part = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    var p = MB.activePatient(user), tip = MB.dailyTip(), recent = MB.recentQuestions(user.phone, p.id, 3);
    var actions = [["#/chat/new", "chat", "Ask Medibot", "Type or speak your question"], ["#/checker", "steth", "Symptom checker", "Find matching conditions"],
      ["#/library", "book", "Disease library", "203 diseases"], ["#/emergency", "heart", "First aid", "Step-by-step guides"],
      ["#/bmi", "scale", "BMI check", "Weight and height"], ["#/history", "clock", "Chat history", "Your past questions"]];
    view.innerHTML = takeFlash() +
      '<section class="hello"><p class="muted">' + T(part) + " · " + E(MB.formatDate(new Date())) + "</p>" +
      "<h1>" + T("Hello, {name}", { name: E(first(user.name)) }) + ' <span class="namaste" aria-hidden="true">🙏</span></h1>' +
      '<div class="row between wrap"><span class="muted small">' + T("Asking for") + "</span>" + patientChip(user) + "</div>" +
      '<a class="ask-bar" href="#/chat/new">' + I("search") + "<span>" + T("Ask about symptoms, diseases, treatment…") + "</span></a></section>" +
      '<button class="sos-card" id="sos"><span class="big">108</span><span><b>' + T("Emergency? Call an ambulance") + "</b><small>" + T("Free, 24x7 across India") + "</small></span>" + I("phone") + "</button>" +
      '<div class="actions">' + actions.map(function (a) {
        return '<a class="action" href="' + a[0] + '"><span class="ai">' + I(a[1]) + "</span><span><b>" + T(a[2]) + "</b><small>" + T(a[3]) + "</small></span></a>";
      }).join("") + "</div>" +
      (tip ? '<h2 class="sec">' + T("Health tip of the day") + '</h2><div class="tip"><div class="label">' + T("Prevention") + " · " + E(tip.disease.name) + "</div><p>" + E(tip.text) +
        '</p><a class="small" href="#/disease/' + encodeURIComponent(tip.disease.slug) + '">' + T("Read more") + "</a></div>" : "") +
      (recent.length ? '<h2 class="sec">' + T("Recent questions") + '</h2><div class="list">' + recent.map(function (r) {
        return '<a href="#/chat/' + E(r.chat) + '">' + I("clock") + '<span class="grow ellipsis">' + E(r.q) + "</span>" + I("chevron") + "</a>"; }).join("") + "</div>" : "") +
      disclaimer();
    on("#sos", "click", function () { callSheet("108", "Ambulance"); });
    wirePatientChip(user, function () { homeView(user); });
  }

  // ======================= CHAT =======================
  function suggestions() { return MB.SUGGESTIONS[MB.lang()] || MB.SUGGESTIONS.en; }
  function userMsgHtml(m, p) {
    return '<div class="msg user"><div class="bubble">' + MB.nl2br(m.content) + '<span class="time">' + E(MB.formatTime(m.at)) + "</span></div>" + avatar(p, "sm") + "</div>";
  }
  function botAvatar() { return '<img class="avatar sm bot-av" src="icons/mark.png" alt="Medibot">'; }
  function greetingHtml(user, p) {
    return '<div class="msg bot greet">' + botAvatar() + '<div class="bubble"><b>' + T("Namaste {name} 🙏", { name: E(first(user.name)) }) + "</b><p>" +
      T("Welcome to Medibot, your very own health assistant. How may I help you today?") + "</p>" +
      (p.id !== "self" ? '<p class="small muted">' + T("You are asking for {name}. Their chats are kept separately.", { name: E(p.name) }) + "</p>" : "") +
      '<p class="small muted">' + T("You can write in English, हिंदी or ଓଡ଼ିଆ.") + "</p></div></div>";
  }
  function botMsgHtml(m, idx) {
    var h = '<div class="msg bot">' + botAvatar() + '<div class="bubble">';
    var urg = m.urgency || (m.notice ? { level: "emergency", text: m.notice } : null);
    if (urg) {
      h += '<div class="emergency-card"><b>' + I("sos") + " " + T(urg.level === "selfharm" ? "You matter. Help is available." : "Possible emergency") + '</b><p class="small">' + E(T(urg.text)) + "</p>" +
        '<div class="row wrap">' + (urg.level === "selfharm" ? '<button class="danger mini" data-call="14416|Tele-MANAS">' + I("phone") + " " + T("Call {num}", { num: "14416" }) + "</button>" : "") +
        '<button class="danger mini" data-call="108|Ambulance">' + I("phone") + " " + T("Call 108 Ambulance") + "</button>" +
        '<a class="button mini" href="#/emergency">' + T("First aid") + "</a></div>" + warningTag() + "</div>";
    }
    h += '<div class="answer">' + MB.renderAnswer(m.content) + "</div>";
    if (m.treatment) h += treatmentDisclaimer();
    if (m.diseases && m.diseases.length) {
      h += '<div class="related">' + m.diseases.map(function (d) {
        return '<a href="#/disease/' + encodeURIComponent(d.slug) + '">' + I("book") + " " + E(d.name) + "</a>"; }).join("") + "</div>";
    }
    if (m.sources && m.sources.length) {
      h += '<details class="sources"><summary>' + T("Sources ({n})", { n: m.sources.length }) + "</summary><ul>" + m.sources.map(function (s) {
        return "<li><strong>" + T("Page {n}", { n: E(s.page) }) + "</strong>: " + E(s.snippet) + "…</li>"; }).join("") + "</ul></details>";
    }
    h += '<div class="answer-foot"><span class="engine-chip" title="' + E(m.engineNote || "") + '">' + E(T(m.engine || "Medibot")) + "</span>" +
      (idx >= 0 ? '<button class="mini ghost" data-copy="' + idx + '">' + I("copy") + " " + T("Copy") + "</button>" +
      ("speechSynthesis" in window ? '<button class="mini ghost" data-speak="' + idx + '">' + I("speaker") + " " + T("Listen") + "</button>" : "") : "") +
      '<span class="time">' + E(MB.formatTime(m.at)) + "</span></div>";
    return h + "</div></div>";
  }
  function plainText(md) { return String(md || "").replace(/^#+\s*/gm, "").replace(/^>\s?/gm, "").replace(/\*\*/g, ""); }

  function chatView(user, arg) {
    var patient = MB.activePatient(user), chats = MB.chats(user.phone, patient.id), chat = null;
    if (arg && arg !== "new") chat = MB.getChat(user.phone, patient.id, arg);
    if (!chat && arg !== "new" && chats[0] && MB.now() - chats[0].updated < 6 * 3600000) chat = chats[0];  // continue a recent chat
    if (!chat) chat = { id: MB.newChatId(), msgs: [] };
    view.className = "container chat-page";
    view.innerHTML = takeFlash() + '<div class="chat-head">' + patientChip(user) +
      '<div class="row"><a class="button mini ghost" href="#/history" title="' + T("Chat history") + '">' + I("clock") + "<span>" + T("History") + "</span></a>" +
      '<a class="button mini" href="#/chat/new" id="newChat">' + I("plus") + "<span>" + T("New chat") + "</span></a></div></div>" +
      '<div id="box" class="chat-box">' + greetingHtml(user, patient) +
      chat.msgs.map(function (m, i) { return m.role === "user" ? userMsgHtml(m, patient) : botMsgHtml(m, i); }).join("") +
      (chat.msgs.length ? "" : '<div class="suggestions" id="sugg">' + suggestions().map(function (s) { return '<button type="button" class="chip">' + E(s) + "</button>"; }).join("") + "</div>") +
      "</div>" +
      '<form id="f" class="composer"><div class="composer-inner"><textarea id="q" rows="1" placeholder="' + T("Type your health question…") + '" maxlength="1000" required></textarea>' +
      (MB.canListen() ? '<button type="button" class="mic-btn" id="mic" aria-label="' + T("Speak") + '">' + I("mic") + "</button>" : "") +
      '<button class="primary send-btn" id="send" aria-label="' + T("Send") + '">' + I("send") + "</button></div></form>";
    var box = $("#box"), q = $("#q"), send = $("#send");
    if (box.lastElementChild) box.lastElementChild.scrollIntoView({ block: "end" });
    function autosize() { q.style.height = "auto"; q.style.height = Math.min(140, q.scrollHeight) + "px"; }
    q.addEventListener("input", autosize);

    function ask(text) {
      text = text.trim(); if (!text || send.disabled) return;
      var sug = $("#sugg"); if (sug) sug.remove();
      var um = { role: "user", content: text, at: MB.now() };
      box.insertAdjacentHTML("beforeend", userMsgHtml(um, patient) +
        '<div class="msg bot" id="typing">' + botAvatar() + '<div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span> <span class="muted small">' + T("Looking it up…") + "</span></div></div>");
      $("#typing").scrollIntoView({ behavior: "smooth", block: "end" });
      send.disabled = true;
      MB.answer(text, chat.msgs, patient).then(function (r) {
        var am = Object.assign({ role: "assistant", at: MB.now() }, r);
        chat.msgs.push(um, am);
        MB.saveChat(user.phone, patient.id, chat);
        if (location.hash !== "#/chat/" + chat.id) history.replaceState(null, "", "#/chat/" + chat.id);
        $("#typing").remove();
        box.insertAdjacentHTML("beforeend", botMsgHtml(am, chat.msgs.length - 1));
      }).catch(function (err) {
        $("#typing").remove();
        box.insertAdjacentHTML("beforeend", botMsgHtml({ role: "assistant", content: "## " + T("Sorry") + "\n" + T("Something went wrong:") + " " + err.message, at: MB.now() }, -1));
      }).then(function () {
        send.disabled = false;
        var last = box.lastElementChild; if (last) last.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    on("#f", "submit", function (e) { e.preventDefault(); var t = q.value; q.value = ""; autosize(); ask(t); });
    q.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer:fine)").matches) { e.preventDefault(); $("#f").requestSubmit(); }
    });
    $$(".chip").forEach(function (c) { c.addEventListener("click", function () { ask(c.textContent); }); });
    on("#mic", "click", function () {
      var mic = $("#mic"); mic.classList.add("on");
      MB.listen(MB.lang()).then(function (text) { q.value = (q.value ? q.value + " " : "") + text; autosize(); q.focus(); },
        function (err) { q.placeholder = T(err.message); }).then(function () { mic.classList.remove("on"); });
    });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.call) { var parts = b.dataset.call.split("|"); callSheet(parts[0], parts[1]); }
      else if (b.dataset.copy) {
        var m = chat.msgs[+b.dataset.copy]; if (!m) return;
        (navigator.clipboard ? navigator.clipboard.writeText(plainText(m.content)) : Promise.reject()).then(function () { b.textContent = T("Copied"); }, function () { b.textContent = T("Copy failed"); });
      } else if (b.dataset.speak) {
        var mm = chat.msgs[+b.dataset.speak]; if (!mm) return;
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
        var u = new SpeechSynthesisUtterance(plainText(mm.content)); u.lang = MB.speechLang(mm.lang || MB.detectLang(mm.content)); speechSynthesis.speak(u);
      }
    });
    wirePatientChip(user, function () { go("#/chat/new"); });
  }

  // ======================= CHAT HISTORY =======================
  function historyView(user) {
    var p = MB.activePatient(user), chats = MB.chats(user.phone, p.id);
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), day = 86400000;
    function bucket(t) { return t >= today ? "Today" : t >= today - day ? "Yesterday" : t >= today - 6 * day ? "Earlier this week" : t >= new Date(now.getFullYear(), now.getMonth(), 1).getTime() ? "This month" : "Older"; }
    var groups = [], last = null;
    chats.forEach(function (c) { var b = bucket(c.updated); if (b !== last) { groups.push({ name: b, items: [] }); last = b; } groups[groups.length - 1].items.push(c); });
    view.innerHTML = takeFlash() + '<div class="row between wrap"><h1>' + T("Chat history") + "</h1>" + patientChip(user) + "</div>" +
      '<p class="muted small">' + T("Kept only on this phone. Each family member has their own history.") + "</p>" +
      (chats.length ? groups.map(function (g) {
        return '<h2 class="sec">' + T(g.name) + '</h2><div class="list">' + g.items.map(function (c) {
          var n = c.msgs.filter(function (m) { return m.role === "user"; }).length;
          return '<div class="item"><a class="grow" href="#/chat/' + E(c.id) + '"><b class="ellipsis">' + E(c.title) + '</b><small class="muted">' + E(MB.formatDate(new Date(c.updated))) + " · " +
            E(MB.formatTime(c.updated)) + " · " + T(n === 1 ? "{n} question" : "{n} questions", { n: n }) + '</small></a><button class="mini ghost" data-del="' + E(c.id) + '" aria-label="' + T("Delete") + '">' + I("trash") + "</button></div>";
        }).join("") + "</div>";
      }).join("") : '<div class="empty"><p>' + T("No chats yet.") + '</p><a class="button primary" href="#/chat/new">' + T("Ask a question") + "</a></div>") +
      '<div class="card danger-zone"><h2>' + T("Clear history") + '</h2><p class="muted small">' + T("Only for {name}. This cannot be undone.", { name: E(p.name) }) + "</p>" +
      '<div class="stack"><button type="button" data-clear="today">' + T("Clear today's chats") + '</button><button type="button" data-clear="lastmonth">' + T("Clear last month's chats") +
      '</button><button type="button" class="danger-outline" data-clear="all">' + T("Clear all chats") + "</button></div></div>";
    $$("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        confirmSheet(T("Delete this chat?"), "", T("Delete"), true).then(function (ok) { if (ok) { MB.deleteChat(user.phone, p.id, b.dataset.del); historyView(user); } });
      });
    });
    var labels = { today: "Clear today's chats", lastmonth: "Clear last month's chats", all: "Clear all chats" };
    $$("[data-clear]").forEach(function (b) {
      b.addEventListener("click", function () {
        confirmSheet(T(labels[b.dataset.clear]) + "?", T("Only for {name}. This cannot be undone.", { name: p.name }), T("Clear"), true).then(function (ok) {
          if (!ok) return; MB.clearChats(user.phone, p.id, b.dataset.clear); flash(T("Done."), "success"); historyView(user);
        });
      });
    });
    wirePatientChip(user, function () { historyView(user); });
  }

  // ======================= LIBRARY =======================
  function libraryView(params) {
    var q = params.q || "", letter = params.letter || "";
    var list = MB.searchDiseases(MB.englishQuery(q).trim() || q, letter);
    view.innerHTML = "<h1>" + T("Disease library") + "</h1>" +
      '<p class="muted">' + T("{n} diseases with symptoms, standard treatment, remedies and prevention. Works offline.", { n: MB.diseases().length }) + "</p>" +
      '<form id="f" class="search"><div class="search-box">' + I("search") + '<input name="q" value="' + E(q) + '" placeholder="' + T("Search disease or symptom") + '"></div><button class="primary">' + T("Search") + "</button></form>" +
      '<div class="letters"><a href="#/library" class="' + (!letter && !q ? "active" : "") + '">' + T("All") + "</a>" +
      MB.letters().map(function (l) { return '<a href="#/library?letter=' + l + '" class="' + (l === letter ? "active" : "") + '">' + l + "</a>"; }).join("") + "</div>" +
      (q ? '<p class="muted">' + T("{n} result(s) for “{q}”", { n: list.length, q: E(q) }) + "</p>" : "") +
      '<div class="grid">' + (list.map(function (d) {
        var t = d.definition || d.description || "";
        return '<a class="tile" href="#/disease/' + encodeURIComponent(d.slug) + '"><h3>' + E(d.name) + "</h3><p>" + E(t.slice(0, 110)) + (t.length > 110 ? "…" : "") + "</p></a>";
      }).join("") || "<p>" + T("No diseases found.") + "</p>") + "</div>";
    on("#f", "submit", function (e) { e.preventDefault(); go("#/library?q=" + encodeURIComponent(e.target.q.value.trim())); });
  }

  function diseaseView(slug, user) {
    var d = MB.disease(slug);
    if (!d) { view.innerHTML = "<p>" + T("Not found.") + ' <a href="#/library">' + T("Back to the library") + "</a></p>"; return; }
    var saved = MB.saved(user.phone).indexOf(slug) >= 0;
    function sec(icon, title, text, max, cls) {
      if (!text) return "";
      var pts = MB.toPoints(text, max || 5), rest = text.length > 600;
      return '<section class="dsection ' + (cls || "") + '"><h2>' + I(icon) + T(title) + '</h2><ul class="points">' +
        pts.map(function (x) { return "<li>" + E(x) + "</li>"; }).join("") + "</ul>" +
        (rest ? "<details><summary>" + T("Read full text") + "</summary><p>" + MB.nl2br(text) + "</p></details>" : "") + "</section>";
    }
    view.innerHTML = '<div class="dhero"><a href="#/library" class="small back">' + I("back") + " " + T("Disease library") + "</a><h1>" + E(d.name) + "</h1>" +
      "<p>" + E(MB.toPoints(d.definition, 2).join(" ")) + "</p>" +
      (MB.lang() !== "en" ? '<p class="small muted">' + T("Disease details are in English, as written in the encyclopedia.") + "</p>" : "") +
      '<div class="row"><button type="button" id="save">' + I("star") + " " + T(saved ? "Saved" : "Save") + '</button><a class="button primary" href="#/chat/new" id="askAbout">' + I("chat") + " " + T("Ask Medibot") + "</a></div></div>" +
      (d.symptoms.length ? '<section class="dsection"><h2>' + I("steth") + T("Common symptoms") + '</h2><div class="symptom-grid">' +
        d.symptoms.map(function (s) { return "<span>" + E(s) + "</span>"; }).join("") + "</div></section>" : "") +
      sec("pill", "Standard treatment (cure)", d.treatment, 6, "cure") +
      (d.treatment ? treatmentDisclaimer() : "") +
      sec("leaf", "Remedies and alternative treatment", d.alternative_treatment, 5) +
      sec("shield", "Prevention", d.prevention, 5) +
      sec("search", "Causes and symptoms", d.causes_and_symptoms, 5) +
      sec("steth", "Diagnosis", d.diagnosis, 4) +
      sec("clock", "Outlook (prognosis)", d.prognosis, 3) +
      '<p class="muted small center">' + T("Source: The Gale Encyclopedia of Medicine, PDF page {n}. Information may be dated; consult a doctor.", { n: E(d.source_page) }) + "</p>";
    on("#save", "click", function () { var now = MB.toggleSaved(user.phone, slug); $("#save").innerHTML = I("star") + " " + T(now ? "Saved" : "Save"); });
    on("#askAbout", "click", function (e) { e.preventDefault(); sessionStorage.setItem("mb_prefill", T("Tell me about {name}", { name: d.name })); go("#/chat/new"); });
    window.scrollTo(0, 0);
  }

  function savedView(user) {
    var list = MB.saved(user.phone).map(MB.disease).filter(Boolean);
    view.innerHTML = "<h1>" + T("Saved diseases") + "</h1>" + (list.length ? '<div class="grid">' + list.map(function (d) {
      return '<a class="tile" href="#/disease/' + encodeURIComponent(d.slug) + '"><h3>' + E(d.name) + "</h3><p>" + E((d.definition || "").slice(0, 110)) + "…</p></a>"; }).join("") + "</div>" :
      '<div class="empty"><p>' + T("Nothing saved yet.") + '</p><p class="muted small">' + T("Tap “Save” on any disease to keep it here.") + '</p><a class="button primary" href="#/library">' + T("Browse the library") + "</a></div>");
  }

  // ======================= SYMPTOM CHECKER =======================
  var COMMON = ["fever", "headache", "cough", "sore throat", "runny nose", "rash", "itching", "vomiting", "nausea", "diarrhea", "abdominal pain",
    "fatigue", "dizziness", "chest pain", "shortness of breath", "joint pain", "back pain", "swelling", "weight loss", "blurred vision"];
  function checkerView(params) {
    var text = params.s || "", english = MB.englishQuery(text, true), r = text ? MB.symptomCheck(english) : null;
    var chosen = english.split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
    view.innerHTML = "<h1>" + T("Symptom checker") + "</h1>" +
      '<p class="muted">' + T("Tap your symptoms or type them, separated by commas.") + "</p>" +
      '<div class="chips" id="common">' + COMMON.map(function (c) { return '<button type="button" data-s="' + c + '" class="' + (chosen.indexOf(c) >= 0 ? "on" : "") + '">' + E(T(c)) + "</button>"; }).join("") + "</div>" +
      '<form id="f" class="search"><div class="search-box">' + I("steth") + '<input name="s" value="' + E(text) + '" placeholder="' + T("e.g. fever, headache, rash") + '" required></div><button class="primary">' + T("Check") + "</button></form>" +
      '<div class="notice">' + T("For learning only, it cannot diagnose you. If you feel unwell, see a doctor. In an emergency call 108.") + "</div>" +
      (r ? (r.results.length ? '<div class="stack">' + r.results.map(function (x) {
        var pct = Math.round(100 * x.matched.length / r.terms.length);
        return '<a class="tile" href="#/disease/' + encodeURIComponent(x.d.slug) + '"><h3>' + E(x.d.name) + '<span class="badge">' + T("{a} of {b} match", { a: x.matched.length, b: r.terms.length }) + "</span></h3>" +
          '<div class="bar"><i style="width:' + pct + '%"></i></div><p>' + T("Matches:") + " " + E(x.matched.map(T).join(", ")) + "</p></a>";
      }).join("") + "</div>" : "<p>" + T("No matching conditions found. Try simpler words like “fever” or “cough”.") + "</p>") : "");
    $$("#common button").forEach(function (b) {
      b.addEventListener("click", function () {
        var input = $("#f").s, items = input.value.split(",").map(function (x) { return x.trim(); }).filter(Boolean), label = T(b.dataset.s), i = items.indexOf(label);
        if (i < 0) i = items.indexOf(b.dataset.s);
        if (i >= 0) items.splice(i, 1); else items.push(label);
        input.value = items.join(", "); b.classList.toggle("on");
      });
    });
    on("#f", "submit", function (e) { e.preventDefault(); go("#/checker?s=" + encodeURIComponent(e.target.s.value)); });
  }

  // ======================= EMERGENCY =======================
  function emergencyView(user) {
    var fam = MB.patients(user), me = fam[0], givers = MB.canReceiveFrom(me.blood);
    var donors = fam.slice(1).filter(function (p) { return p.blood && givers.indexOf(p.blood) >= 0; });
    view.innerHTML = '<div class="em-hero"><h1>' + T("Emergency") + "</h1><p>" + T("Tap to call an ambulance") + "</p>" +
      '<button class="call-108" id="call108"><span class="num">108</span><span class="lbl">' + T("AMBULANCE") + "</span></button>" + warningTag() + "</div>" +
      '<h2 class="sec">' + T("Tell the operator") + '</h2><div class="card info-card"><div class="row">' + avatar(me) + "<div><b>" + E(user.name) + '</b><br><small class="muted">' +
      E([MB.patientLabel(me), me.blood ? T("Blood group") + " " + me.blood : ""].filter(Boolean).join(" · ")) + "</small></div></div>" +
      (user.address ? '<p class="small">' + I("pin") + " " + E(user.address) + "</p>" : "") +
      '<button type="button" id="loc">' + I("pin") + " " + T("Show my GPS location") + '</button><p id="locOut" class="small muted"></p></div>' +
      '<h2 class="sec">' + T("Need blood?") + '</h2><div class="card">' +
      (me.blood ? "<p>" + T("Your blood group is {g}. You can usually receive red cells from: {list}.", { g: "<b>" + me.blood + "</b>", list: "<b>" + givers.join(", ") + "</b>" }) + "</p>" +
        (donors.length ? '<p class="small">' + T("Family members with a matching blood group:") + " " + donors.map(function (p) { return E(p.name) + " (" + p.blood + ")"; }).join(", ") + "</p>" : "") :
        '<p class="small">' + T("Add your blood group in Profile so it is ready in an emergency.") + ' <a href="#/profile">' + T("Add now") + "</a></p>") +
      '<p class="small muted">' + T("The hospital always tests blood before giving it.") + "</p>" +
      '<a class="button block" href="https://www.google.com/maps/search/blood+bank+near+me" target="_blank" rel="noopener">' + I("drop") + " " + T("Find blood banks near me (needs internet)") + "</a></div>" +
      '<h2 class="sec">' + T("Helplines") + '</h2><div class="list helplines">' + MB.HELPLINES.map(function (h) {
        return '<a href="#" data-call="' + E(h.num) + "|" + E(h.name) + '">' + I("phone") + '<span class="grow"><b>' + E(T(h.name)) + '</b><small class="muted">' + E(T(h.note)) + '</small></span><span class="num">' + E(h.num) + "</span></a>";
      }).join("") + "</div>" +
      '<a class="button block" style="margin-top:.8rem" href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noopener">' + I("hospital") + " " + T("Find nearby hospitals (needs internet)") + "</a>" +
      '<h2 class="sec">' + T("First aid guides") + '</h2><div class="list">' + MB.FIRST_AID.map(function (a) {
        return '<details class="aid"><summary>' + I("heart") + E(T(a.t)) + "</summary><ol>" + a.s.map(function (x) { return "<li>" + E(T(x)) + "</li>"; }).join("") + "</ol></details>";
      }).join("") + "</div>" +
      '<p class="disclaimer">' + T("First-aid steps are general guidance. Always call 108 for serious situations and follow the operator's instructions.") + "</p>";
    on("#call108", "click", function () { callSheet("108", "Ambulance"); });
    $$("[data-call]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var p = a.dataset.call.split("|"); callSheet(p[0], p[1]); }); });
    on("#loc", "click", function () {
      var out = $("#locOut");
      if (!navigator.geolocation) { out.textContent = T("Location is not available on this device."); return; }
      out.textContent = T("Finding your location…");
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude.toFixed(5), lon = pos.coords.longitude.toFixed(5);
        out.innerHTML = T("Latitude {a}, Longitude {b} (±{m} m). Read this to the operator.", { a: "<b>" + lat + "</b>", b: "<b>" + lon + "</b>", m: Math.round(pos.coords.accuracy) }) +
          '<br><a href="https://maps.google.com/?q=' + lat + "," + lon + '" target="_blank" rel="noopener">' + T("Open in Maps") + "</a>";
      }, function (err) { out.textContent = T("Could not get location. Turn on GPS and allow location for Medibot.") + " (" + err.message + ")"; },
      { enableHighAccuracy: true, timeout: 15000 });
    });
  }

  // ======================= BMI =======================
  function bmiView() {
    var unit = MB.load("mb_height_unit", "cm");
    view.innerHTML = "<h1>" + T("BMI check") + '</h1><p class="muted">' + T("Body Mass Index, using the cut-offs recommended for Indian adults.") + "</p>" +
      '<div class="card"><form id="f" novalidate><label class="field">' + T("Weight (kg)") + '<input name="kg" type="number" step="0.1" min="2" max="400" inputmode="decimal"></label>' +
      '<div class="field"><span class="flabel">' + T("Height") + "</span>" + seg("unit", [["cm", T("Centimetres")], ["ft", T("Feet + inches")]], unit) + "</div>" +
      '<div id="hcm"' + (unit === "cm" ? "" : " hidden") + '><label class="field">' + T("Height (cm)") + '<input name="cm" type="number" step="0.1" min="40" max="250" inputmode="decimal"></label></div>' +
      '<div id="hft" class="grid2"' + (unit === "ft" ? "" : " hidden") + '><label class="field">' + T("Feet") + '<input name="ft" type="number" min="1" max="8" inputmode="numeric"></label>' +
      '<label class="field">' + T("Inches") + '<input name="in" type="number" step="0.5" min="0" max="11.5" inputmode="decimal"></label></div>' +
      '<button class="primary block">' + T("Calculate") + '</button></form><div id="out"></div></div>' +
      '<p class="disclaimer">' + T("BMI is a screening number, not a diagnosis. It is not meant for children, pregnant women or athletes.") + "</p>";
    var f = $("#f");
    $$('input[name="unit"]').forEach(function (r) {
      r.addEventListener("change", function () { var u = f.unit.value; MB.save("mb_height_unit", u); $("#hcm").hidden = u !== "cm"; $("#hft").hidden = u !== "ft"; });
    });
    on("#f", "submit", function (e) {
      e.preventDefault();
      var cm = f.unit.value === "ft" ? ((+f.ft.value || 0) * 12 + (+f.in.value || 0)) * 2.54 : +f.cm.value;
      if (!(cm >= 40 && cm <= 250) || !(+f.kg.value > 0)) { $("#out").innerHTML = '<p class="flash error">' + T("Please enter your weight and height.") + "</p>"; return; }
      var r = MB.bmi(+f.kg.value, cm);
      var color = r.category === "Normal" ? "var(--ok)" : r.category === "Underweight" ? "var(--warn)" : "var(--danger)";
      var advice = { Underweight: "Eat regular balanced meals with enough protein; see a doctor if you are losing weight without trying.",
        Normal: "Good. Keep up a balanced diet and at least 30 minutes of activity most days.",
        Overweight: "Small changes help: more vegetables, fewer sugary drinks, and daily walking.",
        Obese: "Talk to a doctor about a safe plan; this raises the risk of diabetes and heart disease." }[r.category];
      $("#out").innerHTML = '<div class="bmi-out"><div class="bmi-num" style="color:' + color + '">' + r.value + "</div><b>" + T(r.category) + '</b><p class="muted small">' +
        T("Height used: {cm} cm", { cm: Math.round(cm) }) + "</p><p>" + T(advice) + "</p></div>";
    });
  }

  // ======================= PROFILE =======================
  function profileView(user) {
    var family = MB.patients(user).slice(1), me = MB.patients(user)[0];
    var loginId = [user.mobile ? MB.maskPhone(user.mobile) : "", user.email ? MB.maskEmail(user.email) : ""].filter(Boolean).join(" · ");
    view.innerHTML = takeFlash() + '<div class="profile-head">' + avatar(me, "xl") + "<div><h1>" + E(user.name) + '</h1><small class="muted">' + E(loginId) +
      (user.verifiedBy === "email" ? " · " + T("email verified") : "") + "</small></div></div>" +
      '<div class="card"><h2>' + T("My details") + '</h2><form id="me" novalidate>' + photoPicker(user.photo, user.name) +
      '<label class="field">' + T("Full name") + '<input name="name" required value="' + E(user.name) + '"></label>' +
      dobFields("dob", user.dob) + (!user.dob && user.age ? '<small class="hint" style="margin-top:-.6rem">' + T("Saved age: {n}. Choose your date of birth to keep it up to date.", { n: E(user.age) }) + "</small>" : "") +
      '<div class="field"><span class="flabel">' + T("Gender") + "</span>" + genderSeg("gender", user.gender) + "</div>" +
      '<label class="field">' + T("Blood group") + bloodSelect("blood", user.blood) + "</label>" +
      '<label class="field">' + T("Address") + '<textarea name="address" rows="2" maxlength="200">' + E(user.address || "") + "</textarea></label>" +
      '<button class="primary block">' + T("Save my details") + "</button></form></div>" +
      '<div class="card"><h2>' + T("Family members") + '</h2><p class="muted small">' + T("Ask questions for family members. Each one has their own photo and chat history.") + "</p>" +
      (family.length ? '<div class="list">' + family.map(function (p) {
        return '<div class="item">' + avatar(p) + '<span class="grow"><b>' + E(p.name) + '</b><small class="muted">' +
          E([T(p.relation), MB.patientLabel(p), p.blood].filter(Boolean).join(" · ")) + '</small></span><button class="mini ghost" data-del="' + E(p.id) + '" aria-label="' + T("Remove") + '">' + I("trash") + "</button></div>";
      }).join("") + "</div>" : "") +
      '<details class="add-fam"' + (family.length ? "" : " open") + "><summary>" + I("plus") + " " + T("Add family member") + '</summary><form id="fam" novalidate>' +
      '<div id="famPhoto">' + photoPicker("", "") + "</div>" +
      '<div class="grid2"><label class="field">' + T("Name") + '<input name="name" required maxlength="60"></label><label class="field">' + T("Relation") + '<select name="relation">' +
      ["Mother", "Father", "Spouse", "Son", "Daughter", "Brother", "Sister", "Grandparent", "Other"].map(function (r) { return '<option value="' + r + '">' + T(r) + "</option>"; }).join("") + "</select></label></div>" +
      dobFields("fdob", "") + '<div class="field"><span class="flabel">' + T("Gender") + "</span>" + genderSeg("fgender", "") + "</div>" +
      '<label class="field">' + T("Blood group") + bloodSelect("fblood", "") + "</label>" +
      '<button class="block primary">' + T("Add family member") + "</button></form></details></div>" +
      '<div class="card"><div class="list plain"><a href="#/history">' + I("clock") + '<span class="grow">' + T("Chat history") + "</span>" + I("chevron") + "</a>" +
      '<a href="#/saved">' + I("star") + '<span class="grow">' + T("Saved diseases") + "</span>" + I("chevron") + "</a>" +
      '<a href="#/bmi">' + I("scale") + '<span class="grow">' + T("BMI check") + "</span>" + I("chevron") + "</a>" +
      '<a href="#/changepw">' + I("lock") + '<span class="grow">' + T("Change password") + "</span>" + I("chevron") + "</a>" +
      '<a href="#/settings">' + I("gear") + '<span class="grow">' + T("Settings, language and storage") + "</span>" + I("chevron") + "</a></div>" +
      '<button class="block" style="margin-top:1rem" id="logout">' + T("Log out") + "</button></div>";
    var meForm = $("#me"), famForm = $("#fam");
    wirePhoto(meForm); wirePhoto($("#famPhoto")); wireDob(meForm); wireDob(famForm);
    on("#me", "submit", function (e) {
      e.preventDefault(); var f = e.target, dob = readDob(f, "dob");
      if (dob === "invalid") { flash(T("Please choose a real date."), "error"); return profileView(user); }
      MB.updateUser(user.phone, { name: f.name.value.trim() || user.name, dob: dob || user.dob || "", gender: f.gender.value, blood: f.blood.value, address: f.address.value.trim(), photo: f.photo.value });
      flash(T("Your details were saved."), "success"); render();
    });
    on("#fam", "submit", function (e) {
      e.preventDefault(); var f = e.target, dob = readDob(f, "fdob");
      if (f.name.value.trim().length < 2) { flash(T("Please enter the family member's name."), "error"); return profileView(user); }
      if (!f.fgender.value) { flash(T("Please choose a gender for the family member."), "error"); return profileView(user); }
      if (dob === "invalid") { flash(T("Please choose a real date."), "error"); return profileView(user); }
      var list = MB.patients(user).slice(1).map(function (p) { var c = Object.assign({}, p); if (c.dob) delete c.age; return c; });
      list.push({ id: "p" + MB.now().toString(36), name: f.name.value.trim(), relation: f.relation.value, dob: dob, gender: f.fgender.value, blood: f.fblood.value,
        photo: $("#famPhoto").querySelector('input[name="photo"]').value, address: user.address || "" });
      MB.saveFamily(user, list); flash(T("{name} was added. Choose them with the “Asking for” button.", { name: f.name.value.trim() }), "success"); profileView(user);
    });
    $$("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        confirmSheet(T("Remove this family member?"), T("Their chat history on this phone is deleted too."), T("Remove"), true).then(function (ok) {
          if (!ok) return;
          MB.saveFamily(user, MB.patients(user).slice(1).filter(function (p) { return p.id !== b.dataset.del; }));
          MB.clearChats(user.phone, b.dataset.del, "all");
          if (MB.activePatient(user).id === b.dataset.del) MB.setActivePatient(user, "self");
          profileView(user);
        });
      });
    });
    on("#logout", "click", function () { MB.logout(); flash(T("You have been logged out."), "info"); go("#/login"); });
  }

  // ======================= SETTINGS =======================
  function settingsView(user, params) {
    var s = MB.settings();
    chrome(!!user, true);
    function field(label, name, value, extra) { return '<label class="field">' + label + '<input name="' + name + '" value="' + E(value) + '" ' + (extra || "") + "></label>"; }
    var fbState = MB.firebaseConfigured() ? '<div class="ok-box">' + I("check") + " " + T("Firebase is set up. Accounts work on any phone, and email sign-ups get a free verification link.") + "</div>" :
      '<div class="demo-box"><span class="demo-badge">' + T("DEMO MODE") + '</span><p class="small">' + T("Firebase is not set up, so accounts stay on this phone. Follow the steps below once (free, about 10 minutes).") + "</p></div>";
    var kb = Math.max(1, Math.round(MB.storageUsed() / 1024));
    view.innerHTML = takeFlash() + (user ? "" : '<p><a href="#/login">' + I("back") + " " + T("Back to log in") + "</a></p>") + "<h1>" + T("Settings") + "</h1>" +
      '<div class="card"><h2>' + I("globe") + " " + T("Language") + '</h2><p class="muted small">' + T("The app and the assistant use this language. You can also just write your question in English, हिंदी or ଓଡ଼ିଆ.") + "</p>" + langSwitch() + "</div>" +
      '<form id="f">' +
      '<div class="card" id="smsCard"><h2>' + I("shield") + " " + T("Accounts with Firebase (free)") + "</h2>" + fbState +
      '<details' + (params && params.sms || !MB.firebaseConfigured() ? " open" : "") + "><summary>" + T("How to set it up (free Spark plan, no card)") + '</summary><ol class="small">' +
      "<li>Open <b>console.firebase.google.com</b> → <b>Create a project</b> (name: Medibot). Google Analytics can be off.</li>" +
      "<li><b>Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.</b></li>" +
      "<li><b>Project settings</b> (gear icon) → <b>General</b> → copy the <b>Web API key</b>. (If there is none, click <b>Add app → Web</b> first.)</li>" +
      "<li>Optional: <b>Authentication → Templates</b> to change the email sender name to Medibot.</li>" +
      "<li>Paste the key below, tap <b>Test Firebase</b>, then <b>Save settings</b>.</li></ol>" +
      '<p class="small muted">To put the key into every phone, add it as the GitHub secret <code>FIREBASE_API_KEY</code> before building the APK (see readme.txt). The Web API key is a public id, not a password.</p></details>' +
      field(T("Firebase Web API key"), "firebaseApiKey", s.firebaseApiKey, 'placeholder="AIza…" autocomplete="off" autocapitalize="none" spellcheck="false"') +
      '<div class="row wrap"><button type="button" id="testFb">' + T("Test Firebase") + '</button><span id="fbMsg" class="muted small"></span></div>' +
      '<label class="check"><input type="checkbox" name="showOtpOnScreen"' + (s.showOtpOnScreen ? " checked" : "") + "><span>" + T("Demo mode (no Firebase or offline): show the email code on screen") + "</span></label>" +
      field(T("Default country code"), "countryCode", s.countryCode) + "</div>" +

      '<div class="card" id="f2sCard"><h2>' + I("phone") + " " + T("SMS codes (Fast2SMS)") + "</h2>" +
      (s.fast2smsKey ? '<div class="ok-box">' + I("check") + " " + T("On. Mobile sign-up, forgot password and change password send a real 6-digit SMS code.") + "</div>" :
        '<p class="muted small">' + T("Off. Mobile sign-up works without a code. Add a Fast2SMS key to send real SMS codes (Indian numbers, paid per SMS).") + "</p>") +
      '<details><summary>' + T("How to set it up") + '</summary><ol class="small">' +
      "<li>Sign up at <b>fast2sms.com</b> and recharge the wallet (each SMS costs a few paise).</li>" +
      "<li>Open <b>Dev API</b> and copy the <b>API Authorization Key</b>.</li>" +
      "<li>Paste it below, tap <b>Test SMS key</b> (shows your balance, sends no SMS), then <b>Save settings</b>.</li>" +
      "<li>Route: <b>Quick SMS</b> works right after recharge. <b>OTP route</b> is cheaper, but Fast2SMS must verify your website first.</li></ol>" +
      '<p class="small muted">Keep this key private: anyone who has it can spend your SMS balance. SMS works in the Android app; a PC browser blocks it.</p></details>' +
      field(T("Fast2SMS API key"), "fast2smsKey", s.fast2smsKey, 'type="password" autocomplete="off" autocapitalize="none" spellcheck="false"') +
      '<label class="field">' + T("Route") + '<select name="fast2smsRoute"><option value="q"' + (s.fast2smsRoute !== "otp" ? " selected" : "") + ">" + T("Quick SMS (our own message)") + "</option>" +
      '<option value="otp"' + (s.fast2smsRoute === "otp" ? " selected" : "") + ">" + T("OTP route (needs website verification)") + "</option></select></label>" +
      '<div class="row wrap"><button type="button" id="testF2s">' + T("Test SMS key") + '</button><span id="f2sMsg" class="muted small"></span></div></div>' +


      '<div class="card"><h2>' + I("cloud") + " " + T("Online AI (Groq)") + '</h2><p class="muted small">' + T("Free key at console.groq.com/keys. Stored only on this phone. Needed for full answers in Hindi and Odia.") + "</p>" +
      field(T("Groq API key"), "groqKey", s.groqKey, 'type="password" autocomplete="off"') +
      '<label class="field">' + T("Model") + '<select name="groqModel"><option value="">' + T("Choose automatically") + "</option>" +
      (s.groqModel ? '<option selected value="' + E(s.groqModel) + '">' + E(s.groqModel) + "</option>" : "") + "</select></label>" +
      '<div class="row wrap"><button type="button" id="loadModels">' + T("Test key and load models") + '</button><span id="groqMsg" class="muted small"></span></div></div>' +

      '<div class="card"><h2>' + I("wifiOff") + " " + T("Local AI over Wi-Fi (Ollama)") + '</h2><p class="muted small">' + T("A laptop on the same Wi-Fi or hotspot runs the AI. No internet needed.") + "</p>" +
      field(T("Ollama address"), "ollamaUrl", s.ollamaUrl, 'placeholder="http://192.168.137.1:11434" inputmode="url"') + field(T("Model"), "ollamaModel", s.ollamaModel) +
      '<div class="row wrap"><button type="button" id="testOllama">' + T("Test connection") + '</button><span id="ollamaMsg" class="muted small"></span></div></div>' +

      '<div class="card"><h2>' + T("Mode and appearance") + "</h2>" +
      '<label class="check"><input type="radio" name="mode" value="auto"' + (s.mode !== "offline" ? " checked" : "") + "><span>" + T("Online when available") + "</span></label>" +
      '<label class="check"><input type="radio" name="mode" value="offline"' + (s.mode === "offline" ? " checked" : "") + "><span>" + T("Always offline (everything stays on this phone)") + "</span></label>" +
      '<div class="field"><span class="flabel">' + T("Theme") + "</span>" + seg("theme", [["auto", T("Auto")], ["light", T("Light")], ["dark", T("Dark")]], s.theme) + "</div></div>" +
      '<button class="primary block">' + T("Save settings") + "</button></form>" +

      (user ? '<div class="card"><h2>' + I("box") + " " + T("Storage on this phone") + '</h2><p class="small">' + T("Medibot's saved data uses about {n} KB. The encyclopedia itself is part of the app.", { n: kb }) + "</p>" +
        '<div class="stack"><button type="button" id="clearCache">' + T("Clear cache") + '</button><a class="button" href="#/history">' + T("Clear chat history…") + "</a>" +
        '<button type="button" id="forgetPw">' + T("Forget saved passwords") + "</button></div>" +
        '<p class="small muted">' + T("Clear cache removes temporary files only. Your account, family and chats stay.") + "</p></div>" : "") +
      '<div class="card"><h2>' + T("About Medibot") + '</h2><p class="small">' + T("Answers come from The Gale Encyclopedia of Medicine (Volume C–F) stored on this phone, with {n} diseases in the library.", { n: MB.diseases().length }) + "</p>" +
      '<p class="muted small">' + T("For education only. Not a substitute for a doctor.") + " " + T("Version {v}", { v: "4.5" }) + "</p></div>";
    wireLang(function () { settingsView(user, params); });

    function collect() {
      var f = $("#f"), ns = MB.settings();
      ["groqKey", "groqModel", "ollamaUrl", "ollamaModel", "firebaseApiKey", "countryCode", "fast2smsKey", "fast2smsRoute"].forEach(function (k) { ns[k] = f[k].value.trim(); });
      ns.mode = f.mode.value; ns.theme = f.theme.value || "auto"; ns.showOtpOnScreen = f.showOtpOnScreen.checked;
      if (!/^\+\d{1,4}$/.test(ns.countryCode)) ns.countryCode = "+91";
      return ns;
    }
    on("#f", "submit", function (e) {
      e.preventDefault(); MB.saveSettings(collect()); MB.applyTheme(); updateStatus();
      flash(T("Settings saved."), "success"); settingsView(user, {}); window.scrollTo(0, 0);
    });
    on("#testFb", "click", function () {
      var key = $("#f").firebaseApiKey.value.trim(), msg = $("#fbMsg");
      if (!key) { msg.textContent = T("Paste the Web API key first."); return; }
      if (!MB.isOnline()) { msg.textContent = T("You are offline. The test needs internet."); return; }
      msg.textContent = T("Testing…");
      MB.fbTest(key).then(function () { msg.textContent = T("Firebase works. Tap Save settings."); updateStatus(); }, function (err) { msg.textContent = T(err.message); });
    });
    on("#testF2s", "click", function () {
      var key = $("#f").fast2smsKey.value.trim(), msg = $("#f2sMsg");
      if (!key) { msg.textContent = T("Paste the Fast2SMS key first."); return; }
      if (!MB.isOnline()) { msg.textContent = T("You are offline. The test needs internet."); return; }
      msg.textContent = T("Testing…");
      MB.smsBalance(key).then(function (b) { msg.textContent = T("Key works. Balance: ₹{b}. Tap Save settings.", { b: b }); }, function (err) { msg.textContent = T(err.message); });
    });
    on("#loadModels", "click", function () {
      var key = $("#f").groqKey.value.trim(), msg = $("#groqMsg");
      if (!key) { msg.textContent = T("Enter a key first."); return; }
      msg.textContent = T("Checking…");
      MB.groqModels(key).then(function (ids) {
        var sel = $("#f").groqModel, cur = sel.value;
        sel.innerHTML = '<option value="">' + T("Choose automatically") + "</option>" + ids.map(function (id) { return '<option value="' + E(id) + '"' + (id === cur ? " selected" : "") + ">" + E(id) + "</option>"; }).join("");
        msg.textContent = T("Key works: {n} models. Remember to save.", { n: ids.length });
      }).catch(function (err) { msg.textContent = err.name === "AbortError" ? T("Timed out (offline?)") : err.message; });
    });
    on("#testOllama", "click", function () {
      var url = $("#f").ollamaUrl.value.trim(), msg = $("#ollamaMsg");
      if (!url) { msg.textContent = T("Enter the address first."); return; }
      msg.textContent = T("Connecting…");
      MB.testOllama(url).then(function (m) { msg.textContent = T("Connected. Models: {list}", { list: m.join(", ") || "-" }); }, function () { msg.textContent = T("Could not connect. Check the address and Wi-Fi."); });
    });
    on("#clearCache", "click", function () { MB.clearCache().then(function () { flash(T("Cache cleared."), "success"); settingsView(user, {}); }); });
    on("#forgetPw", "click", function () {
      confirmSheet(T("Forget saved passwords?"), T("You will need to type your password next time."), T("Forget"), true).then(function (ok) {
        if (ok) { MB.save("mb_saved_logins", []); flash(T("Saved passwords removed."), "success"); settingsView(user, {}); }
      });
    });
    if (params && params.sms) setTimeout(function () { var c = $("#smsCard"); if (c) c.scrollIntoView({ block: "start" }); }, 50);
  }

  // ======================= FIRST START: choose a language =======================
  function languageView() {
    chrome(false, false); view.className = "";
    view.innerHTML = '<div class="welcome lang-first"><img class="logo-full" src="icons/logo-full.png" alt="MediBot">' +
      '<h1>Choose your language</h1><p class="muted">अपनी भाषा चुनें · ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ</p><div class="stack">' +
      MB.LANGS.map(function (l) { return '<button type="button" class="lang-big" data-pick="' + l[0] + '"><b>' + l[1] + "</b><small>" + l[2] + "</small></button>"; }).join("") + "</div></div>";
    $$("[data-pick]").forEach(function (b) { b.addEventListener("click", function () { MB.setLang(b.dataset.pick); buildTabs(); go("#/welcome"); }); });
  }

  // ======================= ROUTER =======================
  var PUBLIC = { welcome: welcomeView, login: loginView, register: registerView, verify: verifyView, forgot: forgotView, reset: resetView,
    checkemail: checkEmailView, complete: completeView, language: languageView };
  var TAB_OF = { home: "home", chat: "chat", history: "chat", library: "library", disease: "library", checker: "home", saved: "profile", bmi: "home", emergency: "emergency", profile: "profile", settings: "profile", changepw: "profile" };
  function parse() {
    var h = location.hash.replace(/^#\/?/, ""), qi = h.indexOf("?"), path = qi >= 0 ? h.slice(0, qi) : h, params = {};
    if (qi >= 0) h.slice(qi + 1).split("&").forEach(function (kv) { var p = kv.split("="); params[p[0]] = decodeURIComponent((p[1] || "").replace(/\+/g, " ")); });
    var parts = path.split("/");
    return { name: parts[0] || "", arg: decodeURIComponent(parts[1] || ""), params: params };
  }
  function render() {
    var r = parse(), user = MB.currentUser();
    updateStatus();
    var m = document.querySelector(".modal"); if (m) m.remove();
    if (!MB.settings().lang && r.name !== "language" && !user) return go("#/language");
    if (!r.name) return go(user ? "#/home" : (MB.load("mb_seen_welcome", false) ? "#/login" : "#/welcome"));
    if (r.name === "welcome") MB.save("mb_seen_welcome", true);
    if (PUBLIC[r.name]) {
      if (user && ["verify", "reset", "checkemail", "language"].indexOf(r.name) < 0) return go("#/home");
      if (user && r.name === "reset" && sessionStorage.getItem("mb_reset_ok") !== user.phone) return go("#/home");
      view.className = "container";
      return PUBLIC[r.name]();
    }
    if (!user && r.name === "settings") { view.className = "container"; return settingsView(null, r.params); }
    if (!user) return go(MB.load("mb_seen_welcome", false) ? "#/login" : "#/welcome");
    chrome(true, true);
    view.className = "container";
    Array.prototype.forEach.call(tabbar.querySelectorAll("a"), function (a) { a.classList.toggle("active", a.dataset.tab === (TAB_OF[r.name] || "home")); });
    window.scrollTo(0, 0);
    switch (r.name) {
      case "chat":
        chatView(user, r.arg);
        var pre = sessionStorage.getItem("mb_prefill");
        if (pre) { sessionStorage.removeItem("mb_prefill"); var q = $("#q"); if (q) { q.value = pre; q.focus(); } }
        return;
      case "history": return historyView(user);
      case "library": return libraryView(r.params);
      case "disease": return diseaseView(r.arg, user);
      case "checker": return checkerView(r.params);
      case "emergency": return emergencyView(user);
      case "bmi": return bmiView(user);
      case "saved": return savedView(user);
      case "profile": return profileView(user);
      case "changepw": return changePwView(user);
      case "settings": return settingsView(user, r.params);
      default: return homeView(user);
    }
  }
  window.addEventListener("hashchange", render);
  // Load saved accounts and settings from the phone's permanent storage first, then show the app.
  MB.restoreStorage().then(function () { MB.applyTheme(); buildTabs(); updateStatus(); render(); });

  // Splash screen, then fade out
  setTimeout(function () { var sp = document.getElementById("splash"); if (sp) { sp.classList.add("hide"); setTimeout(function () { sp.remove(); }, 500); } }, 1100);
  // Load the encyclopedia text in the background so the first answer is quick.
  setTimeout(function () { MB.ensurePassages().catch(function () {}); }, 1500);
  // Installable web app (PWA) for PC / iPhone. Not needed inside the Android app.
  if ("serviceWorker" in navigator && !window.Capacitor && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
