import { MetadataRoute } from "next";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [workshopsResult, pathsResult, instructorsResult] = await Promise.all([
    pool.query<{ id: string; updated_at: string }>(
      `SELECT id, updated_at FROM workshops WHERE status = 'published' ORDER BY updated_at DESC LIMIT 5000`
    ),
    pool.query<{ id: string; updated_at: string }>(
      `SELECT id, updated_at FROM learning_paths WHERE status = 'published' ORDER BY updated_at DESC LIMIT 2000`
    ),
    pool.query<{ id: string; updated_at: string }>(
      `SELECT u.id, MAX(w.updated_at) AS updated_at
       FROM users u
       JOIN workshops w ON w.instructor_id = u.id AND w.status = 'published'
       WHERE u.role = 'instructor'
       GROUP BY u.id
       ORDER BY updated_at DESC
       LIMIT 2000`
    ),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/marketplace`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/paths`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const workshopRoutes: MetadataRoute.Sitemap = workshopsResult.rows.map((w) => ({
    url: `${APP_URL}/workshops/${w.id}`,
    lastModified: new Date(w.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pathRoutes: MetadataRoute.Sitemap = pathsResult.rows.map((p) => ({
    url: `${APP_URL}/paths/${p.id}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const instructorRoutes: MetadataRoute.Sitemap = instructorsResult.rows.map((i) => ({
    url: `${APP_URL}/instructors/${i.id}`,
    lastModified: i.updated_at ? new Date(i.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...workshopRoutes, ...pathRoutes, ...instructorRoutes];
}
