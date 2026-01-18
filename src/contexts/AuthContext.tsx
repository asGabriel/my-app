import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const MOCK_CREDENTIALS = {
    email: import.meta.env.VITE_EMAIL_DEFAULT,
    password: import.meta.env.VITE_PWD_DEFAULT,
    jwt: import.meta.env.VITE_JWT_DEFAULT,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem(USER_KEY);
        const storedToken = localStorage.getItem(TOKEN_KEY);

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }

        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        // TODO: Replace with your backend API call
        if (email !== MOCK_CREDENTIALS.email || password !== MOCK_CREDENTIALS.password) {
            throw new Error('Invalid credentials');
        }

        const mockUser: User = {
            id: '1',
            name: 'Administrador',
            email: MOCK_CREDENTIALS.email,
        };

        localStorage.setItem(TOKEN_KEY, MOCK_CREDENTIALS.jwt);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        setToken(MOCK_CREDENTIALS.jwt);
        setUser(mockUser);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
