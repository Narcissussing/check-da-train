// =========================================================
// LOOKULOOKU — bascule de thème (Bureau ↔ Cinéma)
// =========================================================

const SVG_SOLEIL =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';
const SVG_LUNE =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>';

// Met à jour l'icône et le label du bouton selon le thème actif
function mettreAJourBouton(theme) {
  bouton.innerHTML = theme === "bureau" ? SVG_LUNE : SVG_SOLEIL;
  bouton.setAttribute(
    "aria-label",
    theme === "bureau" ? "Passer en mode Cinéma" : "Passer en mode Bureau"
  );
}

// On lit le thème stocké, sinon "bureau" par défaut
const themeActuel = localStorage.getItem("theme") || "bureau";
document.documentElement.setAttribute("data-theme", themeActuel);

// On déclare le bouton AVANT d'utiliser la fonction qui le lit
const bouton = document.querySelector(".theme-toggle");

// On met à jour l'icône au chargement
if (bouton) mettreAJourBouton(themeActuel);

// Au clic, on bascule entre les deux thèmes
if (bouton) {
  bouton.addEventListener("click", () => {
    const courant = document.documentElement.getAttribute("data-theme");
    const nouveau = courant === "bureau" ? "cinema" : "bureau";

    document.documentElement.setAttribute("data-theme", nouveau);
    localStorage.setItem("theme", nouveau);
    mettreAJourBouton(nouveau);
  });
}
