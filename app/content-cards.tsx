"use client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Item, Project } from "./portfolio-data";
import { useLanguage } from "./language-provider";
function Card({ item, detail }: { item: Item; detail?: string }) { const { language } = useLanguage(); return <article className="content-card"><p className="card-category">{item.category}</p><h3>{item.title}</h3><p>{item.description}</p>{detail && <p className="card-detail">{detail}</p>}<div className="tag-list">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>{item.status === "coming-soon" ? <span className="status">{language === "vi" ? "Sắp ra mắt" : "Coming soon"}</span> : <Link href={item.href} className="text-link">{language === "vi" ? "Khám phá" : "Explore"}<ArrowUpRight size={16} /></Link>}</article>; }
export function ProjectCards({ items }: { items: Project[] }) { return <div className="content-grid">{items.map((item) => <Card key={item.id} item={item} detail={item.outcome} />)}</div>; }
export function ItemCards({ items }: { items: Item[] }) { return <div className="content-grid compact-grid">{items.map((item) => <Card key={item.id} item={item} />)}</div>; }
