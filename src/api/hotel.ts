import { api } from "./client";
import { ApiResponse } from "./destinations";

export interface PagedHotels {
    items: Hotel[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface Hotel {
    id: string;
    name: string;
    address: string;
    starRating: number;
    description: string;
    thumbnailUrl: string | null;
    latitude: number;
    longitude: number;
    averageRating: number | null;
    reviewCount: number;
    destinationId: string;
    destinationName: string;
    minRoomPrice: number | null;
}

export interface Room {
    id: string;
    roomType: string;
    description: string;
    pricePerNight: number;
    capacity: number;
    totalRooms?: number; // API có thể không trả về field này
    amenities: string;
    thumbnailUrl: string | null;
    isAvailable: boolean;
}

export interface RoomImage {
    id: string;
    roomId: string;
    imageUrl: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface HotelDetail extends Hotel {
    phone: string;
    email: string;
    website: string;
    amenities: string;
    images: unknown[];
    rooms: Room[];
}

export interface HotelCreatePayload {
    destinationId: string;
    name: string;
    address: string;
    starRating: number;
    description: string;
    latitude: number;
    longitude: number;
    phone: string;
    email: string;
    website: string;
    amenities: string;
}

export type HotelUpdatePayload = Omit<HotelCreatePayload, "destinationId"> & {
    isActive: boolean;
};

// Body POST /api/hotels/{hotelId}/rooms
export interface RoomCreatePayload {
    roomType: string;
    description: string;
    pricePerNight: number;
    capacity: number;
    totalRooms: number;
    amenities: string;
}


// Body PUT /api/hotels/{hotelId}/rooms/{id}
export type RoomUpdatePayload = RoomCreatePayload & { isAvailable: boolean };

// Body POST /api/rooms/{roomId}/images (ảnh phòng nhận URL, mỗi lần một ảnh)
export interface RoomImagePayload {
    imageUrl: string;
    displayOrder: number;
}

export const getHotels = async (params?: { page?: number; pageSize?: number }) => {
    const res = await api.get<ApiResponse<PagedHotels>>("/api/hotels", { params });
    return res.data;
};

export const getHotel = async (id: string) => {
    const res = await api.get<ApiResponse<HotelDetail>>(`/api/hotels/${id}`);
    return res.data;
};

export const createHotel = async (payload: HotelCreatePayload) => {
    const res = await api.post<ApiResponse<Hotel>>("/api/hotels", payload);
    return res.data;
};

export const updateHotel = async (id: string, payload: HotelUpdatePayload) => {
    const res = await api.put<ApiResponse<Hotel>>(`/api/hotels/${id}`, payload);
    return res.data;
};

export const deleteHotel = async (id: string) => {
    const res = await api.delete<ApiResponse<unknown>>(`/api/hotels/${id}`);
    return res.data;
};

export const uploadHotelImage = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse<unknown>>(`/api/hotels/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

// room
export const createRoom = async (hotelId: string, payload: RoomCreatePayload) => {
    const res = await api.post<ApiResponse<Room>>(`/api/hotels/${hotelId}/rooms`, payload);
    return res.data;
};

export const updateRoom = async (hotelId: string, roomId: string, payload: RoomUpdatePayload) => {
    const res = await api.put<ApiResponse<Room>>(`/api/hotels/${hotelId}/rooms/${roomId}`, payload);
    return res.data;
};

export const deleteRoom = async (hotelId: string, roomId: string) => {
    const res = await api.delete<ApiResponse<unknown>>(`/api/hotels/${hotelId}/rooms/${roomId}`);
    return res.data;
};

// ===== Ảnh phòng =====
export const getRoomImages = async (roomId: string) => {
    const res = await api.get<ApiResponse<RoomImage[]>>(`/api/rooms/${roomId}/images`);
    return res.data;
};

export const addRoomImage = async (roomId: string, payload: RoomImagePayload) => {
    const res = await api.post<ApiResponse<RoomImage>>(`/api/rooms/${roomId}/images`, payload);
    return res.data;
};

export const deleteRoomImage = async (roomId: string, imageId: string) => {
    const res = await api.delete<ApiResponse<unknown>>(`/api/rooms/${roomId}/images/${imageId}`);
    return res.data;
};

export const updateRoomImageOrder = async (roomId: string, imageId: string, displayOrder: number) => {
    const res = await api.put<ApiResponse<unknown>>(
        `/api/rooms/${roomId}/images/${imageId}/order`,
        { displayOrder }
    );
    return res.data;
};

