const DIX_MINUTES = 10 * 60 * 1000;

function progressionBus(depart, arrivee, maintenant) {
  if (maintenant < depart) {
    return Math.max(0, 0.12 * (1 - (depart - maintenant) / DIX_MINUTES));
  }
  if (maintenant >= arrivee) return 0.88;
  return 0.12 + 0.76 * ((maintenant - depart) / (arrivee - depart));
}

function positionnerBus() {
  document.querySelectorAll(".bus-parcours").forEach(function (parcours) {
    const bus = parcours.querySelector(".bus-mobile");
    const avancee = parcours.querySelector(".bus-progression");
    const etat = parcours.querySelector(".bus-etat");
    const depart = new Date(parcours.dataset.depart).getTime();
    const arrivee = new Date(parcours.dataset.arrivee).getTime();
    if (!bus || !Number.isFinite(depart) || !Number.isFinite(arrivee)) return;

    const maintenant = Date.now();
    const largeur = Math.max(0, parcours.clientWidth - bus.offsetWidth);
    const progression = progressionBus(depart, arrivee, maintenant);
    bus.style.transform = `translate3d(${(largeur * progression).toFixed(2)}px, 0, 0)`;
    if (avancee) avancee.style.transform = `scaleX(${progression.toFixed(4)})`;

    parcours.classList.remove("bus-approche", "bus-en-route", "bus-arrive");
    if (maintenant < depart) {
      parcours.classList.add("bus-approche");
      if (etat) etat.textContent = "Approche";
    } else if (maintenant < arrivee) {
      parcours.classList.add("bus-en-route");
      if (etat) etat.textContent = "En route";
    } else {
      parcours.classList.add("bus-arrive");
      if (etat) etat.textContent = "Arrivé";
    }
  });
}

positionnerBus();
setInterval(positionnerBus, 1000);
window.addEventListener("resize", positionnerBus);
document.addEventListener("click", function (event) {
  if (event.target.closest("[data-toggle-target='bus-retour-popup']")) {
    setTimeout(positionnerBus, 0);
  }
});
