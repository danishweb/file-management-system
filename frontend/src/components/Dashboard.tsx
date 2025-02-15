import React from 'react';
import { Layout, Button, Typography, Space, message } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Text } = Typography;

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      message.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      message.error('Failed to logout');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        padding: '0 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          File Management System
        </Typography.Title>
        <Space>
          <Space>
            <UserOutlined />
            <Text strong>{user?.username}</Text>
          </Space>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            type="primary"
            danger
          >
            Logout
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: '24px' }}>
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          minHeight: '280px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          Dashboard Content
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
