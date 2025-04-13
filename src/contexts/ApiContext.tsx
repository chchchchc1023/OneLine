"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ApiConfig } from '@/types';
import { isUserConfigAllowed, getEnvAccessPassword } from '@/lib/env';

interface ApiContextType {
  apiConfig: ApiConfig;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  isConfigured: boolean;
  allowUserConfig: boolean;
  isPasswordProtected: boolean;
  validatePassword: (password: string) => boolean;
  isPasswordValidated: boolean;
  setPasswordValidated: (validated: boolean) => void;
}

const defaultApiConfig: ApiConfig = {
  endpoint: '',
  model: 'gemini-2.0-flash-exp-search',
  apiKey: '',
  allowUserConfig: true,
  accessPassword: '',
};

// 创建默认上下文值，避免服务器端渲染问题
const ApiContext = createContext<ApiContextType>({
  apiConfig: defaultApiConfig,
  updateApiConfig: () => {},
  isConfigured: false,
  allowUserConfig: true,
  isPasswordProtected: false,
  validatePassword: () => false,
  isPasswordValidated: false,
  setPasswordValidated: () => {},
});

export const useApi = () => useContext(ApiContext);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [allowUserConfig, setAllowUserConfig] = useState<boolean>(true);
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [isPasswordValidated, setIsPasswordValidated] = useState<boolean>(false);

  // 初始化API配置，优先使用localStorage
  useEffect(() => {
    try {
      // 检查是否允许用户配置
      const userConfigAllowed = isUserConfigAllowed();
      setAllowUserConfig(userConfigAllowed);

      // 获取环境变量中的访问密码
      const envAccessPassword = getEnvAccessPassword();

      // 设置是否启用密码保护
      setIsPasswordProtected(!!envAccessPassword);
      
      // 如果没有设置访问密码，则认为已通过验证
      if (!envAccessPassword) {
        setIsPasswordValidated(true);
      } else if (typeof window !== 'undefined') {
        // 只在客户端检查localStorage
        const passwordValidated = localStorage.getItem('oneLine_passwordValidated');
        setIsPasswordValidated(passwordValidated === 'true');
      }

      // 初始化配置对象
      let initialConfig: ApiConfig = { ...defaultApiConfig };

      // 如果允许用户配置，尝试从localStorage加载
      if (userConfigAllowed && typeof window !== 'undefined') {
        // 只在客户端访问localStorage
        const storedConfig = localStorage.getItem('oneLine_apiConfig');
        if (storedConfig) {
          try {
            const parsedConfig = JSON.parse(storedConfig);
            
            // 使用localStorage中的配置
            initialConfig = {
              endpoint: parsedConfig.endpoint || '',
              model: parsedConfig.model || defaultApiConfig.model,
              apiKey: parsedConfig.apiKey || '',
              allowUserConfig: userConfigAllowed,
              accessPassword: envAccessPassword || '',
            };
          } catch (e) {
            console.error('Failed to parse stored config:', e);
          }
        }
      }

      // 更新状态
      setApiConfig(initialConfig);
      setIsConfigured(!!initialConfig.endpoint && !!initialConfig.apiKey);
    } catch (error) {
      console.error('Failed to initialize API config:', error);
    }
  }, []);

  const updateApiConfig = (config: Partial<ApiConfig>) => {
    // 如果不允许用户配置，则不更新
    if (!allowUserConfig) return;

    setApiConfig(prev => {
      const newConfig = { ...prev, ...config };
      
      // 只在客户端保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('oneLine_apiConfig', JSON.stringify(newConfig));
      }
      
      // 更新isConfigured状态
      setIsConfigured(!!newConfig.endpoint && !!newConfig.apiKey);
      return newConfig;
    });
  };

  // 验证访问密码
  const validatePassword = (password: string): boolean => {
    if (!isPasswordProtected) return true;
    
    const isValid = password === apiConfig.accessPassword;
    if (isValid) {
      setIsPasswordValidated(true);
      // 只在客户端保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('oneLine_passwordValidated', 'true');
      }
    }
    return isValid;
  };

  // 安全地设置密码验证状态的函数
  const setPasswordValidatedSafe = (validated: boolean) => {
    setIsPasswordValidated(validated);
    // 只在客户端保存到localStorage
    if (typeof window !== 'undefined') {
      if (validated) {
        localStorage.setItem('oneLine_passwordValidated', 'true');
      } else {
        localStorage.removeItem('oneLine_passwordValidated');
      }
    }
  };

  return (
    <ApiContext.Provider value={{ 
      apiConfig, 
      updateApiConfig, 
      isConfigured, 
      allowUserConfig,
      isPasswordProtected,
      validatePassword,
      isPasswordValidated,
      setPasswordValidated: setPasswordValidatedSafe
    }}>
      {children}
    </ApiContext.Provider>
  );
}
