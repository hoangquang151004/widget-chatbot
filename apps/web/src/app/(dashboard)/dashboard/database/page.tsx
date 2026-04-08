"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";

type DatabaseType = "postgresql" | "mysql";

type DatabaseForm = {
  db_type: DatabaseType;
  db_host: string;
  db_port: string;
  db_name: string;
  db_username: string;
  db_password: string;
};

type DatabaseConfigResponse = {
  message?: string;
  config: {
    db_type: string;
    db_host: string;
    db_port: number;
    db_name: string;
    db_username: string;
    db_password: string;
  } | null;
};

type DatabaseTestResponse = {
  message: string;
  status: "success" | "error";
};

const DEFAULT_FORM: DatabaseForm = {
  db_type: "postgresql",
  db_host: "",
  db_port: "5432",
  db_name: "",
  db_username: "",
  db_password: "",
};

function normalizeDbType(value: string): DatabaseType {
  return value === "mysql" ? "mysql" : "postgresql";
}

function getDefaultPort(dbType: DatabaseType): string {
  return dbType === "mysql" ? "3306" : "5432";
}

function validateForm(form: DatabaseForm): string | null {
  if (!form.db_host.trim()) {
    return "Vui lòng nhập Host/IP.";
  }
  if (!form.db_port.trim()) {
    return "Vui lòng nhập Port.";
  }

  const port = Number(form.db_port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return "Port phải là số nguyên trong khoảng 1-65535.";
  }

  if (!form.db_name.trim()) {
    return "Vui lòng nhập tên Database.";
  }
  if (!form.db_username.trim()) {
    return "Vui lòng nhập Username.";
  }
  if (form.db_type !== "mysql" && !form.db_password.trim()) {
    return "Vui lòng nhập mật khẩu để lưu hoặc kiểm tra kết nối.";
  }

  return null;
}

export default function DatabasePage() {
  const api = useApi();
  const { accessToken } = useAuth();

  const [form, setForm] = useState<DatabaseForm>(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [hasStoredConfig, setHasStoredConfig] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = (await api.get(
        "/api/v1/admin/database",
      )) as DatabaseConfigResponse;
      if (data.config) {
        setHasStoredConfig(true);
        setForm({
          db_type: normalizeDbType(data.config.db_type),
          db_host: data.config.db_host || "",
          db_port: String(
            data.config.db_port ||
              getDefaultPort(normalizeDbType(data.config.db_type)),
          ),
          db_name: data.config.db_name || "",
          db_username: data.config.db_username || "",
          db_password: "",
        });
        setMessage(
          "Đã tải cấu hình hiện có. Vui lòng nhập lại mật khẩu trước khi lưu hoặc test.",
        );
      } else {
        setHasStoredConfig(false);
        setForm(DEFAULT_FORM);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải cấu hình database.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    loadConfig();
  }, [accessToken, loadConfig]);

  const applyDbType = (dbType: DatabaseType) => {
    setForm((prev) => ({
      ...prev,
      db_type: dbType,
      db_port: prev.db_port.trim() ? prev.db_port : getDefaultPort(dbType),
    }));
  };

  const handleInputChange = (field: keyof DatabaseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => ({
    db_type: form.db_type,
    db_host: form.db_host.trim(),
    db_port: Number(form.db_port),
    db_name: form.db_name.trim(),
    db_username: form.db_username.trim(),
    db_password: form.db_password,
  });

  const handleTestConnection = async () => {
    setError("");
    setMessage("");

    const validationError = validateForm(form);
    if (validationError) {
      setTestStatus("error");
      setError(validationError);
      return;
    }

    setIsTesting(true);
    try {
      const result = (await api.post(
        "/api/v1/admin/database/test",
        buildPayload(),
      )) as DatabaseTestResponse;
      if (result.status === "success") {
        setTestStatus("success");
        setMessage(result.message || "Kết nối thành công!");
      } else {
        setTestStatus("error");
        setError(result.message || "Kết nối thất bại.");
      }
    } catch (err: any) {
      setTestStatus("error");
      setError(err.message || "Không thể test kết nối.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const result = (await api.post(
        "/api/v1/admin/database",
        buildPayload(),
      )) as { message?: string };
      setHasStoredConfig(true);
      setMessage(result.message || "Đã lưu cấu hình database thành công.");
      setForm((prev) => ({ ...prev, db_password: "" }));
    } catch (err: any) {
      setError(err.message || "Lưu cấu hình database thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewRows = useMemo(
    () => [
      {
        label: "Engine",
        value: form.db_type === "postgresql" ? "PostgreSQL" : "MySQL",
      },
      { label: "Host", value: form.db_host || "Chưa nhập" },
      { label: "Port", value: form.db_port || "Chưa nhập" },
      { label: "Database", value: form.db_name || "Chưa nhập" },
      { label: "Username", value: form.db_username || "Chưa nhập" },
    ],
    [form],
  );

  const statusBadge = useMemo(() => {
    if (testStatus === "success") {
      return {
        text: "Connection OK",
        className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      };
    }
    if (testStatus === "error") {
      return {
        text: "Connection Error",
        className: "bg-red-100 text-red-700 border border-red-200",
      };
    }
    if (hasStoredConfig) {
      return {
        text: "Đã lưu cấu hình",
        className: "bg-primary/10 text-primary border border-primary/20",
      };
    }

    return {
      text: "Chưa cấu hình",
      className: "bg-slate-100 text-slate-600 border border-slate-200",
    };
  }, [hasStoredConfig, testStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
          Cấu hình Database (SQL)
        </h2>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Kết nối cơ sở dữ liệu của bạn để kích hoạt tính năng Text-to-SQL. AI
          sẽ tự động phân tích cấu trúc bảng và hỗ trợ truy vấn dữ liệu bằng
          ngôn ngữ tự nhiên.
        </p>
      </section>

      <div className="bg-tertiary-fixed text-on-tertiary-fixed px-6 py-4 rounded-3xl flex items-start gap-4 border border-tertiary/10 mb-6">
        <span
          className="material-symbols-outlined text-tertiary mt-1"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          warning
        </span>
        <div>
          <p className="font-bold text-sm">Cảnh báo bảo mật quan trọng</p>
          <p className="text-sm opacity-90 mt-1">
            Chúng tôi chỉ thực hiện quyền SELECT để truy vấn dữ liệu. Hãy đảm
            bảo User DB của bạn được phân quyền giới hạn để bảo mật tối đa cho
            hệ thống của bạn.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            id="database-connection-section"
            className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm scroll-mt-24"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                power
              </span>
              Thiết lập kết nối
            </h3>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Loại Database
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "PostgreSQL", value: "postgresql" as const },
                    { label: "MySQL", value: "mysql" as const },
                  ].map((db) => (
                    <label key={db.value} className="cursor-pointer">
                      <input
                        className="hidden peer"
                        checked={form.db_type === db.value}
                        name="db_type"
                        onChange={() => applyDbType(db.value)}
                        type="radio"
                      />
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-outline-variant/20 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                        <span className="font-semibold text-sm">
                          {db.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Host / IP
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="db.example.com"
                  type="text"
                  value={form.db_host}
                  onChange={(e) => handleInputChange("db_host", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Port
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder={form.db_type === "postgresql" ? "5432" : "3306"}
                  type="number"
                  min={1}
                  max={65535}
                  value={form.db_port}
                  onChange={(e) => handleInputChange("db_port", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Tên Database
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="production_analytics"
                  type="text"
                  value={form.db_name}
                  onChange={(e) => handleInputChange("db_name", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Username
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="readonly_user"
                  type="text"
                  value={form.db_username}
                  onChange={(e) =>
                    handleInputChange("db_username", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder={
                      hasStoredConfig
                        ? form.db_type === "mysql"
                          ? "MySQL có thể để trống nếu DB không dùng mật khẩu"
                          : "Nhập lại mật khẩu để test/lưu"
                        : "••••••••••••"
                    }
                    type={showPassword ? "text" : "password"}
                    value={form.db_password}
                    onChange={(e) =>
                      handleInputChange("db_password", e.target.value)
                    }
                  />
                  <button
                    className="absolute right-3 top-3 text-on-surface-variant text-[20px]"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                    aria-label="toggle password visibility"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-4 mt-4">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all disabled:opacity-60"
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSaving}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${isTesting ? "animate-spin" : ""}`}
                  >
                    sync
                  </span>
                  {isTesting ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                </button>

                <button
                  className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                  type="submit"
                  disabled={isSaving || isTesting}
                >
                  {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-3xl h-full border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  schema
                </span>
                Connection Preview
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${statusBadge.className}`}
              >
                {statusBadge.text}
              </span>
            </div>

            <div className="space-y-3">
              {previewRows.map((row) => (
                <div
                  key={row.label}
                  className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20"
                >
                  <div className="w-full flex items-center justify-between p-4 text-left hover:bg-surface transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        dns
                      </span>
                      <span className="font-bold text-sm">{row.label}</span>
                    </div>
                    <span
                      className="text-xs text-on-surface-variant font-mono max-w-[55%] truncate"
                      title={row.value}
                    >
                      {row.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[11px] text-primary font-bold uppercase tracking-widest mb-2">
                Trạng thái AI
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {testStatus === "success"
                  ? "Kết nối DB đã được xác thực. Hệ thống sẵn sàng cho luồng Text-to-SQL."
                  : "Backend hiện chưa cung cấp schema introspection endpoint. Sau khi test kết nối thành công, AI có thể dùng cấu hình đã lưu để truy vấn an toàn."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-12 overflow-hidden rounded-3xl relative h-48 group">
        <Image
          className="object-cover filter brightness-50 contrast-125 group-hover:scale-105 transition-transform duration-700"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-oBl0lqAtndnOX3ELDTy0stJoIz-wlIkfLAxa_wpvyyN60PGHbGbm3oA9_F3dhXWh3Px00rTWVCoRsBLFx1D0jnFfbuWB2o0e-bVVCqDeexC6LRQVj8raLX1INx8vyE34LgMxLeQMCjsS3lzvEmRjsbykLEquZdKnzImKTfPDgm7P15_IacGUiUQVe4CY4ZlAXDMuNxpQHfRTb3DsznxSJxcOFjiarMg1bxRqb0V58A0vNc5BMDthvhmE5V4wQ2kyHgQrcHRMBCKn"
          alt="Abstract decorative background"
          fill
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-12">
          <div className="max-w-md">
            <h4 className="text-white text-xl font-bold mb-2">
              Khám phá sức mạnh của dữ liệu
            </h4>
            <h4 className="text-white/80 text-sm">
              Hệ thống Text-to-SQL cho phép bạn tạo ra báo cáo chỉ bằng cách đặt
              câu hỏi. Không cần code, không cần chuyên môn kỹ thuật cao.
            </h4>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        onClick={() =>
          document
            .getElementById("database-connection-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        aria-label="Cuộn lên form thiết lập kết nối"
      >
        <span
          className="material-symbols-outlined text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          vertical_align_top
        </span>
      </button>
    </>
  );
}
