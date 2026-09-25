import type { MetadataRoute } from "next";
import { ROLES } from "@/lib/candidate/roles";

const SITE_URL = "https://talyntlabs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    {
      url: `${SITE_URL}/candidates`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/candidates/roles`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/candidates/how-we-evaluate`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/candidates/passport`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Role pages change as clients bring them, so they carry their own date.
    ...ROLES.map((role) => ({
      url: `${SITE_URL}/candidates/roles/${role.slug}`,
      lastModified: new Date(role.posted),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
