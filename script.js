const keyInput = document.getElementById('key-input');
const btnValidate = document.getElementById('btn-validate');
const logBox = document.getElementById('log');

const loginSection = document.getElementById('login-section');
const statusSection = document.getElementById('status-section');
const functionsSection = document.getElementById('functions-section');

const keyStatusSpan = document.getElementById('key-status');
const countdownSpan = document.getElementById('countdown');

const funcCheckboxes = document.querySelectorAll('input[type="checkbox"][data-func]');

const bubbleContainer = document.getElementById('bubble-container');

const toast = document.getElementById('toast');
const btnLogout = document.getElementById('btn-logout');

let countdownInterval = null;

// Blacklist key đã logout
let blacklistKeys = JSON.parse(localStorage.getItem('blacklistKeys') || '[]');

// Hiển thị log
function log(message) {
  const now = new Date();
  const time = now.toLocaleTimeString();
  logBox.textContent = `[${time}] ${message}\n` + logBox.textContent;
}

// Hiển thị toast thông báo bật/tắt chức năng hoặc cảnh báo
function showToast(msg, duration = 2200) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Kiểm tra key có trong blacklist không
function isBlacklisted(key) {
  return blacklistKeys.includes(key);
}

// Thêm key vào blacklist
function addBlacklist(key) {
  if (!blacklistKeys.includes(key)) {
    blacklistKeys.push(key);
    localStorage.setItem('blacklistKeys', JSON.stringify(blacklistKeys));
  }
}

// Kiểm tra key hợp lệ, định dạng: NARU-<số ngày>
function validateKeyFormat(key) {
  if (!key.startsWith('NARU-')) return false;
  const dayPart = key.slice(5).trim();
  const dayNum = parseInt(dayPart, 10);
  return dayNum > 0 && !isNaN(dayNum);
}

// Lấy số ngày từ key
function getDaysFromKey(key) {
  return parseInt(key.slice(5).trim(), 10);
}

// Lưu key và expire vào localStorage
function saveKey(key, days) {
  const now = Date.now();
  const expireAt = now + days * 24 * 60 * 60 * 1000;
  localStorage.setItem('app_key', key);
  localStorage.setItem('app_expire', expireAt);
}

// Xóa key và reset trạng thái
function clearKey() {
  localStorage.removeItem('app_key');
  localStorage.removeItem('app_expire');
  funcCheckboxes.forEach(chk => chk.checked = false);
  updateFuncCheckboxes(false);
}

// Kiểm tra key còn hiệu lực không
function isKeyValid() {
  const key = localStorage.getItem('app_key');
  const expire = Number(localStorage.getItem('app_expire') || 0);
  if (!key || !expire) return false;
  return Date.now() < expire;
}

// Cập nhật trạng thái checkbox chức năng có thể chọn hay không
function updateFuncCheckboxes(enabled) {
  funcCheckboxes.forEach(chk => {
    chk.disabled = !enabled;
    if (!enabled) chk.checked = false;
  });
}

// Định dạng thời gian đếm ngược
function formatTime(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Bắt đầu đếm ngược
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    const expire = Number(localStorage.getItem('app_expire') || 0);
    const now = Date.now();
    const remain = expire - now;

    if (remain <= 0) {
      clearInterval(countdownInterval);
      log("🔴 Key đã hết hạn. Vui lòng nhập lại key mới.");
      keyStatusSpan.textContent = "OFFLINE";
      countdownSpan.textContent = "00:00:00";
      updateFuncCheckboxes(false);
      functionsSection.classList.add('hidden');
      statusSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      clearKey();
      stopEffects();
      return;
    }

    countdownSpan.textContent = formatTime(remain);
  }, 1000);
}

// Tạo bong bóng
function createBubble() {
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  const size = Math.random() * 20 + 10; // 10px đến 30px
  bubble.style.width = size + 'px';
  bubble.style.height = size + 'px';

  bubble.style.left = Math.random() * 100 + '%';
  bubble.style.animationDuration = (Math.random() * 10 + 5) + 's'; // 5-15s
  bubble.style.animationDelay = (Math.random() * 10) + 's';

  bubbleContainer.appendChild(bubble);

  // Xóa sau khi animation kết thúc
  setTimeout(() => {
    bubble.remove();
  }, 15000);
}

// Tạo nhiều bong bóng liên tục
let bubbleInterval = null;
function startBubbles() {
  if(bubbleInterval) clearInterval(bubbleInterval);
  bubbleInterval = setInterval(createBubble, 700);
}

// Dừng tạo bong bóng
function stopBubbles() {
  if(bubbleInterval) clearInterval(bubbleInterval);
  bubbleContainer.innerHTML = '';
}

// Bật hiệu ứng nền cầu vồng + bong bóng
function startEffects() {
  document.body.classList.add('rainbow-bg');
  startBubbles();
}

// Tắt hiệu ứng nền cầu vồng + bong bóng
function stopEffects() {
  document.body.classList.remove('rainbow-bg');
  stopBubbles();
}

// Mở giao diện khi key đúng
function openAppWithKey(key) {
  log(`✅ Key hợp lệ: ${key}`);
  keyStatusSpan.textContent = "ONLINE";
  statusSection.classList.remove('hidden');
  functionsSection.classList.remove('hidden');
  loginSection.classList.add('hidden');
  updateFuncCheckboxes(true);
  startCountdown();
  startEffects();
}

// Sự kiện nút xác nhận key
btnValidate.addEventListener('click', () => {
  const rawKey = keyInput.value.trim().toUpperCase();

  if (!rawKey) {
    log("⚠️ Vui lòng nhập key!");
    return;
  }

  if (!validateKeyFormat(rawKey)) {
    log("❌ Key không hợp lệ! Phải bắt đầu bằng 'NARU-' theo sau là số ngày.");
    return;
  }

  if (isBlacklisted(rawKey)) {
    log("⚠️ Key này đã bị đăng xuất và không thể đăng nhập lại.");
    showToast("Key đã bị khóa, liên hệ admin để cấp lại");
    return;
  }

  const days = getDaysFromKey(rawKey);
  saveKey(rawKey, days);
  openAppWithKey(rawKey);
});

// Sự kiện bật/tắt chức năng, hiển thị toast
funcCheckboxes.forEach(chk => {
  chk.addEventListener('change', () => {
    const funcName = chk.dataset.func.toUpperCase();
    showToast(`${chk.checked ? 'Bật' : 'Tắt'} chức năng ${funcName}`);
  });
});

// Sự kiện nút đăng xuất key
btnLogout.addEventListener('click', () => {
  const currentKey = localStorage.getItem('app_key');
  if (currentKey) {
    addBlacklist(currentKey);  // Thêm key hiện tại vào blacklist
  }
  clearKey();
  keyStatusSpan.textContent = "OFFLINE";
  countdownSpan.textContent = "00:00:00";
  updateFuncCheckboxes(false);
  functionsSection.classList.add('hidden');
  statusSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  stopEffects();
  log("🔴 Đã đăng xuất key. Key này sẽ không thể đăng nhập lại.");
  showToast("Bạn đã đăng xuất. Key này không thể đăng nhập lại.", 3500);
});

// Khi load trang, kiểm tra key còn hiệu lực để tự mở
window.addEventListener('load', () => {
  if (isKeyValid()) {
    const key = localStorage.getItem('app_key');
    if (isBlacklisted(key)) {
      clearKey();
      log("⚠️ Key hiện tại đã bị khóa do đăng xuất trước đó.");
      keyStatusSpan.textContent = "OFFLINE";
      statusSection.classList.add('hidden');
      functionsSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
      stopEffects();
      return;
    }
    openAppWithKey(key);
  } else {
    clearKey();
    keyStatusSpan.textContent = "OFFLINE";
    statusSection.classList.add('hidden');
    functionsSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    stopEffects();
  }
});