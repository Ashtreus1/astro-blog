// articles.js

let groupedArticles = {};
let currentTitle = '';
let currentIndex = 0;

// Each alt version must use the same title but may have different slugs/descriptions/images
const allArticles = [
  {
    title: 'Password Reset',
    description: 'This teaches you on how to reset your password',
    image: 'https://cdn-icons-png.flaticon.com/512/3064/3064197.png',
    slug: 'password-reset',
  },
  {
    title: 'Password Reset',
    description: 'Alternative method to securely reset your password via email.',
    image: 'https://cdn-icons-png.flaticon.com/512/3064/3064197.png',
    slug: 'password-reset-alt1',
  },
  {
    title: 'Password Reset',
    description: 'Steps to reset your password when locked out of your account.',
    image: 'https://cdn-icons-png.flaticon.com/512/3064/3064197.png',
    slug: 'password-reset-alt2',
  },
  {
    title: 'Where can I view my ticket history?',
    description: 'Steps to access and view all your past support tickets.',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828961.png',
    slug: 'ticket-history',
  },
  {
    title: 'Where can I view my ticket history?',
    description: 'Learn where to find your full ticket archive.',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828961.png',
    slug: 'ticket-history-alt1',
  },
  {
    title: 'Where can I view my ticket history?',
    description: 'View closed, pending, and active tickets in one place.',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828961.png',
    slug: 'ticket-history-alt2',
  },
  {
    title: 'How do I update my payment method?',
    description: 'Guide to updating your billing and payment information.',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
    slug: 'update-payment',
  },
  {
    title: 'How do I update my payment method?',
    description: 'Changing payment methods linked to your account.',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
    slug: 'update-payment-alt1',
  },
  {
    title: 'How do I update my payment method?',
    description: 'Follow this guide to change or update your saved payment details.',
    image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
    slug: 'update-payment-alt2',
  },

  {
    title: 'Can I update or edit my ticket after submitting it?',
    description: 'Learn how to update or add more details to a submitted ticket.',
    image: 'https://cdn-icons-png.flaticon.com/512/1250/1250615.png',
    slug: 'edit-ticket',
  },
  {
    title: 'Can I update or edit my ticket after submitting it?',
    description: 'Edit your support ticket even after sending it – here’s how.',
    image: 'https://cdn-icons-png.flaticon.com/512/1250/1250615.png',
    slug: 'edit-ticket-alt1',
  },
  {
    title: 'Can I update or edit my ticket after submitting it?',
    description: 'Accidentally submitted the wrong info? Update your support ticket fast.',
    image: 'https://cdn-icons-png.flaticon.com/512/1250/1250615.png',
    slug: 'edit-ticket-alt2',
  },

  {
    title: 'How long does it take to receive a response?',
    description: 'Typical response times for submitted tickets.',
    image: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
    slug: 'response-time',
  },
  {
    title: 'How long does it take to receive a response?',
    description: 'Understand how fast we respond and why delays sometimes happen.',
    image: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
    slug: 'response-time-alt1',
  },
  {
    title: 'How long does it take to receive a response?',
    description: 'We break down how quickly you’ll hear back from our support team.',
    image: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
    slug: 'response-time-alt2',
  },

  {
    title: 'How do I submit a ticket?',
    description: 'Step-by-step guide on submitting a new support ticket.',
    image: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    slug: 'submit-ticket',
  },
  {
    title: 'How do I submit a ticket?',
    description: 'Need help? Here’s how to send a support ticket the right way.',
    image: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    slug: 'submit-ticket-alt1',
  },
  {
    title: 'How do I submit a ticket?',
    description: 'New to support? Follow these easy steps to get help fast.',
    image: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    slug: 'submit-ticket-alt2',
  },

  {
    title: 'What information should I include in my support ticket?',
    description: 'Best practices for writing a complete and effective support ticket.',
    image: 'https://cdn-icons-png.flaticon.com/512/709/709496.png',
    slug: 'ticket-information',
  },
  {
    title: 'What information should I include in my support ticket?',
    description: 'Help us help you better – what to write in your support ticket.',
    image: 'https://cdn-icons-png.flaticon.com/512/709/709496.png',
    slug: 'ticket-information-alt1',
  },
  {
    title: 'What information should I include in my support ticket?',
    description: 'Tips on what details make your support request more effective.',
    image: 'https://cdn-icons-png.flaticon.com/512/709/709496.png',
    slug: 'ticket-information-alt2',
  },

  {
    title: 'How do I track the status of my ticket?',
    description: 'Ways to monitor the progress and status of your active support tickets.',
    image: 'https://cdn-icons-png.flaticon.com/512/709/709690.png',
    slug: 'track-ticket',
  },
  {
    title: 'How do I track the status of my ticket?',
    description: 'Track your support request and stay updated on progress.',
    image: 'https://cdn-icons-png.flaticon.com/512/709/709690.png',
    slug: 'track-ticket-alt1',
  },
  {
    title: 'How do I track the status of my ticket?',
    description: 'Learn how to track updates and changes to your ticket.',
    image: 'https://cdn-icons-png.flaticon.com/512/709/709690.png',
    slug: 'track-ticket-alt2',
  },

  {
    title: 'Issues that affect usability but don’t block core functions.',
    description: 'Learn what issues impact usability and how to address them.',
    image: 'https://cdn-icons-png.flaticon.com/512/565/565491.png',
    slug: 'usability-issues',
  },
  {
    title: 'Issues that affect usability but don’t block core functions.',
    description: 'These don’t stop you from using the system, but they matter.',
    image: 'https://cdn-icons-png.flaticon.com/512/565/565491.png',
    slug: 'usability-issues-alt1',
  },
  {
    title: 'Issues that affect usability but don’t block core functions.',
    description: 'Understand how small usability issues can impact the user experience.',
    image: 'https://cdn-icons-png.flaticon.com/512/565/565491.png',
    slug: 'usability-issues-alt2',
  },

  {
    title: 'Where can I view my invoices?',
    description: 'Learn where to locate and download all your past invoices.',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png',
    slug: 'view-invoices',
  },
  {
    title: 'Where can I view my invoices?',
    description: 'We show you where to find your billing records and invoices.',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png',
    slug: 'view-invoices-alt1',
  },
  {
    title: 'Where can I view my invoices?',
    description: 'Quick instructions to help you review your invoice history.',
    image: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png',
    slug: 'view-invoices-alt2',
  }
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


