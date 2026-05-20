const menuBtn = document.getElementById("menu-btn");
const menuHamburger = document.getElementById("menu-hamburger");

menuBtn.addEventListener("click", () => {
  menuHamburger.classList.toggle("active");
});