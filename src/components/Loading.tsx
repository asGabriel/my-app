import { Spin } from 'antd';
import { ReactNode } from 'react';

interface LoadingProps {
    loading: boolean;
    children: ReactNode;
    size?: 'small' | 'default' | 'large';
}

export function Loading({ loading, children, size = 'small' }: LoadingProps) {
    if (loading) {
        return (
            <div className="flex-center" style={{ padding: 16 }}>
                <Spin size={size} />
            </div>
        );
    }

    return <>{children}</>;
}
