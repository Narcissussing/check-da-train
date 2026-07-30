function manqueDePlace(creneau) {
  return (
    window.matchMedia("(max-width: 700px)").matches ||
    Array.from(creneau.querySelectorAll(".train-creneau")).some(
      (train) => train.scrollWidth > train.clientWidth,
    )
  );
}

document.addEventListener("click", (event) => {
  const creneau = event.target.closest(".creneau");
  if (creneau && manqueDePlace(creneau)) {
    creneau.classList.toggle("deplie");
  }
});
