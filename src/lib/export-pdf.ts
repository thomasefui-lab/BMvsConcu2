"use client";

export async function exportTreesPDF(elements: HTMLElement[]) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const PAGE_W = 297;
  const PAGE_H = 210;

  for (let i = 0; i < elements.length; i++) {
    const canvas = await html2canvas(elements[i], {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#f8fafc",
    });

    // proportionnel, centré sur la page
    let drawW = PAGE_W;
    let drawH = (canvas.height * PAGE_W) / canvas.width;
    if (drawH > PAGE_H) {
      drawH = PAGE_H;
      drawW = (canvas.width * PAGE_H) / canvas.height;
    }
    const xOff = (PAGE_W - drawW) / 2;
    const yOff = (PAGE_H - drawH) / 2;

    if (i > 0) doc.addPage();
    doc.addImage(canvas.toDataURL("image/png"), "PNG", xOff, yOff, drawW, drawH);
  }

  doc.save(`arborescences-${new Date().toISOString().slice(0, 10)}.pdf`);
}
