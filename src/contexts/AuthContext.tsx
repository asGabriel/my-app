import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authRequest, ApiError, setUnauthorizedHandler, TOKEN_KEY } from '../services/api';
import { schemas } from '../api/generated';
import { queryClient } from '../services/queryClient';
import { FINANCE_MOCK, MOCK_TOKEN, MOCK_USER } from '../finance/mock/config';
import type { AuthResponse, GoogleLoginRequest, UserResponse as User } from '../api/inferredTypes';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    loginWithGoogle: (idToken: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'auth_user';

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
        setUnauthorizedHandler(logout);
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            if (FINANCE_MOCK) {
                setToken(MOCK_TOKEN);
                setUser(MOCK_USER);
                setIsLoading(false);
                return;
            }

            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedToken) {
                setToken(storedToken);

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                try {
                    const response = await authRequest<unknown>('/me', {
                        method: 'GET',
                        token: storedToken,
                    });
                    const userData = schemas.UserResponse.parse(response);
                    setUser(userData);
                    localStorage.setItem(USER_KEY, JSON.stringify(userData));
                } catch (error) {
                    // 403: o e-mail saiu da allowlist depois do login.
                    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                        logout();
                    }
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, [logout]);

    const loginWithGoogle = async (idToken: string) => {
        queryClient.clear();

        const response = await authRequest<AuthResponse>('/google', {
            method: 'POST',
            body: JSON.stringify({ idToken } satisfies GoogleLoginRequest),
        });
        const { token: apiToken, user: userData } = schemas.AuthResponse.parse(response);

        localStorage.setItem(TOKEN_KEY, apiToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setToken(apiToken);
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                token,
                loginWithGoogle,
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
