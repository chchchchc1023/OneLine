import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // 从环境变量获取API端点和密钥
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiKey = process.env.API_KEY;

    // 检查环境变量是否配置
    if (!apiEndpoint || !apiKey) {
      return NextResponse.json(
        { error: '服务器API配置缺失' },
        { status: 500 }
      );
    }

    // 解析请求体
    const requestData = await request.json();

    // 从请求中获取模型名称，如果没有则使用环境变量中的默认值
    const model = requestData.model || process.env.API_MODEL || 'gemini-2.0-pro-exp-search';

    // 构建发送到实际API的请求
    const payload = {
      ...requestData,
      model: model
    };

    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 发送请求到实际API
    const response = await axios.post(apiEndpoint, payload, { headers });

    // 返回API响应
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API代理请求失败:', error);
    
    // 返回错误响应
    return NextResponse.json(
      { 
        error: '代理请求失败', 
        message: error.message,
        details: error.response?.data || '未知错误'
      },
      { status: error.response?.status || 500 }
    );
  }
}
