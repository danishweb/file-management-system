import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        title="Login" 
        style={{ 
          width: 400,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Log in
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            Don't have an account? <a onClick={() => navigate('/register')}>Register now!</a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
