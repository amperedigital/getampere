function toggleMenu(trigger) {
    const menu = document.getElementById("mobile-menu");
    if (!menu) return;
    menu.classList.toggle("translate-x-full");
    const nowOpen = !menu.classList.contains("translate-x-full");
    const button =
        trigger?.classList?.contains("amp-hamburger") ?
            trigger :
            document.querySelector(".amp-hamburger[data-role='toggle']");
    if (button) {
        button.classList.toggle("is-open", nowOpen);
    }
}
