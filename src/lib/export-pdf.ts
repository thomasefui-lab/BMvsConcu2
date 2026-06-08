"use client";

import { jsPDF } from "jspdf";
import type { ProductTreeData, BestSellerProduct } from "./types";
import type { SiteId } from "./types";

// Brand colours (brand-700 / slate palette)
const C = {
  brand: [30, 64, 175] as [number, number, number],
  brandLight: [199, 210, 254] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  mid: [71, 85, 105] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  rowAlt: [248, 250, 252] as [number, number, number],
  macroRow: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  headerBg: [15, 23, 42] as [number, number, number],
};

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

function rgb(doc: jsPDF, fill: boolean, c: [number, number, number]) {
  if (fill) doc.setFillColor(...c);
  else doc.setTextColor(...c);
}

function pageHeader(doc: jsPDF, title: string, subtitle: string): number {
  // Dark band
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, PAGE_W, 26, "F");
  // Brand accent stripe
  doc.setFillColor(...C.brand);
  doc.rect(0, 26, PAGE_W, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  rgb(doc, false, C.white);
  doc.text(title, MARGIN, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  rgb(doc, false, C.brandLight);
  doc.text(subtitle, MARGIN, 20);

  // Date top-right
  doc.setFontSize(7);
  rgb(doc, false, C.muted);
  doc.text(new Date().toLocaleDateString("fr-FR"), PAGE_W - MARGIN, 20, { align: "right" });

  return 38;
}

function pageFooter(doc: jsPDF, pageNum: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  rgb(doc, false, C.muted);
  doc.text("Best Mobilier — Veille concurrentielle", MARGIN, PAGE_H - 6);
  doc.text(`${pageNum}`, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
}

// ─── TREE PAGE ────────────────────────────────────────────────────────────────

function drawTreePage(doc: jsPDF, tree: ProductTreeData, pageNum: number) {
  let y = pageHeader(
    doc,
    `Arborescence — ${tree.label}`,
    `${tree.total.toLocaleString("fr-FR")} références  ·  ${tree.totalCollections.toLocaleString("fr-FR")} collections`,
  );

  for (const macro of tree.categories) {
    if (y > PAGE_H - 28) {
      pageFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      y = 20;
    }

    // Macro row
    rgb(doc, true, C.macroRow);
    doc.roundedRect(MARGIN, y - 4, CONTENT_W, 9, 1.2, 1.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    rgb(doc, false, C.dark);
    doc.text(macro.label.toUpperCase(), MARGIN + 4, y + 1.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    rgb(doc, false, C.mid);
    doc.text(
      `${macro.count} réf. — ${macro.percent} %`,
      PAGE_W - MARGIN - 2,
      y + 1.5,
      { align: "right" },
    );

    y += 12;

    for (let i = 0; i < macro.subcategories.length; i++) {
      if (y > PAGE_H - 22) {
        pageFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        y = 20;
      }

      const sub = macro.subcategories[i];
      const isLast = i === macro.subcategories.length - 1;

      // Tree lines
      doc.setDrawColor(...C.muted);
      doc.setLineWidth(0.25);
      if (!isLast) doc.line(MARGIN + 8, y - 2.5, MARGIN + 8, y + 4);
      else doc.line(MARGIN + 8, y - 2.5, MARGIN + 8, y + 1);
      doc.line(MARGIN + 8, y + 1, MARGIN + 14, y + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      rgb(doc, false, C.dark);
      doc.text(sub.label, MARGIN + 17, y + 2);

      rgb(doc, false, C.muted);
      doc.text(`${sub.count}`, PAGE_W - MARGIN - 2, y + 2, { align: "right" });

      y += 7;
    }

    y += 5;
  }

  pageFooter(doc, pageNum);
  return pageNum;
}

// ─── BEST SELLERS PAGE ────────────────────────────────────────────────────────

function drawTableHeader(doc: jsPDF, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  rgb(doc, false, C.muted);
  doc.text("#", MARGIN + 1, y);
  doc.text("Produit", MARGIN + 9, y);
  doc.text("Catégorie", MARGIN + 118, y);
  doc.text("Prix", MARGIN + 152, y);
  doc.text("Avis", PAGE_W - MARGIN - 1, y, { align: "right" });

  doc.setDrawColor(...C.muted);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 1.5, PAGE_W - MARGIN, y + 1.5);
  return y + 5;
}

function drawBestSellersSection(
  doc: jsPDF,
  sectionTitle: string,
  subtitle: string,
  items: BestSellerProduct[],
  startY: number,
  pageNum: number,
): { y: number; pageNum: number } {
  let y = startY + 4;

  if (y > PAGE_H - 60) {
    pageFooter(doc, pageNum);
    doc.addPage();
    pageNum++;
    y = 20;
  }

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  rgb(doc, false, C.brand);
  doc.text(sectionTitle, MARGIN, y);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  rgb(doc, false, C.muted);
  doc.text(subtitle, MARGIN, y + 4.5);
  y += 11;

  y = drawTableHeader(doc, y);

  for (let i = 0; i < items.length; i++) {
    if (y > PAGE_H - 16) {
      pageFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      y = 20;
      y = drawTableHeader(doc, y);
    }

    const p = items[i];
    if (i % 2 === 0) {
      rgb(doc, true, C.rowAlt);
      doc.rect(MARGIN, y - 3.5, CONTENT_W, 7, "F");
    }

    // Rank
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    rgb(doc, false, C.brand);
    doc.text(`${i + 1}`, MARGIN + 3, y + 0.5, { align: "center" });

    // Name (truncated to fit)
    const maxName = 55;
    const name =
      p.product_name.length > maxName
        ? p.product_name.slice(0, maxName - 1) + "…"
        : p.product_name;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    rgb(doc, false, C.dark);
    doc.text(name, MARGIN + 9, y + 0.5);

    // Category
    const maxCat = 22;
    const cat = (p.category_name ?? "").length > maxCat
      ? (p.category_name ?? "").slice(0, maxCat - 1) + "…"
      : (p.category_name ?? "—");
    rgb(doc, false, C.mid);
    doc.text(cat, MARGIN + 118, y + 0.5);

    // Price
    doc.text(p.price_text ?? "—", MARGIN + 152, y + 0.5);

    // Review count
    doc.setFont("helvetica", "bold");
    rgb(doc, false, C.dark);
    doc.text(`${p.review_count.toLocaleString("fr-FR")}`, PAGE_W - MARGIN - 1, y + 0.5, {
      align: "right",
    });

    y += 7;
  }

  return { y: y + 4, pageNum };
}

function drawBestSellersPage(
  doc: jsPDF,
  label: string,
  reviews: BestSellerProduct[],
  growth: BestSellerProduct[],
  pageNum: number,
): number {
  let y = pageHeader(
    doc,
    `Best Sellers — ${label}`,
    "Top 10 par nombre d'avis  ·  Top 10 par évolution d'avis",
  );

  ({ y, pageNum } = drawBestSellersSection(
    doc,
    "TOP 10 PAR NOMBRE D'AVIS",
    "Produits les plus commentés",
    reviews,
    y,
    pageNum,
  ));

  ({ y, pageNum } = drawBestSellersSection(
    doc,
    "TOP 10 PAR ÉVOLUTION D'AVIS",
    "Momentum — produits qui accélèrent",
    growth,
    y,
    pageNum,
  ));

  pageFooter(doc, pageNum);
  return pageNum;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function exportPDF(
  trees: ProductTreeData[],
  byReviews: Record<SiteId, BestSellerProduct[]>,
  byGrowth: Record<SiteId, BestSellerProduct[]>,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let pageNum = 1;
  let first = true;

  for (const tree of trees) {
    if (!first) {
      doc.addPage();
      pageNum++;
    }
    first = false;

    pageNum = drawTreePage(doc, tree, pageNum);

    const reviews = byReviews[tree.site] ?? [];
    const growth = byGrowth[tree.site] ?? [];
    if (reviews.length > 0 || growth.length > 0) {
      doc.addPage();
      pageNum++;
      pageNum = drawBestSellersPage(doc, tree.label, reviews, growth, pageNum);
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`veille-concurrentielle-${date}.pdf`);
}
