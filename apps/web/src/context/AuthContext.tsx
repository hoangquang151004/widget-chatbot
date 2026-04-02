import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  public_key: string;
  secret_key: string;
  widget_color?: string;
  widget_placeholder?: string;
}

interface AuthContextType {
  secretKey: string | null;
  tenant: Tenant | null;
  isLoading: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  // Check storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("sk_key");
    if (savedKey) {
      verifyKey(savedKey);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyKey = async (key: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/me`, {
        headers: { "X-API-Key": key },
      });

      if (response.ok) {
        const data = await response.json();
        setSecretKey(key);
        setTenant(data);
        localStorage.setItem("sk_key", key);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error("Login verification failed:", error);
      logout();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setSecretKey(data.secret_key);
        localStorage.setItem("sk_key", data.secret_key);
        
        // Verify to get full tenant info
        await verifyKey(data.secret_key);
        router.push("/dashboard");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setSecretKey(null);
    setTenant(null);
    localStorage.removeItem("sk_key");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ secretKey, tenant, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
