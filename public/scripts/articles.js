// articles.js

let groupedArticles = {};
let currentTitle = '';
let currentIndex = 0;

// Each alt version must use the same title but may have different slugs/descriptions/images
const allArticles = [
  {
    title: 'Battery Draining Fast',
    description: 'Common causes and solutions for excessive battery drain on devices.',
    image: 'https://cdn-icons-png.flaticon.com/512/3103/3103446.png',
    slug: 'battery-drainingfast',
  },
  {
    title: 'Battery Draining Fast',
    description: 'Discover why your battery drops significantly even when your device is idle.',
    image: 'https://cdn-icons-png.flaticon.com/512/3103/3103470.png',
    slug: 'battery-drainingfast-alt1',
  },
  {
    title: 'Battery Draining Fast',
    description: 'Learn why battery drain often appears after a software update and how to fix it.',
    image: 'https://cdn-icons-png.flaticon.com/512/3103/3103495.png',
    slug: 'battery-drainingfast-alt2',
  },
  {
    title: 'Screen Flickering',
    description: 'Understanding why screens flicker and how to fix it.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048929.png',
    slug: 'screen-flickering',
    tag: 'Hardware & Display'
  },
  {
    title: 'Screen Flickering',
    description: 'Identify and fix screen flicker issues that appear at lower brightness levels.',
    image: 'https://cdn-icons-png.flaticon.com/512/5826/5826131.png',
    slug: 'screen-flickering-alt1',
  },
  {
    title: 'Screen Flickering',
    description: 'Fix screen flicker problems that appear in specific applications or games.',
    image: 'https://cdn-icons-png.flaticon.com/512/5826/5826127.png',
    slug: 'screen-flickering-alt2',
  },
  {
    title: 'Overheating Device',
    description: 'Why devices overheat and steps to keep them cool.',
    image: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png',
    slug: 'overheating-device',
  },
  {
    title: 'Overheating Device',
    description: 'Learn why your device gets hot while charging and how to keep it cool.',
    image: 'https://cdn-icons-png.flaticon.com/512/4363/4363431.png',
    slug: 'overheating-device-alt1',
  },
  {
    title: 'Overheating Device',
    description: 'Reduce overheating issues while playing games on your phone or tablet.',
    image: 'https://cdn-icons-png.flaticon.com/512/4363/4363478.png',
    slug: 'overheating-device-alt2',
  },
  {
    title: 'Slow Performance',
    description: 'Causes of sluggish device performance and how to improve speed.',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    slug: 'slow-performance',
  },
  {
    title: 'Slow Performance',
    description: 'Speed up your device if it became sluggish after a recent update.',
    image: 'https://cdn-icons-png.flaticon.com/512/2920/2920320.png',
    slug: 'slow-performance-alt1',
  },
  {
    title: 'Slow Performance',
    description: 'Speed up slow-loading apps with these quick solutions.',
    image: 'https://cdn-icons-png.flaticon.com/512/1581/1581807.png',
    slug: 'slow-performance-alt2',
  },
  {
    title: 'Bluetooth Not Connecting',
    description: 'Troubleshooting Bluetooth pairing and connection issues.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png',
    slug: 'bluetooth-not-connecting',
  },
  {
    title: 'Bluetooth Not Connecting',
    description: 'Solve the issue when your Bluetooth device connects but audio doesn’t play.',
    image: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    slug: 'bluetooth-not-connecting-alt1',
  },
  {
    title: 'Bluetooth Not Connecting',
    description: 'Fix Bluetooth devices that randomly drop the connection.',
    image: 'https://cdn-icons-png.flaticon.com/512/4712/4712033.png',
    slug: 'bluetooth-not-connecting-alt2',
  },
  {
    title: 'Charging Problem',
    description: 'Identifying and fixing charging issues with electronic devices.',
    image: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png',
    slug: 'charging-problem',
  },
  {
    title: 'Charging Problem',
    description: 'Fix slow charging issues on your device for faster power-ups.',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828919.png',
    slug: 'charging-problem-alt1',
  },
  {
    title: 'Charging Problem',
    description: 'What to do when your battery refuses to charge past a specific level.',
    image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
    slug: 'charging-problem-alt2',
  },

  {
    title: 'Speaker Distortion',
    description: 'Reasons for distorted sound and how to restore clarity.',
    image: 'https://cdn-icons-png.flaticon.com/512/3792/3792210.png',
    slug: 'speaker-distortion',
  },
  {
    title: 'Speaker Distortion',
    description: 'Fix muffled or unclear sound from your device speakers.',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828961.png',
    slug: 'speaker-distortion-alt1',
  },
  {
    title: 'Speaker Distortion',
    description: 'Eliminate crackling or static noises from your speakers.',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828960.png',
    slug: 'speaker-distortion-alt2',
  },
  {
    title: 'Wi-Fi Disconnection',
    description: 'Why devices keep losing Wi-Fi connection and how to stabilize it.',
    image: 'https://cdn-icons-png.flaticon.com/512/2928/2928898.png',
    slug: 'wifi-disconnection',
  },
  {
    title: 'Wi-Fi Disconnection',
    description: 'Fix frequent Wi-Fi disconnection issues on your device.',
    image: 'https://cdn-icons-png.flaticon.com/512/483/483947.png',
    slug: 'wifi-disconnection-alt1',
  },
  {
    title: 'Wi-Fi Disconnection',
    description: 'Troubleshoot when your device connects to Wi-Fi but has no internet.',
    image: 'https://cdn-icons-png.flaticon.com/512/483/483947.png',
    slug: 'wifi-disconnection-alt2',
  },

  {
    title: 'Touchscreen Unresponsive',
    description: 'Causes of unresponsive touchscreens and quick fixes.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048986.png',
    slug: 'touchscreen-unresponsive',
  },
  {
    title: 'Touchscreen Unresponsive',
    description: 'How to restore touchscreen responsiveness on your device.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048986.png',
    slug: 'touchscreen-unresponsive-alt1',
  },
  {
    title: 'Touchscreen Unresponsive',
    description: 'Fix inconsistent or ghost touches on your device’s screen.',
    image: 'https://cdn-icons-png.flaticon.com/512/1048/1048986.png',
    slug: 'touchscreen-unresponsive-alt2',
  },

  {
    title: 'Camera Not Working',
    description: 'Fixing camera malfunctions and identifying possible causes.',
    image: 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png',
    slug: 'camera-notworking',
  },
  {
    title: 'Camera Not Working',
    description: 'Troubleshoot when your device camera fails to open or crashes.',
    image: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
    slug: 'camera-notworking-alt1',
  },
  {
    title: 'Camera Not Working',
    description: 'Fix when your camera opens but only shows a black screen.',
    image: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
    slug: 'camera-notworking-alt2',
  },
];


// Group articles by title
groupedArticles = allArticles.reduce((acc, article) => {
  if (!acc[article.title]) acc[article.title] = [];
  acc[article.title].push(article);
  return acc;
}, {});

function selectArticle(element, title, description, image, slug) {
  currentTitle = title;
  currentIndex = 0;

  updateArticleCard(groupedArticles[title][currentIndex]);

  document.querySelectorAll('.list-item').forEach((el) =>
    el.classList.remove('active')
  );
  element.classList.add('active');
}

function showNextArticle() {
  if (!currentTitle || !groupedArticles[currentTitle]) return;

  currentIndex = (currentIndex + 1) % groupedArticles[currentTitle].length;
  updateArticleCard(groupedArticles[currentTitle][currentIndex]);
}

function showPrevArticle() {
  if (!currentTitle || !groupedArticles[currentTitle]) return;

  currentIndex =
    (currentIndex - 1 + groupedArticles[currentTitle].length) %
    groupedArticles[currentTitle].length;
  updateArticleCard(groupedArticles[currentTitle][currentIndex]);
}

function updateArticleCard(article) {
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleDesc').textContent = article.description;
  document.getElementById('articleImg').src = article.image;
  document
    .getElementById('articleCard')
    .setAttribute('onclick', `openFullArticle('${article.slug}')`);
}

function openFullArticle(slug = null) {
  if (!slug && currentTitle && groupedArticles[currentTitle]) {
    slug = groupedArticles[currentTitle][currentIndex].slug;
  }
  if (slug) window.location.href = `/blogs/${slug}`;
}

// --- Tag Filtering (unchanged) ---
function filterByTag(tag) {
  const listItems = document.querySelectorAll('#articleList li');
  document.querySelectorAll('.tag-btn').forEach((btn) =>
    btn.classList.remove('active')
  );
  document
    .querySelector(`.tag-btn[data-tag="${tag}"]`)
    .classList.add('active');

  listItems.forEach((item) => {
    const itemTags = item.getAttribute('data-tags').split(',');
    if (tag === 'All' || itemTags.includes(tag)) {
      item.style.display = 'list-item';
    } else {
      item.style.display = 'none';
    }
  });
}

// --- Search Filter ---
function filterArticles() {
  const query = document
    .getElementById('searchInput')
    .value.toLowerCase()
    .trim();
  const listItems = document.querySelectorAll('#articleList li');

  listItems.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? 'list-item' : 'none';
  });
}


