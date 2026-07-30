function basculerCreneau(creneau) {
  const doitOuvrir = !creneau.classList.contains("deplie");

  if (doitOuvrir) {
    Array.from(document.querySelectorAll(".creneau.deplie")).forEach(
      (autreCreneau) => {
        if (autreCreneau === creneau) return;
        autreCreneau.classList.remove("deplie");
        autreCreneau.setAttribute("aria-expanded", "false");
      },
    );
  }

  creneau.classList.toggle("deplie", doitOuvrir);
  creneau.setAttribute("aria-expanded", String(doitOuvrir));
}

document.addEventListener("click", (event) => {
  const creneau = event.target.closest(".creneau");
  if (creneau) basculerCreneau(creneau);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const creneau = event.target.closest(".creneau");
  if (!creneau || event.target !== creneau) return;

  event.preventDefault();
  basculerCreneau(creneau);
});
