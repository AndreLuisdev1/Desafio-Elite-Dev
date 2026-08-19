"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { User, UserRole } from "@/types"

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 1. Carrega dados persistidos ao montar a aplicação no navegador
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("cine_token")
      const storedUser = localStorage.getItem("cine_user")

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Falha ao recuperar sessão local:", error)
      localStorage.removeItem("cine_token")
      localStorage.removeItem("cine_user")
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. Realiza autenticação, salva credenciais e redireciona pelo perfil
  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Falha ao realizar login")
    }

    const data = await res.json()
    const userData: User = {
      id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
    }

    setToken(data.access_token)
    setUser(userData)
    localStorage.setItem("cine_token", data.access_token)
    localStorage.setItem("cine_user", JSON.stringify(userData))

    // Roteamento inteligente por Role
    if (userData.role === "ORGANIZER") {
      router.push("/catalog")
    } else if (userData.role === "GATEKEEPER") {
      router.push("/scanner")
    } else {
      router.push("/")
    }
  }

  // 3. Cadastra novo usuário e inicializa sessão
  async function register(name: string, email: string, password: string, role: UserRole) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || "Falha ao criar conta")
    }

    const data = await res.json()
    const userData: User = {
      id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
    }

    setToken(data.access_token)
    setUser(userData)
    localStorage.setItem("cine_token", data.access_token)
    localStorage.setItem("cine_user", JSON.stringify(userData))

    if (userData.role === "ORGANIZER") {
      router.push("/catalog")
    } else if (userData.role === "GATEKEEPER") {
      router.push("/scanner")
    } else {
      router.push("/")
    }
  }

  // 4. Limpa credenciais e envia para login
  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem("cine_token")
    localStorage.removeItem("cine_user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para consumo rápido e seguro
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider")
  }
  return context
}