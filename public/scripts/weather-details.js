document.addEventListener("click", (event) => {
  const pluie = event.target.closest(".meteo-detail-pluie:not([disabled])");
  if (!pluie) return;

  const estOuvert = pluie.classList.toggle("ouverte");
  pluie.setAttribute("aria-expanded", String(estOuvert));
});
