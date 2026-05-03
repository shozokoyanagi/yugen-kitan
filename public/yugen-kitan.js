const depthStops = [0.18, 0.42, 0.7];

function updateDepth() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;

  if (scrollable <= 0) {
    document.body.dataset.depth = "0";
    document.body.style.setProperty("--scroll-progress", "0");
    return;
  }

  const progress = window.scrollY / scrollable;
  let depth = 0;

  depthStops.forEach((stop, index) => {
    if (progress >= stop) {
      depth = index + 1;
    }
  });

  document.body.dataset.depth = String(depth);
  document.body.style.setProperty("--scroll-progress", progress.toFixed(3));
}

updateDepth();
window.addEventListener("scroll", updateDepth, { passive: true });
window.addEventListener("resize", updateDepth);
