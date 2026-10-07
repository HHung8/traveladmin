import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(fetcher, deps = []) {
    const [state, setState] = useState<{ data: any; loading: boolean; error: string | null }>({ data: null, loading: true, error: null })
    const [n, setN] = useState(0) // tăng lên để tải lại
    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher // luôn dùng bản fetcher mới nhất

    useEffect(() => {
        let cancelled = false
        setState((s) => ({ ...s, loading: true, error: null }))
        Promise.resolve()
            .then(() => fetcherRef.current()) // lỗi ném đồng bộ cũng bị bắt ở đây
            .then((data) => !cancelled && setState({ data, loading: false, error: null }))
            .catch((e) => !cancelled && setState((s) => ({ ...s, loading: false, error: e?.message || String(e) })))
        return () => { cancelled = true }
    }, [...deps, n])

    const reload = useCallback(() => setN((x) => x + 1), [])
    return { ...state, reload }
}