"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Company } from "./types";
import { authenticateUser } from "@/app/actions/auth";

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getCompany: () => Company | null;
  updateCompanyData: (company: Company) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    const savedCompany = localStorage.getItem("auth_company");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedCompany) {
          setCompany(JSON.parse(savedCompany));
        }
      } catch {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_company");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const result = await authenticateUser(email, password);

        if (result.success && result.user) {
          // Cast types to match frontend interfaces
          const user = result.user as unknown as User;
          const company = result.company as unknown as Company;

          setUser(user);
          setCompany(company);

          localStorage.setItem("auth_user", JSON.stringify(user));
          if (company) {
            localStorage.setItem("auth_company", JSON.stringify(company));
          }

          return true;
        }
      } catch (error) {
        console.error("Login error:", error);
      }
      return false;
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_company");
  }, []);

  const getCompany = useCallback(() => {
    return company;
  }, [company]);

  const updateCompanyData = useCallback((updatedCompany: Company) => {
    setCompany(updatedCompany);
    localStorage.setItem("auth_company", JSON.stringify(updatedCompany));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isLoading,
        login,
        logout,
        getCompany,
        updateCompanyData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
