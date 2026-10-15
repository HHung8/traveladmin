import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { getInitials } from "../utils/user";
import { getTargetType, starts, TARGET_TYPES } from "../utils/reviews";
import { ReviewSummary, ReviewTargetType } from "../api/reviews";
import { useMyReviews, useReviewsTargets, useTargetReviews } from "../hooks/useReviews";
import { getErrorMessage } from "../utils/error";
import { fmtDateTime } from "../utils/bookings";
import ReviewDetailModal from "../components/ReviewDetailModal";
type Tab = "target" | "mine";

// Danh sách số trang hiển thị (tối đa 5 nút quanh trang hiện tại)
const getPageNumbers = (page: number, totalPages: number) => {
  const count = Math.min(5, totalPages);
  const start = Math.max(1, Math.min(page - 2, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setBroken(true)}
        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return <div className="user-avatar">{getInitials(name)}</div>;
}

function Thumb({ url, icon }: { url?: string | null; icon: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) return <div className="td-img">{icon}</div>;
  return <img className="td-img" src={url} alt="" onError={() => setBroken(true)} />;
}

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <div className="pagination-info">
        Trang {page} / {totalPages} · {total} đánh giá
      </div>
      <div className="pagination-btns">
        <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ‹
        </button>
        {getPageNumbers(page, totalPages).map((n) => (
          <button
            key={n}
            className={"page-btn" + (n === page ? " active" : "")}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          ›
        </button>
      </div>
    </div>
  );
}

const StarsCell = ({ rating }: { rating: number }) => (
  <div style={{ color: "#F59E0B", whiteSpace: "nowrap", letterSpacing: 1 }}>{starts(rating)}</div>
);

const CommentCell = ({ text }: { text: string }) => (
  <div
    style={{
      maxWidth: 320,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
    title={text}
  >
    {text || <span className="td-sub">Không có nội dung</span>}
  </div>
);

const VerifiedCell = ({ verified }: { verified: boolean }) =>
  verified ? <span className="badge badge-green">Đã xác thực</span> : <span className="td-sub">Chưa</span>;

export default function Reviews() {
  const { showToast } = useApp();

  const [tab, setTab] = useState<Tab>("target");

  // ===== Tab theo đối tượng =====
  const [type, setType] = useState<ReviewTargetType>("tour");
  const [targetId, setTargetId] = useState("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const { targets, loading: targetsLoading, error: targetsError } = useReviewsTargets(type);
  const tr = useTargetReviews(type, targetId, page);

  // Tự chọn đối tượng đầu tiên khi danh sách đã tải xong
  useEffect(() => {
    if (!targetsLoading && targets.length > 0 && !targets.some((t) => t.id === targetId)) {
      setTargetId(targets[0].id);
      setPage(1);
    }
  }, [targets, targetsLoading, targetId]);

  const selectedTarget = targets.find((t) => t.id === targetId);

  // Điểm trung bình: ưu tiên số liệu của đối tượng, không có (điểm tham quan) thì tính trên trang đang xem
  const avgRating = useMemo(() => {
    if (selectedTarget?.averageRating != null) return { value: selectedTarget.averageRating, approx: false };
    if (tr.items.length === 0) return null;
    return { value: tr.items.reduce((s, r) => s + r.rating, 0) / tr.items.length, approx: true };
  }, [selectedTarget, tr.items]);

  const filteredTarget = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return tr.items.filter((r) => {
      const matchRating = !ratingFilter || r.rating === Number(ratingFilter);
      const matchKeyword =
        !keyword ||
        r.userName.toLowerCase().includes(keyword) ||
        (r.comment ?? "").toLowerCase().includes(keyword);
      return matchRating && matchKeyword;
    });
  }, [tr.items, q, ratingFilter]);

  // ===== Tab của tôi =====
  const [minePage, setMinePage] = useState(1);
  const mine = useMyReviews(minePage);

  // ===== Xem chi tiết / xóa =====
  const [selected, setSelected] = useState<ReviewSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (r: ReviewSummary): Promise<boolean> => {
    if (!window.confirm("Xóa đánh giá này? Hành động này không thể hoàn tác.")) return false;
    setBusyId(r.id);
    try {
      if (tab === "target") {
        await tr.remove(r.id);
        // Xóa phần tử cuối của trang > 1 thì lùi về trang trước, ngược lại tải lại
        if (tr.items.length <= 1 && page > 1) setPage(page - 1);
        else tr.reload();
      } else {
        await mine.remove(r.id);
        if (mine.items.length <= 1 && minePage > 1) setMinePage(minePage - 1);
        else mine.reload();
      }
      showToast("Đã xóa đánh giá", "success");
      return true;
    } catch (err) {
      showToast(getErrorMessage(err, "Xóa đánh giá thất bại"), "error");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const message = (text: string, isError = false, onRetry?: () => void) => (
    <tr>
      <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className={isError ? undefined : "td-sub"}>
        {isError ? <div style={{ color: "var(--red)", marginBottom: onRetry ? 10 : 0 }}>{text}</div> : text}
        {isError && onRetry && (
          <button className="btn btn-outline btn-sm" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </td>
    </tr>
  );

  const actionCell = (r: ReviewSummary) => (
    <td>
      <div className="td-actions">
        <button className="btn btn-outline btn-sm" title="Xem chi tiết" onClick={() => setSelected(r)}>
          👁
        </button>
        <button
          className="btn btn-danger btn-sm"
          title="Xóa đánh giá"
          disabled={busyId === r.id}
          onClick={() => handleDelete(r)}
        >
          {busyId === r.id ? "..." : "🗑"}
        </button>
      </div>
    </td>
  );

  // ===== Giao diện: theo đối tượng =====
  const renderTargetRows = () => {
    if (targetsLoading) return message("Đang tải danh sách...");
    if (targetsError) return message(targetsError, true);
    if (targets.length === 0) return message("Chưa có dữ liệu để xem đánh giá");
    if (tr.loading) return message("Đang tải đánh giá...");
    if (tr.error) return message(tr.error, true, tr.reload);
    if (filteredTarget.length === 0) {
      return message(tr.items.length === 0 ? "Chưa có đánh giá nào" : "Không tìm thấy kết quả phù hợp");
    }
    return filteredTarget.map((r) => (
      <tr key={r.id}>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={r.userName} url={r.avatarUrl} />
            <div className="td-name">{r.userName || "Người dùng"}</div>
          </div>
        </td>
        <td>
          <StarsCell rating={r.rating} />
        </td>
        <td>
          <CommentCell text={r.comment} />
        </td>
        <td>
          <VerifiedCell verified={r.isVerified} />
        </td>
        <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.createdAt)}</td>
        {actionCell(r)}
      </tr>
    ));
  };

  // ===== Giao diện: của tôi =====
  const renderMineRows = () => {
    if (mine.loading) return message("Đang tải đánh giá...");
    if (mine.error) return message(mine.error, true, mine.reload);
    if (mine.items.length === 0) return message("Tài khoản này chưa có đánh giá nào");
    return mine.items.map((r) => {
      const t = getTargetType(r.targetType);
      return (
        <tr key={r.id}>
          <td>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Thumb key={r.thumbnailUrl ?? "none"} url={r.thumbnailUrl} icon={t.icon} />
              <div style={{ minWidth: 0 }}>
                <div
                  className="td-name"
                  style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {r.targetTitle}
                </div>
                <div className="td-sub">
                  {t.icon} {t.label}
                </div>
              </div>
            </div>
          </td>
          <td>
            <StarsCell rating={r.rating} />
          </td>
          <td>
            <CommentCell text={r.comment} />
          </td>
          <td>
            <VerifiedCell verified={r.isVerified} />
          </td>
          <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.createdAt)}</td>
          {actionCell(r)}
        </tr>
      );
    });
  };

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Đánh giá</div>
          <div className="section-sub">
            {tab === "target"
              ? selectedTarget
                ? `${selectedTarget.title}: ${tr.total} đánh giá`
                : "Chọn một đối tượng để xem đánh giá"
              : `${mine.total} đánh giá của tài khoản này`}
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={tab === "target" ? tr.reload : mine.reload}
          disabled={tab === "target" ? tr.loading : mine.loading}
        >
          ↻ Tải lại
        </button>
      </div>

      <div className="tab-bar">
        <button className={"tab-btn" + (tab === "target" ? " active" : "")} onClick={() => setTab("target")}>
          ⭐ Theo đối tượng
        </button>
        <button className={"tab-btn" + (tab === "mine" ? " active" : "")} onClick={() => setTab("mine")}>
          👤 Của tôi
        </button>
      </div>

      {tab === "target" ? (
        <>
          {selectedTarget && (
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <div className="stat-card">
                <div className="stat-label">Điểm trung bình{avgRating?.approx ? " (trang này)" : ""}</div>
                <div className="stat-value">{avgRating ? avgRating.value.toFixed(1) : "—"}</div>
                {avgRating && <div style={{ color: "#F59E0B" }}>{starts(avgRating.value)}</div>}
              </div>
              <div className="stat-card">
                <div className="stat-label">Tổng đánh giá</div>
                <div className="stat-value">{tr.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Đã xác thực (trang này)</div>
                <div className="stat-value">{tr.items.filter((r) => r.isVerified).length}</div>
              </div>
            </div>
          )}

          <div className="table-wrap">
            <div className="table-toolbar">
              <select
                className="filter-select"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as ReviewTargetType);
                  setTargetId("");
                  setPage(1);
                  setQ("");
                  setRatingFilter("");
                }}
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                style={{ maxWidth: 280 }}
                value={targetId}
                disabled={targetsLoading || targets.length === 0}
                onChange={(e) => {
                  setTargetId(e.target.value);
                  setPage(1);
                }}
              >
                {targetsLoading && <option value="">Đang tải...</option>}
                {!targetsLoading && targets.length === 0 && <option value="">Không có dữ liệu</option>}
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                    {t.reviewCount != null ? ` (${t.reviewCount})` : ""}
                  </option>
                ))}
              </select>
              <input
                className="search-input"
                type="text"
                placeholder="Tìm theo người đánh giá, nội dung..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className="filter-select"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="">Tất cả số sao</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} sao
                  </option>
                ))}
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Người đánh giá</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Xác thực</th>
                  <th>Ngày</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>{renderTargetRows()}</tbody>
            </table>

            <Pagination page={page} totalPages={tr.totalPages} total={tr.total} onChange={setPage} />
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Đối tượng</th>
                <th>Đánh giá</th>
                <th>Nội dung</th>
                <th>Xác thực</th>
                <th>Ngày</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>{renderMineRows()}</tbody>
          </table>

          <Pagination page={minePage} totalPages={mine.totalPage} total={mine.total} onChange={setMinePage} />
        </div>
      )}

      {selected && (
        <ReviewDetailModal
          review={selected}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}