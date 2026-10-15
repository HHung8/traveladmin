import type { ReviewTargetType } from "../api/reviews";

export const TARGET_TYPES: { value: ReviewTargetType; label: string; icon: string }[] = [
    { value: "tour", label: "Tour", icon: "🗺️" },
    { value: "hotel", label: "Khách sạn", icon: "🏨" },
    { value: "attraction", label: "Điểm thăm quan", icon: "🎡" },
];

export const getTargetType = (type: string) =>
    TARGET_TYPES.find((t) => t.value === (type ?? "").toLowerCase()) ?? {
        value: type,
        label: type || "—",
        icon: "📋",
    };

export const starts = (rating: number) => {
    const n = Math.max(0, Math.min(5, Math.round(rating)));
    return "★".repeat(n) + "☆".repeat(5 - n);
};

export const normalizeReviewImages = (images: unknown[] | undefined) =>
    (images ?? [])
        .map((img) => {
            if (typeof img === "string") return { id: undefined as string | undefined, url: img };
            const o = (img ?? {}) as Record<string, unknown>;
            const url = (o.imageUrl ?? o.url ?? o.image) as string | undefined;
            const id = typeof o.id === "string" ? o.id : undefined;
            return { id, url };
        })
        .filter((i): i is { id: string | undefined; url: string } => typeof i.url === "string" && !!i.url);
