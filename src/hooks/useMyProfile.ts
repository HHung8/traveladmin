import { useCallback, useEffect, useState } from "react";
import { getMyProfile, MyProfile, updateMyProfile, UpdateProfilePayload, uploadMyAvatar } from "../api/user";
import { getErrorMessage } from "../utils/error";

export function useMyProfile() {
    const [profile, setProfile] = useState<MyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async (slient = false) => {
        if (!slient) setLoading(true);
        setError("");
        try {
            const res = await getMyProfile();
            if (!res.success) throw new Error(res.message || "Không tải được hồ sơ");
            setProfile(res.data);
            return res.data;
        } catch (error) {
            setError(getErrorMessage(error, "Không tải được hồ sơ"));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const save = useCallback(
        async (payload: UpdateProfilePayload) => {
            const res = await updateMyProfile(payload);
            if (!res.success) throw new Error(res.message || "Cập nhật hồ sơ thất bại");
            return load(true);
        },
        [load]
    );


    const changeAvatar = useCallback(
        async (file: File) => {
            const res = await uploadMyAvatar(file);
            if (!res.success) throw new Error(res.message || "Upload ảnh thất bại");
            return load(true);
        },
        [load]
    );

    return {profile, loading, error, reload: () => load(), save, changeAvatar};
    
}