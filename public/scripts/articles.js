let currentSlug = "password-reset";

function selectArticle(el, title, desc, img, slug) {
  const items = document.querySelectorAll('.list-item');
  items.forEach(item => item.classList.remove('active'));
  el.classList.add('active');

  document.getElementById('articleTitle').textContent = title;
  document.getElementById('articleDesc').textContent = desc;
  document.getElementById('articleImg').src = img;


  currentSlug = slug;
}

window.openFullArticle = function () {
  window.location.href = `/blogs/${currentSlug}`;
};
