let currentSlug = "password-reset";

window.selectArticle = function (element, title, desc, imgSrc, slug) {
  document.querySelectorAll("#articleList .list-group-item").forEach(item => {
    item.classList.remove("active");
  });
  element.classList.add("active");

  const card = document.getElementById("articleCard");
  card.classList.add("fade-out");

  setTimeout(() => {
    document.getElementById("articleTitle").innerText = title;
    document.getElementById("articleDesc").innerText = desc;
    document.getElementById("articleImg").src = imgSrc;
    card.classList.remove("fade-out");
  }, 400);

  currentSlug = slug;
};

window.openFullArticle = function () {
  window.location.href = `/article?article=${currentSlug}`;
};
