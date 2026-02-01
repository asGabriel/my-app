import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authRequest, ApiError } from '../services/api';
import { schemas } from '../api/generated';
import { queryClient } from '../services/queryClient';

type UserResponse = typeof schemas.UserResponse._type;

interface User {
    id: string;
    clientId: string;
    username: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function mapUserResponse(response: UserResponse): User {
    return {
        id: response.id,
        clientId: response.clientId,
        username: response.username,
        name: response.name,
        email: response.email,
        isActive: response.is_active,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        queryClient.clear();
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedToken) {
                setToken(storedToken);

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                try {
                    const response = await authRequest<UserResponse>('/me', {
                        method: 'GET',
                        token: storedToken,
                    });
                    const userData = mapUserResponse(response);
                    setUser(userData);
                    localStorage.setItem(USER_KEY, JSON.stringify(userData));
                } catch (error) {
                    if (error instanceof ApiError && error.status === 401) {
                        logout();
                    }
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, [logout]);

    const login = async (username: string, password: string) => {
        queryClient.clear();

        const response = await authRequest<{ token: string; user: UserResponse }>('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        const userData = mapUserResponse(response.user);

        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setToken(response.token);
        setUser(userData);
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
