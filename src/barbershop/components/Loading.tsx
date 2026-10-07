import { Spin } from 'antd';

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <Spin />
    </div>
  );
}
