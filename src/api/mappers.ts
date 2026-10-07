export const destinationFromApi = (d: any) => ({
    id: d.id,
    name: d.name,
    country: d.country ?? '',
    city: d.city ?? '',
    description: d.description ?? '',
    thumbnailUrl: d.thumbnailUrl ?? null,
    latitude: d.latitude ?? '',
    longitude: d.longitude ?? '',
    climate: d.climate ?? '',
    bestTimeToVisit: d.bestTimeToVisit ?? '',
    isFeatured: !!d.isFeatured,
    tourCount: d.tourCount ?? 0,
    hotelCount: d.hotelCount ?? 0,
})

const num = (v: any) => (v === '' || v == null ? null : Number(v))
export const destinationToApi = (f: any) => ({
    name: f.name,
    country: f.country.trim(),
    city: f.city.trim(),
    description: f.description,
    latitude: num(f.latitude),
    longitude: num(f.longitude),
    climate: f.climate,
    bestTimeToVisit: f.bestTimeToVisit,
    isFeatured: f.isFeatured,
})

export function listOf(res: any, depth = 0): any[] {
  if (Array.isArray(res)) return res
  if (!res || typeof res !== 'object' || depth > 3) return []
  for (const key of ['items', 'data', 'results', 'records', 'content', 'rows']) {
    if (res[key] !== undefined) {
      const found = listOf(res[key], depth + 1)
      if (found.length || Array.isArray(res[key])) return found
    }
  }
  return []
}